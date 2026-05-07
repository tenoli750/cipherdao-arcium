const fs = require("node:fs");
const path = require("node:path");

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

function activeSeedSlugs(status) {
  const now = Date.now() / 1000;
  return new Set(status.proposals
    .filter((proposal) => !proposal.demo && !proposal.finalized && now < proposal.closesAt && proposal.slug)
    .map((proposal) => proposal.slug));
}

async function main() {
  const baseUrl = (process.env.PRECREATE_REMOTE_URL || "https://wouldudao.vercel.app").replace(/\/+$/, "");
  const target = Math.max(1, Number(process.env.PRECREATE_TARGET || process.argv[2] || 50));
  const token = process.env.SERVER_PROPOSAL_TOKEN || "";
  if (!token) throw new Error("SERVER_PROPOSAL_TOKEN is required in .env.materialize.local");

  const bank = readDilemmaBank();
  let status = await fetchJson(`${baseUrl}/api/status`);
  let existing = activeSeedSlugs(status);
  const selected = bank.dilemmas
    .filter((dilemma) => !existing.has(dilemma.id))
    .slice(0, Math.max(0, target - existing.size));

  console.log(JSON.stringify({
    remote: baseUrl,
    target,
    existingActiveRounds: existing.size,
    roundsToCreate: selected.length
  }, null, 2));

  for (const dilemma of selected) {
    console.log(`Creating ${dilemma.id}`);
    const result = await fetchJson(`${baseUrl}/api/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Server-Proposal-Token": token
      },
      body: JSON.stringify(payloadFor(dilemma, bank.categories))
    });
    console.log(JSON.stringify({
      slug: dilemma.id,
      proposal: result.proposal.proposal,
      finalizationStatus: result.transactions.finalizationStatus || "finalized"
    }));
    await new Promise((resolve) => setTimeout(resolve, Number(process.env.PRECREATE_DELAY_MS || 1200)));
    status = await fetchJson(`${baseUrl}/api/status`);
    existing = activeSeedSlugs(status);
    if (existing.size >= target) break;
  }

  const finalStatus = await fetchJson(`${baseUrl}/api/status`);
  const finalActive = activeSeedSlugs(finalStatus);
  console.log(JSON.stringify({
    finalActiveRounds: finalActive.size,
    createdOrAlreadyActive: Array.from(finalActive).slice(0, target)
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
