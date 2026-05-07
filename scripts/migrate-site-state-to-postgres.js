const fs = require("node:fs");
const { Pool } = require("pg");

const envPath = process.argv[2];
if (!envPath) {
  console.error("Usage: node scripts/migrate-site-state-to-postgres.js <env-file|->");
  process.exit(2);
}

function unquote(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
    || (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseEnv(text) {
  const env = {};
  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const equalsAt = trimmed.indexOf("=");
    if (equalsAt <= 0) return;
    env[trimmed.slice(0, equalsAt).trim()] = unquote(trimmed.slice(equalsAt + 1));
  });
  return env;
}

function isDemoProposal(record) {
  return Boolean(
    record
    && (
      record.demo
      || String(record.proposalId || "").startsWith("demo-")
      || String(record.initSignature || "").startsWith("demo_init_")
    )
  );
}

function pgIdentifier(value) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`Invalid Postgres identifier: ${value}`);
  }
  return `"${value}"`;
}

function pgTableName(value) {
  return value.split(".").map(pgIdentifier).join(".");
}

async function main() {
  try {
    const envText = envPath === "-" ? fs.readFileSync(0, "utf8") : fs.readFileSync(envPath, "utf8");
    const env = parseEnv(envText);
    const databaseUrl = env.DATABASE_URL || env.POSTGRES_URL || env.SUPABASE_DB_URL;
    if (!databaseUrl) throw new Error("DATABASE_URL is missing from pulled Vercel env");

    const stateId = env.SUPABASE_STATE_ID || "production";
    const table = pgTableName(env.SUPABASE_STATE_TABLE || "would_you_dao_state");
    const local = JSON.parse(fs.readFileSync("artifacts/site-proposals.json", "utf8"));
    const localNonDemo = (Array.isArray(local.proposals) ? local.proposals : [])
      .filter((record) => !isDemoProposal(record));

    const pool = new Pool({
      connectionString: databaseUrl,
      max: 1,
      ssl: { rejectUnauthorized: false }
    });

    await pool.query(`
      create table if not exists ${table} (
        id text primary key,
        state jsonb not null default '{"proposals":[]}'::jsonb,
        updated_at timestamptz not null default now()
      )
    `);

    const result = await pool.query(`select state from ${table} where id = $1 limit 1`, [stateId]);
    const existingState = result.rows[0]?.state && typeof result.rows[0].state === "object"
      ? result.rows[0].state
      : { proposals: [] };
    const existing = (Array.isArray(existingState.proposals) ? existingState.proposals : [])
      .filter((record) => !isDemoProposal(record));

    const seen = new Set();
    const merged = [];
    [...localNonDemo, ...existing].forEach((record) => {
      const key = record.proposal || record.proposalId || record.title;
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push(record);
    });

    await pool.query(
      `insert into ${table} (id, state, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (id) do update set state = excluded.state, updated_at = now()`,
      [stateId, JSON.stringify({ proposals: merged })]
    );

    await pool.end();

    console.log(JSON.stringify({
      storage: "postgres",
      stateId,
      before: existing.length,
      localNonDemo: localNonDemo.length,
      after: merged.length,
      migratedTitles: localNonDemo.map((record) => record.title)
    }, null, 2));
  } finally {
    if (envPath !== "-") {
      try {
        fs.writeFileSync(envPath, "");
      } catch {
        // Best-effort cleanup for the temporary env file.
      }
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
