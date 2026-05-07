import * as anchor from "@coral-xyz/anchor";
import {
  AddressLookupTableProgram,
  Keypair,
  PublicKey,
  Transaction
} from "@solana/web3.js";
import {
  awaitComputationFinalization,
  CircuitSource,
  getArciumProgram,
  getCircuitState,
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
  "init_private_ballot_v2",
  "cast_private_vote_v2",
  "publish_private_tally_v2"
] as const;

const COMP_DEF_METHODS = {
  init_private_ballot_v2: "initPrivateBallotCompDef",
  cast_private_vote_v2: "initCastPrivateVoteCompDef",
  publish_private_tally_v2: "initPublishPrivateTallyCompDef"
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

function keypairText(source: string) {
  const trimmed = source.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("[")) return trimmed;
  if (trimmed.startsWith("base64:")) {
    return Buffer.from(trimmed.slice("base64:".length), "base64").toString("utf8");
  }
  return fs.readFileSync(trimmed, "utf8");
}

export function loadKeypair(source: string): Keypair {
  const text = keypairText(source);
  if (!text) return Keypair.generate();
  const raw = JSON.parse(text) as number[];
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

export async function buildCreateProposalInstruction(params: {
  program: anchor.Program<PrivateDao>;
  proposalId: anchor.BN;
  title: string;
  closesAtUnix: anchor.BN;
}) {
  const dao = deriveDaoPda(params.program.programId);
  const proposal = deriveProposalPda(params.proposalId, dao, params.program.programId);
  const instruction = await params.program.methods
    .createProposal(params.proposalId, hash32(params.title), params.closesAtUnix)
    .accountsPartial({ dao, proposal })
    .instruction();

  return { instruction, dao, proposal };
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

    const compDef = await arciumProgram.account.computationDefinitionAccount.fetch(compDefAccount);
    const circuitState = getCircuitState(compDef.circuitSource as CircuitSource);
    if (circuitState !== "OnchainPending") {
      continue;
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
  const { instruction, computationOffset } = await buildInitPrivateBallotInstruction(params);
  const provider = params.program.provider as anchor.AnchorProvider;
  const signature = await provider.sendAndConfirm(new Transaction().add(instruction), [], {
    commitment: "confirmed",
    preflightCommitment: "confirmed"
  });

  const finalizeSignature = await awaitComputationFinalization(
    provider,
    computationOffset,
    params.program.programId,
    "confirmed"
  );

  return { signature, finalizeSignature, computationOffset };
}

export async function buildInitPrivateBallotInstruction(params: {
  program: anchor.Program<PrivateDao>;
  proposal: PublicKey;
  clusterOffset: number;
}) {
  const computationOffset = bnFromRandomU64();
  const instruction = await params.program.methods
    .initPrivateBallot(computationOffset)
    .accountsPartial({
      proposal: params.proposal,
      ...arciumQueueAccounts({
        programId: params.program.programId,
        clusterOffset: params.clusterOffset,
        computationOffset,
        compDefName: "init_private_ballot_v2"
      })
    })
    .instruction();

  return { instruction, computationOffset };
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

export async function fetchMxePublicKey(params: {
  program: anchor.Program<PrivateDao>;
}) {
  return getMXEPublicKeyWithRetry(
    params.program.provider as anchor.AnchorProvider,
    params.program.programId
  );
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
  const { instruction, computationOffset, ephemeralPublicKey, ciphertexts } =
    await buildCastPrivateVoteInstruction(params);
  const signature = await provider.sendAndConfirm(new Transaction().add(instruction), [], {
    commitment: "confirmed",
    preflightCommitment: "confirmed"
  });

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
    publicKey: Array.from(ephemeralPublicKey),
    ciphertexts
  };
}

export async function buildCastPrivateVoteInstruction(params: {
  program: anchor.Program<PrivateDao>;
  proposal: PublicKey;
  voterHash: bigint;
  choice: PrivateVoteChoice;
  encryptedStateNonce: bigint;
  clusterOffset: number;
}) {
  const provider = params.program.provider as anchor.AnchorProvider;
  const privateKey = x25519.utils.randomSecretKey();
  const ephemeralPublicKey = x25519.getPublicKey(privateKey);
  const mxePublicKey = await getMXEPublicKeyWithRetry(provider, params.program.programId);
  const sharedSecret = x25519.getSharedSecret(privateKey, mxePublicKey);
  const cipher = new RescueCipher(sharedSecret);
  const nonce = randomBytes(16);
  const ciphertexts = cipher.encrypt(
    [params.voterHash, BigInt(CHOICE_TO_U8[params.choice])],
    nonce
  );
  const built = await buildCastPrivateVoteInstructionFromCiphertexts({
    program: params.program,
    proposal: params.proposal,
    encryptedStateNonce: params.encryptedStateNonce,
    clusterOffset: params.clusterOffset,
    ciphertexts,
    ephemeralPublicKey: Array.from(ephemeralPublicKey),
    nonce: leBytesToBigInt(nonce)
  });

  return { ...built, ephemeralPublicKey, ciphertexts };
}

export async function buildCastPrivateVoteInstructionFromCiphertexts(params: {
  program: anchor.Program<PrivateDao>;
  proposal: PublicKey;
  encryptedStateNonce: bigint;
  clusterOffset: number;
  ciphertexts: number[][];
  ephemeralPublicKey: number[];
  nonce: bigint;
}) {
  const computationOffset = bnFromRandomU64();
  const instruction = await params.program.methods
    .castPrivateVote(
      computationOffset,
      new anchor.BN(params.encryptedStateNonce.toString()),
      params.ciphertexts[0],
      params.ciphertexts[1],
      params.ephemeralPublicKey,
      new anchor.BN(params.nonce.toString())
    )
    .accountsPartial({
      proposal: params.proposal,
      ...arciumQueueAccounts({
        programId: params.program.programId,
        clusterOffset: params.clusterOffset,
        computationOffset,
        compDefName: "cast_private_vote_v2"
      })
    })
    .instruction();

  return { instruction, computationOffset };
}

export async function publishPrivateTally(params: {
  program: anchor.Program<PrivateDao>;
  proposal: PublicKey;
  encryptedStateNonce: bigint;
  clusterOffset: number;
}) {
  const { instruction, computationOffset } = await buildPublishPrivateTallyInstruction(params);
  const provider = params.program.provider as anchor.AnchorProvider;
  const signature = await provider.sendAndConfirm(new Transaction().add(instruction), [], {
    commitment: "confirmed",
    preflightCommitment: "confirmed"
  });

  const finalizeSignature = await awaitComputationFinalization(
    provider,
    computationOffset,
    params.program.programId,
    "confirmed"
  );

  return { signature, finalizeSignature, computationOffset };
}

export async function buildPublishPrivateTallyInstruction(params: {
  program: anchor.Program<PrivateDao>;
  proposal: PublicKey;
  encryptedStateNonce: bigint;
  clusterOffset: number;
}) {
  const computationOffset = bnFromRandomU64();
  const instruction = await params.program.methods
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
        compDefName: "publish_private_tally_v2"
      })
    })
    .instruction();

  return { instruction, computationOffset };
}

export async function waitForPrivateComputationFinalization(params: {
  program: anchor.Program<PrivateDao>;
  computationOffset: anchor.BN;
}) {
  return awaitComputationFinalization(
    params.program.provider as anchor.AnchorProvider,
    params.computationOffset,
    params.program.programId,
    "confirmed"
  );
}
