import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import {
  buildCastPrivateVoteInstruction,
  buildCastPrivateVoteInstructionFromCiphertexts,
  buildCreateProposalInstruction,
  buildInitPrivateBallotInstruction,
  buildPublishPrivateTallyInstruction,
  castPrivateVote,
  createProgram,
  createProposal as createDaoProposal,
  createProvider,
  DEVNET_CLUSTER_OFFSET,
  deriveDaoPda,
  deriveProposalPda,
  fetchMxePublicKey,
  initComputationDefinitions,
  initializeDao,
  publishPrivateTally,
  waitForPrivateComputationFinalization,
  voterHashFromWallet
} from "./privateDaoClient";
import type { PrivateDao } from "./types/private_dao";

export type VoteChoice = "yes" | "no" | "abstain";

type LocalizedText = {
  en: string;
  ko?: string;
};

type ChoiceImages = {
  a: string;
  b: string;
  status?: "generated" | "placeholder" | "failed";
  error?: string;
};

type ReceiptRecord = {
  id: string;
  signature: string;
  finalizeSignature: string;
  createdAt: number;
  wallet?: string;
};

type ProposalRecord = {
  demo?: boolean;
  proposal: string;
  proposalId: string;
  title: string;
  summary: string;
  quorum: number;
  createdAt: number;
  receipts: ReceiptRecord[];
  closesAt?: number;
  finalized?: boolean;
  encryptedStateChunks?: number;
  stateNonce?: string;
  yes?: number;
  no?: number;
  abstain?: number;
  total?: number;
  slug?: string;
  prompt?: LocalizedText;
  category?: LocalizedText;
  optionA?: LocalizedText;
  optionB?: LocalizedText;
  images?: ChoiceImages;
  initSignature?: string;
  initFinalizeSignature?: string;
  tallySignature?: string;
  tallyFinalizeSignature?: string;
};

type SiteState = {
  proposals: ProposalRecord[];
};

type DilemmaSeed = {
  id: string;
  category: string;
  a: LocalizedText;
  b: LocalizedText;
};

type DilemmaBank = {
  categories: Record<string, LocalizedText>;
  dilemmas: DilemmaSeed[];
};

type WalletProposalMetadata = {
  publicKey: string;
  proposal: string;
  proposalId: string;
  title: string;
  summary: string;
  quorum: number;
  slug?: string;
  prompt?: LocalizedText;
  category?: LocalizedText;
  optionA?: LocalizedText;
  optionB?: LocalizedText;
  images?: ChoiceImages;
  initComputationOffset: string;
  signature: string;
};

type EncryptedVotePayload = {
  ciphertexts: number[][];
  ephemeralPublicKey: number[];
  nonce: string;
};

type PgQueryResult = {
  rows: Array<Record<string, unknown>>;
};

type PgPool = {
  query(sql: string, values?: unknown[]): Promise<PgQueryResult>;
};

type PgPoolConstructor = new (config: {
  connectionString: string;
  max?: number;
  ssl?: { rejectUnauthorized: boolean } | boolean;
}) => PgPool;

const DEFAULT_RPC_URL = "https://api.devnet.solana.com";
const STATE_PATH = process.env.SITE_STATE_PATH
  || (process.env.VERCEL
    ? path.join("/tmp", "site-proposals.json")
    : path.join(process.cwd(), "artifacts", "site-proposals.json"));
const GENERATED_ASSETS_DIR = process.env.GENERATED_ASSETS_DIR
  || (process.env.VERCEL
    ? path.join("/tmp", "generated")
    : path.join(process.cwd(), "site", "generated"));
const PLACEHOLDER_IMAGES: ChoiceImages = {
  a: "/assets/choice-placeholder.png",
  b: "/assets/choice-placeholder.png",
  status: "placeholder"
};

const DILEMMA_BANK_PATH = path.join(process.cwd(), "site", "src", "dilemmas.js");
const SUPABASE_STATE_TABLE = process.env.SUPABASE_STATE_TABLE || "would_you_dao_state";
const SUPABASE_STATE_ID = process.env.SUPABASE_STATE_ID || "production";
const DEMO_WEEK_SECONDS = 7 * 24 * 60 * 60;
const WEEKLY_DEMO_BATCH_SIZE = 10;
const DEMO_SCHEDULE_EPOCH_UNIX = 1767571200; // 2026-01-05T00:00:00Z
const HOT_DEMO_TALLIES = [
  {
    slug: "hygiene-teeth-3-hair-7",
    yes: 74,
    no: 61,
    abstain: 8
  },
  {
    slug: "food-chicken-pizza",
    yes: 69,
    no: 92,
    abstain: 5
  },
  {
    slug: "daily-kakaotalk-phone",
    yes: 48,
    no: 87,
    abstain: 6
  },
  {
    slug: "money-free-delivery-taxi",
    yes: 102,
    no: 71,
    abstain: 3
  },
  {
    slug: "friends-travel-plan",
    yes: 54,
    no: 76,
    abstain: 4
  },
  {
    slug: "dating-home-outgoing",
    yes: 81,
    no: 58,
    abstain: 2
  },
  {
    slug: "work-many-short-few-long",
    yes: 98,
    no: 42,
    abstain: 6
  },
  {
    slug: "powers-wifi-battery",
    yes: 65,
    no: 129,
    abstain: 7
  },
  {
    slug: "absurd-subtitles-emojis",
    yes: 112,
    no: 44,
    abstain: 9
  }
];

let pgPool: PgPool | null = null;
let pgSchemaReady: Promise<void> | null = null;

function hashNumber(value: string) {
  return crypto.createHash("sha256").update(value).digest().readUInt32BE(0);
}

function demoPublicKey(slug: string) {
  return new PublicKey(crypto.createHash("sha256").update(`would-you-dao-demo:${slug}`).digest()).toBase58();
}

function readDilemmaBank(): DilemmaBank {
  const source = fs.readFileSync(DILEMMA_BANK_PATH, "utf8");
  const window = {} as { BalanceDilemmas?: DilemmaBank };
  new Function("window", source)(window);
  if (!window.BalanceDilemmas || !Array.isArray(window.BalanceDilemmas.dilemmas)) {
    throw new Error("Dilemma bank did not load");
  }
  return window.BalanceDilemmas;
}

function lowDemoTally(slug: string, min: number, span: number) {
  const hash = hashNumber(slug);
  const total = min + (hash % span);
  const abstain = hashNumber(`${slug}:skip`) % 3;
  const remaining = Math.max(2, total - abstain);
  const yes = 1 + (hashNumber(`${slug}:yes`) % (remaining - 1));
  return {
    slug,
    yes,
    no: remaining - yes,
    abstain
  };
}

function seededTally(slug: string, active: boolean) {
  if (active) return lowDemoTally(slug, 2, 15);

  const hot = HOT_DEMO_TALLIES.find((item) => item.slug === slug);
  if (hot) return hot;

  return lowDemoTally(slug, 7, 22);
}

function demoSchedule(now: number, totalDilemmas: number) {
  const elapsed = Math.max(0, now - DEMO_SCHEDULE_EPOCH_UNIX);
  const week = Math.floor(elapsed / DEMO_WEEK_SECONDS);
  const weekStart = DEMO_SCHEDULE_EPOCH_UNIX + week * DEMO_WEEK_SECONDS;
  const activeIndexes = new Set<number>();
  for (let offset = 0; offset < Math.min(WEEKLY_DEMO_BATCH_SIZE, totalDilemmas); offset += 1) {
    activeIndexes.add((week * WEEKLY_DEMO_BATCH_SIZE + offset) % totalDilemmas);
  }
  return {
    weekStart,
    weekEnd: weekStart + DEMO_WEEK_SECONDS,
    activeIndexes
  };
}

function demoReceipts(slug: string, count: number, createdAt: number): ReceiptRecord[] {
  return Array.from({ length: Math.min(count, 18) }, (_, index) => ({
    id: `demo-${slug}-${index + 1}`,
    signature: `demo_sig_${slug}_${index + 1}`,
    finalizeSignature: `demo_finalize_${slug}_${index + 1}`,
    createdAt: createdAt - (count - index) * 11,
    wallet: `demo_wallet_${String(index + 1).padStart(2, "0")}`
  }));
}

function demoProposalRecords(): ProposalRecord[] {
  const now = Math.floor(Date.now() / 1000);
  const bank = readDilemmaBank();
  const schedule = demoSchedule(now, bank.dilemmas.length);
  return bank.dilemmas.map((dilemma, index) => {
    const category = bank.categories[dilemma.category] ?? { en: dilemma.category };
    const active = schedule.activeIndexes.has(index);
    const tally = seededTally(dilemma.id, active);
    const createdAt = active
      ? schedule.weekStart + Array.from(schedule.activeIndexes).indexOf(index) * 600
      : schedule.weekStart - DEMO_WEEK_SECONDS - index * 3600;
    const total = tally.yes + tally.no + tally.abstain;
    return {
      demo: true,
      proposal: demoPublicKey(dilemma.id),
      proposalId: `demo-${dilemma.id}`,
      title: `${dilemma.a.en} vs ${dilemma.b.en}`,
      summary: active ? `${category.en} weekly broadcast round` : `${category.en} finalized demo round`,
      quorum: 1,
      createdAt,
      receipts: demoReceipts(dilemma.id, total, createdAt),
      closesAt: active ? schedule.weekEnd : createdAt + DEMO_WEEK_SECONDS,
      finalized: !active,
      encryptedStateChunks: 4,
      stateNonce: String(7000 + index),
      yes: tally.yes,
      no: tally.no,
      abstain: tally.abstain,
      total,
      slug: dilemma.id,
      prompt: { en: "Would you rather...", ko: "당신의 선택은?" },
      category,
      optionA: dilemma.a,
      optionB: dilemma.b,
      images: PLACEHOLDER_IMAGES,
      initSignature: `demo_init_${dilemma.id}`,
      initFinalizeSignature: `demo_init_finalize_${dilemma.id}`,
      ...(active ? {} : {
        tallySignature: `demo_tally_${dilemma.id}`,
        tallyFinalizeSignature: `demo_tally_finalize_${dilemma.id}`
      })
    };
  });
}

const DEFAULT_STATE: SiteState = {
  proposals: [
    ...demoProposalRecords(),
    {
      proposal: "8PJcPGsSDCbSTngufhhodSdFE93rReFwka8UpXaXYAYg",
      proposalId: "1777764333672",
      title: "Teleportation vs Pause time",
      summary: "Superpowers balance round",
      quorum: 1,
      createdAt: 1777764336,
      receipts: [],
      slug: "powers-teleport-time",
      prompt: {
        en: "Would you rather...",
        ko: "당신의 선택은?"
      },
      category: {
        en: "Superpowers",
        ko: "초능력/상상"
      },
      optionA: {
        en: "Teleportation",
        ko: "순간이동 능력"
      },
      optionB: {
        en: "Pause time",
        ko: "시간 멈추기 능력"
      },
      images: PLACEHOLDER_IMAGES,
      initSignature: "3fzDnJkuJ2hFBinayNnqcvrQa4RurjTTsDPxeriQQ8cK4ufVC1kDuEdwLsxkZNoDY3U3n5wfJgbiETzwryW4hAjx",
      initFinalizeSignature: "4k5AytXsZYM8jqCE2E3fiJq3LZFVux1j36TD5rWmT85bFVQzKfaMfcqz3GNBx1BFbM5F3VjxdWqPXCPKbf69Mnin"
    }
  ]
};

function rpcUrl() {
  return process.env.RPC_URL ?? DEFAULT_RPC_URL;
}

function keypairSource() {
  return process.env.KEYPAIR_JSON
    ?? (process.env.KEYPAIR_BASE64 ? `base64:${process.env.KEYPAIR_BASE64}` : undefined)
    ?? process.env.KEYPAIR
    ?? (process.env.VERCEL ? "" : `${process.env.HOME}/.config/solana/id.json`);
}

function hasServerKeypairSource() {
  return Boolean(process.env.KEYPAIR_JSON || process.env.KEYPAIR_BASE64 || process.env.KEYPAIR || !process.env.VERCEL);
}

function clusterOffset() {
  return Number(process.env.ARCIUM_CLUSTER_OFFSET ?? DEVNET_CLUSTER_OFFSET);
}

function isDemoProposal(record: ProposalRecord) {
  return Boolean(
    record.demo
    || record.proposalId?.startsWith("demo-")
    || record.initSignature?.startsWith("demo_init_")
  );
}

function withSeededDemoRounds(state: SiteState): SiteState {
  const userRounds = state.proposals.filter((record) => !isDemoProposal(record));
  const materializedSlugs = new Set(userRounds.map((record) => record.slug).filter(Boolean));
  return {
    proposals: [
      ...demoProposalRecords().filter((record) => !record.slug || !materializedSlugs.has(record.slug)),
      ...userRounds
    ]
  };
}

function persistentState(state: SiteState): SiteState {
  return {
    proposals: state.proposals.filter((record) => !isDemoProposal(record))
  };
}

function supabaseUrl() {
  return (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
}

function supabaseServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "";
}

function supabaseConfigured() {
  return Boolean(supabaseUrl() && supabaseServiceKey());
}

function postgresUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL || "";
}

function postgresConfigured() {
  return Boolean(postgresUrl());
}

function metadataStorageMode() {
  if (postgresConfigured()) return "postgres";
  if (supabaseConfigured()) return "supabase";
  return process.env.VERCEL ? "ephemeral-file" : "file";
}

function pgIdentifier(value: string) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid Postgres identifier: ${value}`);
  }
  return `"${value}"`;
}

function pgStateTable() {
  return SUPABASE_STATE_TABLE.split(".").map(pgIdentifier).join(".");
}

function pgSslConfig() {
  if (process.env.POSTGRES_SSL === "0") return false;
  return { rejectUnauthorized: false };
}

function getPgPool() {
  if (!pgPool) {
    const { Pool } = require("pg") as { Pool: PgPoolConstructor };
    pgPool = new Pool({
      connectionString: postgresUrl(),
      max: 1,
      ssl: pgSslConfig()
    });
  }
  return pgPool;
}

async function ensurePostgresSchema() {
  if (!pgSchemaReady) {
    const table = pgStateTable();
    pgSchemaReady = getPgPool().query(`
      create table if not exists ${table} (
        id text primary key,
        state jsonb not null default '{"proposals":[]}'::jsonb,
        updated_at timestamptz not null default now()
      )
    `).then(async () => {
      await getPgPool().query(
        `insert into ${table} (id, state)
         values ($1, '{"proposals":[]}'::jsonb)
         on conflict (id) do nothing`,
        [SUPABASE_STATE_ID]
      );
    });
  }
  await pgSchemaReady;
}

async function readStateFromPostgres(): Promise<SiteState | null> {
  await ensurePostgresSchema();
  const result = await getPgPool().query(
    `select state from ${pgStateTable()} where id = $1 limit 1`,
    [SUPABASE_STATE_ID]
  );
  if (!result.rows.length) return null;
  return normalizeStoredState(result.rows[0].state);
}

async function writeStateToPostgres(state: SiteState) {
  await ensurePostgresSchema();
  await getPgPool().query(
    `insert into ${pgStateTable()} (id, state, updated_at)
     values ($1, $2::jsonb, now())
     on conflict (id) do update set state = excluded.state, updated_at = now()`,
    [SUPABASE_STATE_ID, JSON.stringify(persistentState(state))]
  );
}

function supabaseHeaders(extra: Record<string, string> = {}) {
  const key = supabaseServiceKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra
  };
}

function supabaseStateEndpoint(query = "") {
  return `${supabaseUrl()}/rest/v1/${SUPABASE_STATE_TABLE}${query}`;
}

function normalizeStoredState(value: unknown): SiteState {
  if (!value || typeof value !== "object") return { proposals: [] };
  const raw = value as Partial<SiteState>;
  return {
    proposals: Array.isArray(raw.proposals) ? raw.proposals : []
  };
}

async function readStateFromSupabase(): Promise<SiteState | null> {
  const response = await fetch(
    supabaseStateEndpoint(`?id=eq.${encodeURIComponent(SUPABASE_STATE_ID)}&select=state`),
    {
      method: "GET",
      headers: supabaseHeaders()
    }
  );
  if (!response.ok) {
    throw new Error(`Supabase state read failed: ${response.status}`);
  }
  const rows = await response.json() as Array<{ state?: unknown }>;
  if (!Array.isArray(rows) || !rows.length) return null;
  return normalizeStoredState(rows[0]?.state);
}

async function writeStateToSupabase(state: SiteState) {
  const response = await fetch(supabaseStateEndpoint("?on_conflict=id"), {
    method: "POST",
    headers: supabaseHeaders({
      Prefer: "resolution=merge-duplicates,return=minimal"
    }),
    body: JSON.stringify({
      id: SUPABASE_STATE_ID,
      state: persistentState(state)
    })
  });
  if (!response.ok) {
    throw new Error(`Supabase state write failed: ${response.status}`);
  }
}

function readStateFromFile(): SiteState {
  if (!fs.existsSync(STATE_PATH)) return withSeededDemoRounds(structuredClone(DEFAULT_STATE));
  const raw = JSON.parse(fs.readFileSync(STATE_PATH, "utf8")) as SiteState;
  return withSeededDemoRounds({
    proposals: Array.isArray(raw.proposals) ? raw.proposals : []
  });
}

function writeStateToFile(state: SiteState) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, `${JSON.stringify(persistentState(state), null, 2)}\n`);
}

async function readState(): Promise<SiteState> {
  if (postgresConfigured()) {
    const state = await readStateFromPostgres();
    return withSeededDemoRounds(state ?? structuredClone(DEFAULT_STATE));
  }
  if (supabaseConfigured()) {
    const state = await readStateFromSupabase();
    return withSeededDemoRounds(state ?? structuredClone(DEFAULT_STATE));
  }
  return readStateFromFile();
}

async function writeState(state: SiteState) {
  if (postgresConfigured()) {
    await writeStateToPostgres(state);
    return;
  }
  if (supabaseConfigured()) {
    await writeStateToSupabase(state);
    return;
  }
  writeStateToFile(state);
}

function providerAndProgram() {
  const provider = createProvider(rpcUrl(), keypairSource());
  anchor.setProvider(provider);
  return {
    provider,
    program: createProgram(provider)
  };
}

function providerAndProgramForWallet(publicKey: PublicKey) {
  const connection = new anchor.web3.Connection(rpcUrl(), "confirmed");
  const wallet = {
    publicKey,
    signTransaction: async () => {
      throw new Error("Server cannot sign connected-wallet transactions");
    },
    signAllTransactions: async () => {
      throw new Error("Server cannot sign connected-wallet transactions");
    }
  } as unknown as anchor.Wallet;
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed"
  });

  return {
    provider,
    program: createProgram(provider)
  };
}

async function ensureDaoRuntime() {
  if (!hasServerKeypairSource()) return;

  const { program } = providerAndProgram();

  try {
    await initializeDao({ program });
  } catch (error) {
    const message = normalizeError(error);
    if (!message.includes("already in use") && !message.includes("already initialized")) {
      throw error;
    }
  }

  await initComputationDefinitions({ program });
}

async function unsignedTransaction(params: {
  provider: anchor.AnchorProvider;
  feePayer: PublicKey;
  instructions: anchor.web3.TransactionInstruction[];
}) {
  const latest = await params.provider.connection.getLatestBlockhash("confirmed");
  const transaction = new anchor.web3.Transaction({
    feePayer: params.feePayer,
    blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight
  });
  transaction.add(...params.instructions);

  return {
    transaction: transaction
      .serialize({ requireAllSignatures: false, verifySignatures: false })
      .toString("base64"),
    blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight,
    feePayer: params.feePayer.toBase58()
  };
}

async function confirmSubmittedTransaction(provider: anchor.AnchorProvider, signature: string) {
  const result = await provider.connection.confirmTransaction(signature, "confirmed");
  if (result.value.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(result.value.err)}`);
  }
}

function byteArray(value: unknown, length: number, label: string) {
  if (!Array.isArray(value) || value.length !== length) {
    throw new Error(`${label} must be ${length} bytes`);
  }
  return value.map((item) => {
    const number = Number(item);
    if (!Number.isInteger(number) || number < 0 || number > 255) {
      throw new Error(`${label} contains an invalid byte`);
    }
    return number;
  });
}

function normalizeEncryptedVote(payload: EncryptedVotePayload) {
  if (!payload || !Array.isArray(payload.ciphertexts) || payload.ciphertexts.length !== 2) {
    throw new Error("Encrypted vote payload is required");
  }
  const nonce = BigInt(payload.nonce);
  if (nonce < 0n) throw new Error("nonce must be non-negative");

  return {
    ciphertexts: [
      byteArray(payload.ciphertexts[0], 32, "ciphertext[0]"),
      byteArray(payload.ciphertexts[1], 32, "ciphertext[1]")
    ],
    ephemeralPublicKey: byteArray(payload.ephemeralPublicKey, 32, "ephemeralPublicKey"),
    nonce
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

function arciumFinalizationWaitMs() {
  const fallback = process.env.VERCEL ? 18000 : 120000;
  const configured = Number(process.env.ARCIUM_FINALIZATION_WAIT_MS || fallback);
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : fallback;
}

async function waitForFinalizationOrPending(params: {
  program: anchor.Program<PrivateDao>;
  computationOffset: anchor.BN;
}) {
  const pending = Symbol("pending");
  const wait = waitForPrivateComputationFinalization(params);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const result = await Promise.race([
    wait,
    new Promise<typeof pending>((resolve) => {
      timer = setTimeout(() => resolve(pending), arciumFinalizationWaitMs());
    })
  ]);
  if (timer) clearTimeout(timer);
  if (result === pending) {
    wait.catch(() => {});
    return {
      status: "pending" as const,
      signature: "pending"
    };
  }
  return {
    status: "finalized" as const,
    signature: result
  };
}

function normalizeLocalizedText(value: unknown): LocalizedText | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const en = typeof record.en === "string" ? record.en.trim() : "";
  const ko = typeof record.ko === "string" ? record.ko.trim() : "";
  if (!en && !ko) return undefined;
  return {
    en: en || ko,
    ...(ko ? { ko } : {})
  };
}

function normalizeChoiceImages(value: unknown): ChoiceImages | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const nested = record.images && typeof record.images === "object"
    ? record.images as Record<string, unknown>
    : record;
  const a = typeof nested.a === "string"
    ? nested.a.trim()
    : typeof nested.imageA === "string"
      ? nested.imageA.trim()
      : "";
  const b = typeof nested.b === "string"
    ? nested.b.trim()
    : typeof nested.imageB === "string"
      ? nested.imageB.trim()
      : "";
  const status = nested.status === "generated" || nested.status === "failed" || nested.status === "placeholder"
    ? nested.status
    : undefined;
  const error = typeof nested.error === "string" ? nested.error.trim().slice(0, 240) : undefined;

  if (!a || !b) return undefined;
  return {
    a,
    b,
    ...(status ? { status } : {}),
    ...(error ? { error } : {})
  };
}

function roundMetadata(params: {
  slug?: unknown;
  prompt?: unknown;
  category?: unknown;
  optionA?: unknown;
  optionB?: unknown;
  images?: unknown;
}) {
  const slug = typeof params.slug === "string" ? params.slug.trim().slice(0, 96) : undefined;
  const prompt = normalizeLocalizedText(params.prompt);
  const category = normalizeLocalizedText(params.category);
  const optionA = normalizeLocalizedText(params.optionA);
  const optionB = normalizeLocalizedText(params.optionB);
  const images = normalizeChoiceImages(params.images);
  return {
    ...(slug ? { slug } : {}),
    ...(prompt ? { prompt } : {}),
    ...(category ? { category } : {}),
    ...(optionA ? { optionA } : {}),
    ...(optionB ? { optionB } : {}),
    ...(images ? { images } : {})
  };
}

function textForPrompt(value: LocalizedText | undefined, fallback = "") {
  if (!value) return fallback;
  return value.en || value.ko || fallback;
}

function optionPromptHints(option: LocalizedText) {
  const value = `${option.en || ""} ${option.ko || ""}`.toLowerCase();
  const hints: string[] = [];

  if (/chin|jaw|neck|턱|목/.test(value)) {
    hints.push("visible chin and neck area, small clear sweat drops under the chin when relevant");
  }
  if (/sweat|sweaty|perspiration|땀/.test(value)) {
    hints.push("visible sweat droplets on skin, embarrassed facial expression");
  }
  if (/smell|odor|stink|냄새/.test(value)) {
    hints.push("subtle cartoon smell wisps around the source, not covering the character");
  }
  if (/hair|scalp|bangs|shampoo|머리|두피|앞머리|샴푸/.test(value)) {
    hints.push("clear hair and head detail, expressive worried face");
  }
  if (/tooth|teeth|tongue|mouth|breath|brush|치아|혀|입|양치/.test(value)) {
    hints.push("clear mouth or teeth detail, clean comedic expression");
  }
  if (/shoe|sock|foot|feet|신발|양말|발/.test(value)) {
    hints.push("clear shoe, sock, or foot detail, playful hygiene gag");
  }
  if (/phone|wallet|카톡|전화|핸드폰|지갑/.test(value)) {
    hints.push("simple everyday prop matching the choice");
  }
  if (/chicken|fried chicken|치킨|닭/.test(value)) {
    hints.push("a visible plate or bucket of fried chicken as the main food prop, the character sadly refusing it");
  }
  if (/pizza|피자/.test(value)) {
    hints.push("a visible pizza slice or pizza box as the main food prop, the character sadly refusing it");
  }
  if (/ramen|noodle|라면|국수/.test(value)) {
    hints.push("a visible bowl of ramen or noodles as the main food prop");
  }
  if (/coffee|latte|americano|커피|라떼|아메리카노/.test(value)) {
    hints.push("a visible coffee cup as the main prop");
  }
  if (/food|meal|eat|음식|먹/.test(value)) {
    hints.push("one clear food prop that matches the choice");
  }

  return hints;
}

function imageGeneratorUrl() {
  return process.env.REMOTE_IMAGE_GENERATOR_URL
    || process.env.IMAGE_GENERATION_URL
    || process.env.LOCAL_IMAGE_GENERATOR_URL
    || "";
}

function imageGenerationEnabled() {
  return process.env.ENABLE_IMAGE_GENERATION === "1";
}

function translationUrl() {
  if (deeplApiKey()) return "";
  const explicit = process.env.TRANSLATION_URL || process.env.LOCAL_TRANSLATION_URL || "";
  if (explicit) return explicit;
  const generator = imageGeneratorUrl().trim();
  if (!generator) return "";
  try {
    const url = new URL(generator);
    url.pathname = url.pathname.replace(/\/generate\/?$/, "/translate");
    if (!url.pathname.endsWith("/translate")) url.pathname = "/translate";
    url.search = "";
    return url.toString();
  } catch {
    return "";
  }
}

function deeplApiKey() {
  return process.env.DEEPL_API_KEY || process.env.DEEPL_AUTH_KEY || "";
}

function deeplTranslateUrl(key: string) {
  if (process.env.DEEPL_API_URL) return process.env.DEEPL_API_URL;
  const host = key.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
  return `${host}/v2/translate`;
}

function deeplSourceLang(language: "en" | "ko") {
  return language === "ko" ? "KO" : "EN";
}

function deeplTargetLang(language: "en" | "ko") {
  return language === "ko" ? "KO" : process.env.DEEPL_EN_TARGET || "EN-US";
}

function imageGenerationSize() {
  const size = Number(process.env.IMAGE_GENERATION_SIZE || 512);
  return Number.isFinite(size) && size >= 256 ? Math.round(size) : 512;
}

function imageGeneratorHeaders() {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  const token = process.env.IMAGE_GENERATOR_TOKEN || "";
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers["X-Image-Generator-Token"] = token;
  }
  return headers;
}

function imagePrompt(params: {
  prompt?: LocalizedText;
  category?: LocalizedText;
  option: LocalizedText;
}) {
  const option = textForPrompt(params.option);
  const category = textForPrompt(params.category, "Daily Life");
  const hints = optionPromptHints(params.option);
  return [
    `A single clear scene for a would-you-rather choice: ${option}`,
    `Category: ${category}`,
    "Show exactly one fully clothed cute chibi-style Korean female character, face and upper body visible, instantly understandable situation",
    ...hints,
    "single character only, no duplicate characters, no character sheet, no grid, no collage, centered square composition, bold clean outline, expressive reaction, simple background, no text, no captions, no UI, no watermark"
  ].filter(Boolean).join(". ");
}

function dataImageExtension(dataUrl: string) {
  const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp);base64,/);
  if (!match) return null;
  return match[1] === "jpeg" ? "jpg" : match[1];
}

function persistDataImage(dataUrl: string, name: string) {
  const extension = dataImageExtension(dataUrl);
  if (!extension) return dataUrl;
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  fs.mkdirSync(GENERATED_ASSETS_DIR, { recursive: true });
  const filename = `${name}.${extension}`;
  fs.writeFileSync(path.join(GENERATED_ASSETS_DIR, filename), Buffer.from(base64, "base64"));
  return `/generated/${filename}`;
}

function generatedImageUrl(value: string, endpoint: string, name: string) {
  if (value.startsWith("data:image/")) return persistDataImage(value, name);
  try {
    return new URL(value, endpoint).toString();
  } catch {
    return value;
  }
}

async function generateRoundImages(params: {
  proposalId: string;
  slug?: unknown;
  prompt?: unknown;
  category?: unknown;
  optionA?: unknown;
  optionB?: unknown;
}) {
  const existing = normalizeChoiceImages(params);
  if (existing) return existing;
  if (!imageGenerationEnabled()) return PLACEHOLDER_IMAGES;

  const endpoint = imageGeneratorUrl().trim();
  if (!endpoint) return PLACEHOLDER_IMAGES;

  const prompt = normalizeLocalizedText(params.prompt);
  const category = normalizeLocalizedText(params.category);
  const optionA = normalizeLocalizedText(params.optionA);
  const optionB = normalizeLocalizedText(params.optionB);
  if (!optionA || !optionB) return PLACEHOLDER_IMAGES;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: imageGeneratorHeaders(),
      body: JSON.stringify({
        id: params.proposalId,
        slug: typeof params.slug === "string" ? params.slug : undefined,
        prompt,
        category,
        optionA,
        optionB,
        prompts: {
          a: imagePrompt({ prompt, category, option: optionA }),
          b: imagePrompt({ prompt, category, option: optionB })
        },
        size: imageGenerationSize()
      }),
      signal: AbortSignal.timeout(Number(process.env.IMAGE_GENERATION_TIMEOUT_MS || 120000))
    });
    if (!response.ok) throw new Error(`image generator returned ${response.status}`);
    const generated = normalizeChoiceImages(await response.json());
    if (!generated) throw new Error("image generator response must include a/b image URLs or data URLs");
    return {
      ...generated,
      a: generatedImageUrl(generated.a, endpoint, `${params.proposalId}-a`),
      b: generatedImageUrl(generated.b, endpoint, `${params.proposalId}-b`),
      status: "generated" as const
    };
  } catch (error) {
    return {
      ...PLACEHOLDER_IMAGES,
      status: "failed" as const,
      error: normalizeError(error)
    };
  }
}

function normalizeLanguage(value: unknown, fallback: "en" | "ko") {
  return value === "ko" || value === "en" ? value : fallback;
}

function normalizeTranslationItems(value: unknown) {
  if (!value || typeof value !== "object") return {};
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => typeof item === "string" && item.trim())
    .map(([key, item]) => [key, (item as string).trim().slice(0, 180)]);
  return Object.fromEntries(entries);
}

async function translateWithDeepL(params: {
  from: "en" | "ko";
  to: "en" | "ko";
  items: Record<string, string>;
}) {
  const key = deeplApiKey();
  if (!key) return null;

  const entries = Object.entries(params.items);
  const response = await fetch(deeplTranslateUrl(key), {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${key}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text: entries.map(([, value]) => value),
      source_lang: deeplSourceLang(params.from),
      target_lang: deeplTargetLang(params.to),
      context: "Would-you-rather balance game options. Keep the tone casual, natural, and funny."
    }),
    signal: AbortSignal.timeout(Number(process.env.TRANSLATION_TIMEOUT_MS || 30000))
  });
  if (!response.ok) throw new Error(`DeepL returned ${response.status}`);
  const data = await response.json() as { translations?: Array<{ text?: unknown }> };
  const translations = Array.isArray(data.translations) ? data.translations : [];
  return {
    from: params.from,
    to: params.to,
    provider: "deepl",
    items: Object.fromEntries(entries.map(([keyName], index) => [
      keyName,
      typeof translations[index]?.text === "string" ? translations[index].text.trim().slice(0, 180) : ""
    ]).filter(([, value]) => value))
  };
}

export async function translateRoundOptions(params: {
  from?: unknown;
  to?: unknown;
  category?: unknown;
  items?: unknown;
}) {
  const from = normalizeLanguage(params.from, "en");
  const to = normalizeLanguage(params.to, from === "en" ? "ko" : "en");
  if (from === to) throw new Error("Translation languages must differ");
  const items = normalizeTranslationItems(params.items);
  if (!Object.keys(items).length) throw new Error("Nothing to translate");

  const deepl = await translateWithDeepL({ from, to, items });
  if (deepl) return deepl;

  const endpoint = translationUrl().trim();
  if (!endpoint) throw new Error("Translation service is not configured");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: imageGeneratorHeaders(),
    body: JSON.stringify({
      from,
      to,
      category: normalizeLocalizedText(params.category),
      items
    }),
    signal: AbortSignal.timeout(Number(process.env.TRANSLATION_TIMEOUT_MS || 30000))
  });
  if (!response.ok) throw new Error(`translation service returned ${response.status}`);
  const translated = await response.json() as { items?: unknown };
  return {
    from,
    to,
    items: normalizeTranslationItems(translated.items)
  };
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
    createdAt: record.createdAt,
    slug: record.slug,
    prompt: record.prompt,
    category: record.category,
    optionA: record.optionA,
    optionB: record.optionB,
    images: record.images || PLACEHOLDER_IMAGES,
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

function localProposal(record: ProposalRecord, summary = record.summary) {
  const yes = record.yes ?? 0;
  const no = record.no ?? 0;
  const abstain = record.abstain ?? 0;
  return {
    demo: record.demo,
    proposal: record.proposal,
    proposalId: record.proposalId,
    title: record.title,
    summary,
    quorum: record.quorum,
    createdAt: record.createdAt,
    closesAt: record.closesAt ?? 0,
    finalized: record.finalized ?? false,
    encryptedStateChunks: record.encryptedStateChunks ?? 0,
    stateNonce: record.stateNonce ?? "0",
    yes,
    no,
    abstain,
    total: record.total ?? yes + no + abstain,
    receipts: record.receipts,
    slug: record.slug,
    prompt: record.prompt,
    category: record.category,
    optionA: record.optionA,
    optionB: record.optionB,
    images: record.images || PLACEHOLDER_IMAGES,
    initSignature: record.initSignature,
    initFinalizeSignature: record.initFinalizeSignature,
    tallySignature: record.tallySignature,
    tallyFinalizeSignature: record.tallyFinalizeSignature
  };
}

export async function getStatus() {
  const state = await readState();
  const { provider, program } = providerAndProgram();
  const wallet = provider.wallet.publicKey;
  const balanceLamports = await provider.connection.getBalance(wallet, "confirmed");
  const proposals = [];

  for (const record of state.proposals) {
    if (record.demo) {
      proposals.push(localProposal(record));
      continue;
    }

    try {
      proposals.push(await fetchProposal(record));
    } catch (error) {
      const summary = record.total !== undefined || record.finalized !== undefined
        ? record.summary
        : `${record.summary} (${normalizeError(error)})`;
      proposals.push(localProposal(record, summary));
    }
  }

  return {
    config: {
      rpcUrl: rpcUrl(),
      clusterOffset: clusterOffset(),
      programId: program.programId.toBase58(),
      dao: deriveDaoPda(program.programId).toBase58(),
      walletMode: "connected-wallet",
      metadataStorage: metadataStorageMode(),
      relayer: wallet.toBase58(),
      relayerBalanceSol: balanceLamports / anchor.web3.LAMPORTS_PER_SOL
    },
    proposals
  };
}

export async function getVoteEncryptionConfig() {
  const { program } = providerAndProgram();
  return {
    mxePublicKey: Array.from(await fetchMxePublicKey({ program })),
    programId: program.programId.toBase58(),
    clusterOffset: clusterOffset()
  };
}

export async function createSiteProposal(params: {
  title: string;
  summary: string;
  quorum: number;
  closesInSeconds: number;
  slug?: string;
  prompt?: LocalizedText;
  category?: LocalizedText;
  optionA?: LocalizedText;
  optionB?: LocalizedText;
  images?: ChoiceImages;
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
  const images = await generateRoundImages({
    ...params,
    proposalId: proposalId.toString()
  });
  const closesAtUnix = new anchor.BN(Math.floor(Date.now() / 1000) + closesInSeconds);
  const created = await createDaoProposal({
    program,
    proposalId,
    title,
    closesAtUnix
  });
  const initBuilt = await buildInitPrivateBallotInstruction({
    program,
    proposal: created.proposal,
    clusterOffset: clusterOffset()
  });
  const initSignature = await provider.sendAndConfirm(new anchor.web3.Transaction().add(initBuilt.instruction), [], {
    commitment: "confirmed",
    preflightCommitment: "confirmed"
  });
  const initFinalization = await waitForFinalizationOrPending({
    program,
    computationOffset: initBuilt.computationOffset
  });

  const record: ProposalRecord = {
    proposal: created.proposal.toBase58(),
    proposalId: proposalId.toString(),
    title,
    summary,
    quorum,
    createdAt: Math.floor(Date.now() / 1000),
    receipts: [],
    ...roundMetadata({ ...params, images }),
    initSignature,
    initFinalizeSignature: initFinalization.signature
  };

  const state = await readState();
  state.proposals.unshift(record);
  await writeState(state);

  return {
    proposal: await fetchProposal(record),
    transactions: {
      createProposal: created.signature,
      initPrivateBallot: initSignature,
      initFinalized: initFinalization.signature,
      finalizationStatus: initFinalization.status
    }
  };
}

export async function buildWalletProposalTransaction(params: {
  publicKey: string;
  title: string;
  summary: string;
  quorum: number;
  closesInSeconds: number;
  slug?: string;
  prompt?: LocalizedText;
  category?: LocalizedText;
  optionA?: LocalizedText;
  optionB?: LocalizedText;
  images?: ChoiceImages;
}) {
  const payer = new PublicKey(params.publicKey);
  const title = params.title.trim();
  const summary = params.summary.trim();
  const quorum = Math.max(1, Math.min(99, Math.floor(params.quorum || 1)));
  const closesInSeconds = Math.max(45, Math.min(7 * 24 * 60 * 60, Math.floor(params.closesInSeconds || 180)));

  if (!title) throw new Error("Title is required");
  if (!summary) throw new Error("Summary is required");

  await ensureDaoRuntime();

  const { provider, program } = providerAndProgramForWallet(payer);
  const proposalId = new anchor.BN(Date.now().toString());
  const images = await generateRoundImages({
    ...params,
    proposalId: proposalId.toString()
  });
  const closesAtUnix = new anchor.BN(Math.floor(Date.now() / 1000) + closesInSeconds);
  const created = await buildCreateProposalInstruction({
    program,
    proposalId,
    title,
    closesAtUnix
  });
  const initialized = await buildInitPrivateBallotInstruction({
    program,
    proposal: created.proposal,
    clusterOffset: clusterOffset()
  });

  return {
    proposal: created.proposal.toBase58(),
    proposalId: proposalId.toString(),
    title,
    summary,
    quorum,
    ...roundMetadata({ ...params, images }),
    closesAt: Number(closesAtUnix.toString()),
    initComputationOffset: initialized.computationOffset.toString(),
    transaction: await unsignedTransaction({
      provider,
      feePayer: payer,
      instructions: [created.instruction, initialized.instruction]
    })
  };
}

export async function confirmWalletProposalTransaction(params: WalletProposalMetadata) {
  const payer = new PublicKey(params.publicKey);
  const { provider, program } = providerAndProgramForWallet(payer);
  const proposalId = new anchor.BN(params.proposalId);
  const expectedProposal = deriveProposalPda(
    proposalId,
    deriveDaoPda(program.programId),
    program.programId
  );

  if (expectedProposal.toBase58() !== params.proposal) {
    throw new Error("Proposal PDA does not match proposal id");
  }

  await confirmSubmittedTransaction(provider, params.signature);
  const finalization = await waitForFinalizationOrPending({
    program,
    computationOffset: new anchor.BN(params.initComputationOffset)
  });
  const finalizeSignature = finalization.signature;

  const state = await readState();
  let record = state.proposals.find((item) => item.proposal === params.proposal);
  if (!record) {
    record = {
      proposal: params.proposal,
      proposalId: params.proposalId,
      title: params.title.trim(),
      summary: params.summary.trim(),
      quorum: Math.max(1, Math.min(99, Math.floor(params.quorum || 1))),
      createdAt: Math.floor(Date.now() / 1000),
      receipts: [],
      ...roundMetadata(params)
    };
    state.proposals.unshift(record);
  } else {
    Object.assign(record, roundMetadata(params));
  }
  record.initSignature = params.signature;
  record.initFinalizeSignature = finalizeSignature;
  await writeState(state);

  return {
    proposal: await fetchProposal(record),
    transactions: {
      createAndInit: params.signature,
      initFinalized: finalizeSignature,
      finalizationStatus: finalization.status
    }
  };
}

export async function buildWalletVoteTransaction(params: {
  publicKey: string;
  proposal: string;
  choice?: VoteChoice;
  encryptedVote?: EncryptedVotePayload;
}) {
  if (!params.encryptedVote && !["yes", "no", "abstain"].includes(params.choice ?? "")) {
    throw new Error("Unknown vote choice");
  }

  const payer = new PublicKey(params.publicKey);
  const state = await readState();
  const record = state.proposals.find((item) => item.proposal === params.proposal);
  if (!record) throw new Error("Unknown proposal");

  const account = await fetchProposal(record);
  if (account.finalized) throw new Error("Proposal is finalized");
  if (account.encryptedStateChunks === 0 || account.stateNonce === "0") {
    throw new Error("Private ballot state is not initialized");
  }
  if (Date.now() / 1000 >= account.closesAt) throw new Error("Proposal is closed");

  const { provider, program } = providerAndProgramForWallet(payer);
  const built = params.encryptedVote
    ? await buildCastPrivateVoteInstructionFromCiphertexts({
        program,
        proposal: new PublicKey(record.proposal),
        encryptedStateNonce: BigInt(account.stateNonce),
        clusterOffset: clusterOffset(),
        ...normalizeEncryptedVote(params.encryptedVote)
      })
    : await buildCastPrivateVoteInstruction({
        program,
        proposal: new PublicKey(record.proposal),
        voterHash: voterHashFromWallet(payer),
        choice: params.choice as VoteChoice,
        encryptedStateNonce: BigInt(account.stateNonce),
        clusterOffset: clusterOffset()
      });

  return {
    proposal: record.proposal,
    computationOffset: built.computationOffset.toString(),
    transaction: await unsignedTransaction({
      provider,
      feePayer: payer,
      instructions: [built.instruction]
    })
  };
}

export async function confirmWalletVoteTransaction(params: {
  publicKey: string;
  proposal: string;
  computationOffset: string;
  signature: string;
}) {
  const payer = new PublicKey(params.publicKey);
  const state = await readState();
  const record = state.proposals.find((item) => item.proposal === params.proposal);
  if (!record) throw new Error("Unknown proposal");

  const { provider, program } = providerAndProgramForWallet(payer);
  await confirmSubmittedTransaction(provider, params.signature);
  const finalization = await waitForFinalizationOrPending({
    program,
    computationOffset: new anchor.BN(params.computationOffset)
  });
  const finalizeSignature = finalization.signature;

  const existingReceipt = record.receipts.find((receipt) => receipt.signature === params.signature);
  if (!existingReceipt) {
    record.receipts.push({
      id: `rcpt_${shortSignature(params.signature)}`,
      signature: params.signature,
      finalizeSignature,
      createdAt: Math.floor(Date.now() / 1000),
      wallet: payer.toBase58()
    });
    await writeState(state);
  } else if (finalization.status === "finalized" && existingReceipt.finalizeSignature === "pending") {
    existingReceipt.finalizeSignature = finalizeSignature;
    await writeState(state);
  }

  return {
    proposal: await fetchProposal(record),
    transactions: {
      castPrivateVote: params.signature,
      finalized: finalizeSignature,
      finalizationStatus: finalization.status
    }
  };
}

export async function buildWalletTallyTransaction(params: {
  publicKey: string;
  proposal: string;
}) {
  const payer = new PublicKey(params.publicKey);
  const state = await readState();
  const record = state.proposals.find((item) => item.proposal === params.proposal);
  if (!record) throw new Error("Unknown proposal");

  const account = await fetchProposal(record);
  if (account.finalized) return { proposal: account, alreadyFinalized: true };
  if (account.encryptedStateChunks === 0 || account.stateNonce === "0") {
    throw new Error("Private ballot state is not initialized");
  }
  if (Date.now() / 1000 < account.closesAt) throw new Error("Proposal is still open");

  const { provider, program } = providerAndProgramForWallet(payer);
  const built = await buildPublishPrivateTallyInstruction({
    program,
    proposal: new PublicKey(record.proposal),
    encryptedStateNonce: BigInt(account.stateNonce),
    clusterOffset: clusterOffset()
  });

  return {
    proposal: record.proposal,
    computationOffset: built.computationOffset.toString(),
    transaction: await unsignedTransaction({
      provider,
      feePayer: payer,
      instructions: [built.instruction]
    })
  };
}

export async function confirmWalletTallyTransaction(params: {
  publicKey: string;
  proposal: string;
  computationOffset: string;
  signature: string;
}) {
  const payer = new PublicKey(params.publicKey);
  const state = await readState();
  const record = state.proposals.find((item) => item.proposal === params.proposal);
  if (!record) throw new Error("Unknown proposal");

  const { provider, program } = providerAndProgramForWallet(payer);
  await confirmSubmittedTransaction(provider, params.signature);
  const finalization = await waitForFinalizationOrPending({
    program,
    computationOffset: new anchor.BN(params.computationOffset)
  });
  const finalizeSignature = finalization.signature;

  record.tallySignature = params.signature;
  record.tallyFinalizeSignature = finalizeSignature;
  await writeState(state);

  return {
    proposal: await fetchProposal(record),
    transactions: {
      publishPrivateTally: params.signature,
      finalized: finalizeSignature,
      finalizationStatus: finalization.status
    }
  };
}

export async function castSiteVote(params: {
  proposal: string;
  choice: VoteChoice;
}) {
  const state = await readState();
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
  await writeState(state);

  return {
    proposal: await fetchProposal(record),
    transactions: {
      castPrivateVote: result.signature,
      finalized: result.finalizeSignature
    }
  };
}

export async function publishSiteTally(params: { proposal: string }) {
  const state = await readState();
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
  await writeState(state);

  return {
    proposal: await fetchProposal(record),
    transactions: {
      publishPrivateTally: result.signature,
      finalized: result.finalizeSignature
    }
  };
}
