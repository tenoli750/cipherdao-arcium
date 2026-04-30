import * as anchor from "@coral-xyz/anchor";
import { AddressLookupTableProgram, Keypair, PublicKey } from "@solana/web3.js";
import {
  awaitComputationFinalization,
  getArciumProgram,
  getClockAccAddress,
  getClusterAccAddress,
  getCompDefAccAddress,
  getCompDefAccOffset,
  getComputationAccAddress,
  getExecutingPoolAccAddress,
  getFeePoolAccAddress,
  getLookupTableAddress,
  getMXEAccAddress,
  getMXEPublicKey,
  getMempoolAccAddress,
  getRawCircuitAccAddress,
  RescueCipher,
  uploadCircuit,
  x25519
} from "@arcium-hq/client";
import { createHash, randomBytes } from "crypto";
import fs from "fs";
import idl from "./idl/private_dao.json";
import type { PrivateDao } from "./types/private_dao";

export type PrivateVoteChoice = "yes" | "no" | "abstain";

export const PROGRAM_ID = new PublicKey(idl.address);
export const DEVNET_CLUSTER_OFFSET = 456;
export const MAINNET_CLUSTER_OFFSET = 2026;

const CHOICE_TO_U8: Record<PrivateVoteChoice, number> = {
  yes: 0,
  no: 1,
  abstain: 2
};

const COMP_DEF_NAMES = [
  "init_private_ballot",
  "cast_private_vote",
  "publish_private_tally"
] as const;

const COMP_DEF_METHODS = {
  init_private_ballot: "initPrivateBallotCompDef",
  cast_private_vote: "initCastPrivateVoteCompDef",
  publish_private_tally: "initPublishPrivateTallyCompDef"
} as const;

const MAX_REALLOC_PER_IX = 10240;
const MAX_RESIZE_IX_PER_TX = 1;

function bnFromRandomU64(): anchor.BN {
  return new anchor.BN(randomBytes(8), "le");
}

function leBytesToBigInt(bytes: Uint8Array): bigint {
  return bytes.reduceRight((acc, value) => (acc << 8n) + BigInt(value), 0n);
}

function compDefOffset(name: string): number {
  return Buffer.from(getCompDefAccOffset(name)).readUInt32LE(0);
}

function hash32(input: string): number[] {
  return Array.from(createHash("sha256").update(input).digest());
}

export function loadKeypair(path: string): Keypair {
  const raw = JSON.parse(fs.readFileSync(path, "utf8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

export function createProvider(
  rpcUrl: string,
  keypairPath = `${process.env.HOME}/.config/solana/id.json`
): anchor.AnchorProvider {
  const connection = new anchor.web3.Connection(rpcUrl, "confirmed");
  const wallet = new anchor.Wallet(loadKeypair(keypairPath));
  return new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed"
  });
}

export function createProgram(provider: anchor.AnchorProvider): anchor.Program<PrivateDao> {
  return new anchor.Program(idl as PrivateDao, provider);
}

export function deriveDaoPda(programId = PROGRAM_ID): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from("dao")], programId)[0];
}

export function deriveProposalPda(
  proposalId: anchor.BN,
  dao = deriveDaoPda(),
  programId = PROGRAM_ID
): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("proposal"), dao.toBuffer(), proposalId.toArrayLike(Buffer, "le", 8)],
    programId
  )[0];
}

export function voterHashFromWallet(wallet: PublicKey): bigint {
  const digest = createHash("sha256").update(wallet.toBuffer()).digest();
  return leBytesToBigInt(digest.subarray(0, 16));
}

export async function initializeDao(params: {
  program: anchor.Program<PrivateDao>;
  authority?: PublicKey;
}) {
  const authority = params.authority ?? params.program.provider.publicKey;
  if (!authority) throw new Error("Provider wallet is missing");

  return params.program.methods
    .initializeDao(authority)
    .accountsPartial({ dao: deriveDaoPda(params.program.programId) })
    .rpc();
}

export async function createProposal(params: {
  program: anchor.Program<PrivateDao>;
  proposalId: anchor.BN;
  title: string;
  closesAtUnix: anchor.BN;
}) {
  const dao = deriveDaoPda(params.program.programId);
  const proposal = deriveProposalPda(params.proposalId, dao, params.program.programId);

  const signature = await params.program.methods
    .createProposal(params.proposalId, hash32(params.title), params.closesAtUnix)
    .accountsPartial({ dao, proposal })
    .rpc();

  return { signature, dao, proposal };
}

export async function initComputationDefinitions(params: {
  program: anchor.Program<PrivateDao>;
}) {
  const provider = params.program.provider as anchor.AnchorProvider;
  const mxeAccount = getMXEAccAddress(params.program.programId);
  const arciumProgram = getArciumProgram(provider);
  const mxe = await arciumProgram.account.mxeAccount.fetch(mxeAccount);
  const addressLookupTable = getLookupTableAddress(params.program.programId, mxe.lutOffsetSlot);

  const commonAccounts = {
    mxeAccount,
    addressLookupTable,
    lutProgram: AddressLookupTableProgram.programId
  };

  const signatures: string[] = [];
  for (const name of COMP_DEF_NAMES) {
    const compDefAccount = getCompDefAccAddress(params.program.programId, compDefOffset(name));
    const methodName = COMP_DEF_METHODS[name] as keyof typeof params.program.methods;

    const method = params.program.methods[methodName] as unknown as () => {
      accountsPartial(accounts: Record<string, PublicKey>): { rpc(): Promise<string> };
    };

    try {
      signatures.push(
        await method().accountsPartial({ ...commonAccounts, compDefAccount }).rpc()
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("already in use") && !message.includes("already initialized")) {
        throw error;
      }
    }

    const rawCircuit = fs.readFileSync(`build/${name}.arcis`);
    await ensureRawCircuitAccountSize({
      provider,
      circuitName: name,
      programId: params.program.programId,
      rawCircuit
    });
    signatures.push(
      ...(await uploadCircuit(
        provider,
        name,
        params.program.programId,
        rawCircuit,
        true,
        500,
        {
          skipPreflight: true,
          preflightCommitment: "confirmed",
          commitment: "confirmed"
        }
      ))
    );
  }

  return signatures;
}

async function ensureRawCircuitAccountSize(params: {
  provider: anchor.AnchorProvider;
  circuitName: string;
  programId: PublicKey;
  rawCircuit: Buffer;
}) {
  const arciumProgram = getArciumProgram(params.provider);
  const offset = compDefOffset(params.circuitName);
  const compDefAccount = getCompDefAccAddress(params.programId, offset);
  const rawCircuitIndex = 0;
  const rawCircuitAccount = getRawCircuitAccAddress(compDefAccount, rawCircuitIndex);
  const requiredAccountSize = params.rawCircuit.length + 9;

  let accountInfo = await params.provider.connection.getAccountInfo(rawCircuitAccount);
  if (!accountInfo) {
    await arciumProgram.methods
      .initRawCircuitAcc(offset, params.programId, rawCircuitIndex)
      .accounts({ signer: params.provider.publicKey })
      .rpc({ commitment: "confirmed" });
    accountInfo = await params.provider.connection.getAccountInfo(rawCircuitAccount);
  }

  let currentSize = accountInfo?.data.length ?? 9;
  while (currentSize < requiredAccountSize) {
    const remainingBytes = requiredAccountSize - currentSize;
    const ixCount = Math.min(
      MAX_RESIZE_IX_PER_TX,
      Math.ceil(remainingBytes / MAX_REALLOC_PER_IX)
    );
    const ix = await arciumProgram.methods
      .embiggenRawCircuitAcc(offset, params.programId, rawCircuitIndex)
      .accounts({ signer: params.provider.publicKey })
      .instruction();

    const tx = new anchor.web3.Transaction();
    for (let i = 0; i < ixCount; i += 1) tx.add(ix);
    await params.provider.sendAndConfirm(tx, [], {
      skipPreflight: true,
      preflightCommitment: "confirmed",
      commitment: "confirmed"
    });
    currentSize += ixCount * MAX_REALLOC_PER_IX;
  }
}

function arciumQueueAccounts(params: {
  programId: PublicKey;
  clusterOffset: number;
  computationOffset: anchor.BN;
  compDefName: string;
}) {
  return {
    mxeAccount: getMXEAccAddress(params.programId),
    mempoolAccount: getMempoolAccAddress(params.clusterOffset),
    executingPool: getExecutingPoolAccAddress(params.clusterOffset),
    computationAccount: getComputationAccAddress(
      params.clusterOffset,
      params.computationOffset
    ),
    compDefAccount: getCompDefAccAddress(params.programId, compDefOffset(params.compDefName)),
    clusterAccount: getClusterAccAddress(params.clusterOffset),
    poolAccount: getFeePoolAccAddress(),
    clockAccount: getClockAccAddress()
  };
}

export async function initPrivateBallot(params: {
  program: anchor.Program<PrivateDao>;
  proposal: PublicKey;
  clusterOffset: number;
}) {
  const computationOffset = bnFromRandomU64();

  const signature = await params.program.methods
    .initPrivateBallot(computationOffset)
    .accountsPartial({
      proposal: params.proposal,
      ...arciumQueueAccounts({
        programId: params.program.programId,
        clusterOffset: params.clusterOffset,
        computationOffset,
        compDefName: "init_private_ballot"
      })
    })
    .rpc({ commitment: "confirmed" });

  const finalizeSignature = await awaitComputationFinalization(
    params.program.provider as anchor.AnchorProvider,
    computationOffset,
    params.program.programId,
    "confirmed"
  );

  return { signature, finalizeSignature, computationOffset };
}

async function getMXEPublicKeyWithRetry(
  provider: anchor.AnchorProvider,
  programId: PublicKey,
  attempts = 20
): Promise<Uint8Array> {
  for (let i = 0; i < attempts; i += 1) {
    const key = await getMXEPublicKey(provider, programId);
    if (key) return key;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("MXE X25519 public key is not available yet");
}

export async function castPrivateVote(params: {
  program: anchor.Program<PrivateDao>;
  proposal: PublicKey;
  voterHash: bigint;
  choice: PrivateVoteChoice;
  encryptedStateNonce: bigint;
  clusterOffset: number;
}) {
  const provider = params.program.provider as anchor.AnchorProvider;
  const privateKey = x25519.utils.randomSecretKey();
  const publicKey = x25519.getPublicKey(privateKey);
  const mxePublicKey = await getMXEPublicKeyWithRetry(provider, params.program.programId);
  const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
  const cipher = new RescueCipher(sharedSecret);
  const nonce = randomBytes(16);
  const ciphertext = cipher.encrypt(
    [params.voterHash, BigInt(CHOICE_TO_U8[params.choice])],
    nonce
  );
  const computationOffset = bnFromRandomU64();

  const signature = await params.program.methods
    .castPrivateVote(
      computationOffset,
      new anchor.BN(params.encryptedStateNonce.toString()),
      ciphertext[0],
      ciphertext[1],
      Array.from(publicKey),
      new anchor.BN(leBytesToBigInt(nonce).toString())
    )
    .accountsPartial({
      proposal: params.proposal,
      ...arciumQueueAccounts({
        programId: params.program.programId,
        clusterOffset: params.clusterOffset,
        computationOffset,
        compDefName: "cast_private_vote"
      })
    })
    .rpc({ commitment: "confirmed" });

  const finalizeSignature = await awaitComputationFinalization(
    provider,
    computationOffset,
    params.program.programId,
    "confirmed"
  );

  return {
    signature,
    finalizeSignature,
    computationOffset,
    publicKey: Array.from(publicKey),
    ciphertexts: ciphertext
  };
}

export async function publishPrivateTally(params: {
  program: anchor.Program<PrivateDao>;
  proposal: PublicKey;
  encryptedStateNonce: bigint;
  clusterOffset: number;
}) {
  const computationOffset = bnFromRandomU64();

  const signature = await params.program.methods
    .publishPrivateTally(
      computationOffset,
      new anchor.BN(params.encryptedStateNonce.toString())
    )
    .accountsPartial({
      proposal: params.proposal,
      ...arciumQueueAccounts({
        programId: params.program.programId,
        clusterOffset: params.clusterOffset,
        computationOffset,
        compDefName: "publish_private_tally"
      })
    })
    .rpc({ commitment: "confirmed" });

  const finalizeSignature = await awaitComputationFinalization(
    params.program.provider as anchor.AnchorProvider,
    computationOffset,
    params.program.programId,
    "confirmed"
  );

  return { signature, finalizeSignature, computationOffset };
}
