import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import {
  castPrivateVote,
  createProgram,
  createProposal as createDaoProposal,
  createProvider,
  DEVNET_CLUSTER_OFFSET,
  deriveDaoPda,
  initComputationDefinitions,
  initializeDao,
  initPrivateBallot,
  publishPrivateTally,
  voterHashFromWallet
} from "./privateDaoClient";

export type VoteChoice = "yes" | "no" | "abstain";

type ReceiptRecord = {
  id: string;
  signature: string;
  finalizeSignature: string;
  createdAt: number;
};

type ProposalRecord = {
  proposal: string;
  proposalId: string;
  title: string;
  summary: string;
  quorum: number;
  createdAt: number;
  receipts: ReceiptRecord[];
  initSignature?: string;
  initFinalizeSignature?: string;
  tallySignature?: string;
  tallyFinalizeSignature?: string;
};

type SiteState = {
  proposals: ProposalRecord[];
};

const DEFAULT_RPC_URL = "https://api.devnet.solana.com";
const STATE_PATH = path.join(process.cwd(), "artifacts", "site-proposals.json");

const DEFAULT_STATE: SiteState = {
  proposals: [
    {
      proposal: "45jmnipw7eUj6hpUuemxDKRqP6JpSiXghuCJ2LECPyg6",
      proposalId: "1021",
      title: "Fund confidential governance grants",
      summary: "Verified devnet proposal with one encrypted yes vote and a private Arcium tally.",
      quorum: 1,
      createdAt: 1777629505,
      receipts: [
        {
          id: "rcpt_5sBR75wN",
          signature: "5sBR75wN4REpm1PpXiY2tzZRNKa5tgYkjRD5CUSUgqov2KZSYa2U6WbEoDCyGksa1kWaHk2QQUsxUfrhMLHwJgWs",
          finalizeSignature: "5Qi4eysWePc3aANsMqqteUjR268Kt6FhmGG85zzEPEFugQmdmzHQ3t5vyUAwed3af6yygGV3ktuZdoyBHEVTmwEx",
          createdAt: 1777629550
        }
      ],
      tallySignature: "4fZc25jYqMv8etEsmdFrXNhU5G41jHGfxKRTV2Gu84D9SUuSTdcUWRnWQjB1TMVDauoD1jM6ynYCw3S5dj1mt47C",
      tallyFinalizeSignature: "5LgVj2FEYiydQnCZ4tsxbqhm6SMsbJh8XVJY7UPY1Xnwd5qY3A9pENJ2zJBFxgmCY3MAJuszwRYcNPhiLSVT9Ba7"
    }
  ]
};

function rpcUrl() {
  return process.env.RPC_URL ?? DEFAULT_RPC_URL;
}

function keypairPath() {
  return process.env.KEYPAIR ?? `${process.env.HOME}/.config/solana/id.json`;
}

function clusterOffset() {
  return Number(process.env.ARCIUM_CLUSTER_OFFSET ?? DEVNET_CLUSTER_OFFSET);
}

function readState(): SiteState {
  if (!fs.existsSync(STATE_PATH)) return structuredClone(DEFAULT_STATE);
  const raw = JSON.parse(fs.readFileSync(STATE_PATH, "utf8")) as SiteState;
  return {
    proposals: Array.isArray(raw.proposals) ? raw.proposals : []
  };
}

function writeState(state: SiteState) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
}

function providerAndProgram() {
  const provider = createProvider(rpcUrl(), keypairPath());
  anchor.setProvider(provider);
  return {
    provider,
    program: createProgram(provider)
  };
}

function leBytesToBigInt(bytes: ArrayLike<number>) {
  return Array.from(bytes).reduceRight((acc, value) => (acc << 8n) + BigInt(value), 0n);
}

function shortSignature(signature: string) {
  return `${signature.slice(0, 8)}...${signature.slice(-8)}`;
}

function normalizeError(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function fetchProposal(record: ProposalRecord) {
  const { program } = providerAndProgram();
  const proposalKey = new PublicKey(record.proposal);
  const account = await program.account.proposal.fetch(proposalKey);
  const stateNonce = leBytesToBigInt(account.encryptedStateNonce).toString();

  return {
    proposal: proposalKey.toBase58(),
    proposalId: account.proposalId.toString(),
    title: record.title,
    summary: record.summary,
    quorum: record.quorum,
    closesAt: Number(account.closesAt.toString()),
    finalized: account.finalized,
    encryptedStateChunks: account.encryptedState.length,
    stateNonce,
    yes: account.yes,
    no: account.no,
    abstain: account.abstain,
    total: account.total,
    receipts: record.receipts,
    initSignature: record.initSignature,
    initFinalizeSignature: record.initFinalizeSignature,
    tallySignature: record.tallySignature,
    tallyFinalizeSignature: record.tallyFinalizeSignature
  };
}

export async function getStatus() {
  const state = readState();
  const { provider, program } = providerAndProgram();
  const wallet = provider.wallet.publicKey;
  const balanceLamports = await provider.connection.getBalance(wallet, "confirmed");
  const proposals = [];

  for (const record of state.proposals) {
    try {
      proposals.push(await fetchProposal(record));
    } catch (error) {
      proposals.push({
        proposal: record.proposal,
        proposalId: record.proposalId,
        title: record.title,
        summary: `${record.summary} (${normalizeError(error)})`,
        quorum: record.quorum,
        closesAt: 0,
        finalized: false,
        encryptedStateChunks: 0,
        stateNonce: "0",
        yes: 0,
        no: 0,
        abstain: 0,
        total: 0,
        receipts: record.receipts
      });
    }
  }

  return {
    config: {
      rpcUrl: rpcUrl(),
      clusterOffset: clusterOffset(),
      programId: program.programId.toBase58(),
      dao: deriveDaoPda(program.programId).toBase58(),
      relayer: wallet.toBase58(),
      relayerBalanceSol: balanceLamports / anchor.web3.LAMPORTS_PER_SOL
    },
    proposals
  };
}

export async function createSiteProposal(params: {
  title: string;
  summary: string;
  quorum: number;
  closesInSeconds: number;
}) {
  const title = params.title.trim();
  const summary = params.summary.trim();
  const quorum = Math.max(1, Math.min(99, Math.floor(params.quorum || 1)));
  const closesInSeconds = Math.max(45, Math.min(7 * 24 * 60 * 60, Math.floor(params.closesInSeconds || 180)));

  if (!title) throw new Error("Title is required");
  if (!summary) throw new Error("Summary is required");

  const { provider, program } = providerAndProgram();

  try {
    await initializeDao({ program });
  } catch (error) {
    const message = normalizeError(error);
    if (!message.includes("already in use") && !message.includes("already initialized")) {
      throw error;
    }
  }

  await initComputationDefinitions({ program });

  const proposalId = new anchor.BN(Date.now().toString());
  const closesAtUnix = new anchor.BN(Math.floor(Date.now() / 1000) + closesInSeconds);
  const created = await createDaoProposal({
    program,
    proposalId,
    title,
    closesAtUnix
  });
  const initialized = await initPrivateBallot({
    program,
    proposal: created.proposal,
    clusterOffset: clusterOffset()
  });

  const record: ProposalRecord = {
    proposal: created.proposal.toBase58(),
    proposalId: proposalId.toString(),
    title,
    summary,
    quorum,
    createdAt: Math.floor(Date.now() / 1000),
    receipts: [],
    initSignature: initialized.signature,
    initFinalizeSignature: initialized.finalizeSignature
  };

  const state = readState();
  state.proposals.unshift(record);
  writeState(state);

  return {
    proposal: await fetchProposal(record),
    transactions: {
      createProposal: created.signature,
      initPrivateBallot: initialized.signature,
      initFinalized: initialized.finalizeSignature
    }
  };
}

export async function castSiteVote(params: {
  proposal: string;
  choice: VoteChoice;
}) {
  const state = readState();
  const record = state.proposals.find((item) => item.proposal === params.proposal);
  if (!record) throw new Error("Unknown proposal");
  if (!["yes", "no", "abstain"].includes(params.choice)) throw new Error("Unknown vote choice");

  const { provider, program } = providerAndProgram();
  const account = await fetchProposal(record);
  if (account.finalized) throw new Error("Proposal is finalized");
  if (account.encryptedStateChunks === 0 || account.stateNonce === "0") {
    throw new Error("Private ballot state is not initialized");
  }
  if (Date.now() / 1000 >= account.closesAt) throw new Error("Proposal is closed");

  const result = await castPrivateVote({
    program,
    proposal: new PublicKey(record.proposal),
    voterHash: voterHashFromWallet(provider.wallet.publicKey),
    choice: params.choice,
    encryptedStateNonce: BigInt(account.stateNonce),
    clusterOffset: clusterOffset()
  });

  record.receipts.push({
    id: `rcpt_${shortSignature(result.signature)}`,
    signature: result.signature,
    finalizeSignature: result.finalizeSignature,
    createdAt: Math.floor(Date.now() / 1000)
  });
  writeState(state);

  return {
    proposal: await fetchProposal(record),
    transactions: {
      castPrivateVote: result.signature,
      finalized: result.finalizeSignature
    }
  };
}

export async function publishSiteTally(params: { proposal: string }) {
  const state = readState();
  const record = state.proposals.find((item) => item.proposal === params.proposal);
  if (!record) throw new Error("Unknown proposal");

  const { program } = providerAndProgram();
  const account = await fetchProposal(record);
  if (account.finalized) return { proposal: account, transactions: {} };
  if (account.encryptedStateChunks === 0 || account.stateNonce === "0") {
    throw new Error("Private ballot state is not initialized");
  }

  const result = await publishPrivateTally({
    program,
    proposal: new PublicKey(record.proposal),
    encryptedStateNonce: BigInt(account.stateNonce),
    clusterOffset: clusterOffset()
  });

  record.tallySignature = result.signature;
  record.tallyFinalizeSignature = result.finalizeSignature;
  writeState(state);

  return {
    proposal: await fetchProposal(record),
    transactions: {
      publishPrivateTally: result.signature,
      finalized: result.finalizeSignature
    }
  };
}
