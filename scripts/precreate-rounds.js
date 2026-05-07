const fs = require("node:fs");
const path = require("node:path");
const { Connection, Keypair, Transaction } = require("@solana/web3.js");

require("./load-env");

function unquote(value) {
  let next = value.trim();
  if (
    (next.startsWith('"') && next.endsWith('"'))
    || (next.startsWith("'") && next.endsWith("'"))
  ) {
    next = next.slice(1, -1);
  }
  if (
    (next.startsWith('\\"') && next.endsWith('\\"'))
    || (next.startsWith("\\'") && next.endsWith("\\'"))
  ) {
    next = next.slice(2, -2);
  }
  return next;
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  fs.readFileSync(filePath, "utf8").split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const equalsAt = trimmed.indexOf("=");
    if (equalsAt <= 0) return;
    const key = trimmed.slice(0, equalsAt).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key]) return;
    process.env[key] = unquote(trimmed.slice(equalsAt + 1));
  });
}

loadEnvFile(path.join(process.cwd(), ".env.materialize.local"));

function keypairText(source) {
  const trimmed = String(source || "").trim();
  if (!trimmed) throw new Error("KEYPAIR, KEYPAIR_JSON, or KEYPAIR_BASE64 is required");
  if (trimmed.startsWith("[")) return trimmed;
  if (trimmed.startsWith("base64:")) {
    return Buffer.from(trimmed.slice("base64:".length), "base64").toString("utf8");
  }
  return fs.readFileSync(trimmed, "utf8");
}

function loadKeypair() {
  const source = process.env.KEYPAIR_JSON
    || (process.env.KEYPAIR_BASE64 ? `base64:${process.env.KEYPAIR_BASE64}` : undefined)
    || process.env.KEYPAIR
    || path.join(process.env.HOME || "", ".config", "solana", "id.json");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(keypairText(source))));
}

function readDilemmaBank() {
  const source = fs.readFileSync(path.join(process.cwd(), "site", "src", "dilemmas.js"), "utf8");
  const window = {};
  new Function("window", source)(window);
  if (!window.BalanceDilemmas) throw new Error("Dilemma bank did not load");
  return window.BalanceDilemmas;
}

function text(value, fallback = "") {
  return value && (value.en || value.ko) || fallback;
}

function payloadFor(dilemma, categories) {
  const category = categories[dilemma.category] || { en: dilemma.category };
  return {
    title: `${text(dilemma.a)} vs ${text(dilemma.b)}`,
    summary: `${text(category, "Community")} precreated broadcast round`,
    quorum: 1,
    closesInSeconds: 7 * 24 * 60 * 60,
    slug: dilemma.id,
    prompt: { en: "Would you rather...", ko: "당신의 선택은?" },
    category,
    optionA: dilemma.a,
    optionB: dilemma.b,
    images: {
      a: "/assets/choice-placeholder.png",
      b: "/assets/choice-placeholder.png",
      status: "placeholder"
    }
  };
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const raw = await response.text();
  const data = raw.trim() ? JSON.parse(raw) : {};
  if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`);
  return data;
}

function activeRoundSlugs(status) {
  const now = Date.now() / 1000;
  return new Set(status.proposals
    .filter((proposal) => !proposal.demo && !proposal.finalized && now < proposal.closesAt && proposal.slug)
    .map((proposal) => proposal.slug));
}

async function signAndSend(connection, keypair, serializedTransaction) {
  const transaction = Transaction.from(Buffer.from(serializedTransaction, "base64"));
  transaction.sign(keypair);
  const signature = await connection.sendRawTransaction(transaction.serialize(), {
    skipPreflight: false
  });
  const result = await connection.confirmTransaction(signature, "confirmed");
  if (result.value.err) {
    throw new Error(`Transaction failed: ${JSON.stringify(result.value.err)}`);
  }
  return signature;
}

async function precreateOne(params) {
  const prepared = await fetchJson(`${params.baseUrl}/api/wallet/proposal-tx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      publicKey: params.keypair.publicKey.toBase58(),
      ...params.payload
    })
  });
  const signature = await signAndSend(
    params.connection,
    params.keypair,
    prepared.transaction.transaction
  );
  return fetchJson(`${params.baseUrl}/api/wallet/proposal-confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      publicKey: params.keypair.publicKey.toBase58(),
      proposal: prepared.proposal,
      proposalId: prepared.proposalId,
      title: prepared.title,
      summary: prepared.summary,
      quorum: prepared.quorum,
      slug: prepared.slug,
      prompt: prepared.prompt,
      category: prepared.category,
      optionA: prepared.optionA,
      optionB: prepared.optionB,
      images: prepared.images,
      initComputationOffset: prepared.initComputationOffset,
      signature
    })
  });
}

async function main() {
  const baseUrl = (process.env.PRECREATE_REMOTE_URL || "https://wouldudao.vercel.app").replace(/\/+$/, "");
  const target = Math.max(1, Number(process.env.PRECREATE_TARGET || process.argv[2] || 50));
  const delayMs = Math.max(0, Number(process.env.PRECREATE_DELAY_MS || 1200));
  const keypair = loadKeypair();
  const bank = readDilemmaBank();

  const status = await fetchJson(`${baseUrl}/api/status`);
  const connection = new Connection(status.config.rpcUrl, "confirmed");
  const balance = await connection.getBalance(keypair.publicKey);
  const existing = activeRoundSlugs(status);
  const selected = bank.dilemmas
    .filter((dilemma) => !existing.has(dilemma.id))
    .slice(0, Math.max(0, target - existing.size));

  console.log(JSON.stringify({
    remote: baseUrl,
    signer: keypair.publicKey.toBase58(),
    balanceSol: balance / 1_000_000_000,
    target,
    existingActiveRounds: existing.size,
    roundsToCreate: selected.length
  }, null, 2));

  let created = 0;
  for (const dilemma of selected) {
    console.log(`Creating ${created + 1}/${selected.length}: ${dilemma.id}`);
    try {
      const result = await precreateOne({
        baseUrl,
        connection,
        keypair,
        payload: payloadFor(dilemma, bank.categories)
      });
      created += 1;
      console.log(JSON.stringify({
        slug: dilemma.id,
        proposal: result.proposal.proposal,
        finalizationStatus: result.transactions.finalizationStatus || "finalized"
      }));
    } catch (error) {
      console.error(`Failed ${dilemma.id}: ${error instanceof Error ? error.message : error}`);
    }
    if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  const finalStatus = await fetchJson(`${baseUrl}/api/status`);
  const finalActive = activeRoundSlugs(finalStatus);
  console.log(JSON.stringify({
    created,
    finalActiveRounds: finalActive.size,
    firstActiveSlugs: Array.from(finalActive).slice(0, target)
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
