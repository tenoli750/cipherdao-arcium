require("../scripts/load-env");
require("tsx/cjs");

const {
  buildWalletProposalTransaction,
  buildWalletTallyTransaction,
  buildWalletVoteTransaction,
  castSiteVote,
  confirmWalletProposalTransaction,
  confirmWalletTallyTransaction,
  confirmWalletVoteTransaction,
  createSiteProposal,
  getStatus,
  getVoteEncryptionConfig,
  publishSiteTally,
  translateRoundOptions
} = require("../app/siteApi.ts");

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function headerValue(req, name) {
  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function assertServerProposalAccess(req) {
  const token = process.env.SERVER_PROPOSAL_TOKEN || "";
  if (!token && process.env.ALLOW_UNPROTECTED_SERVER_PROPOSALS !== "1") {
    const error = new Error("Server proposal route is disabled");
    error.statusCode = 403;
    throw error;
  }
  const authorization = headerValue(req, "authorization") || "";
  const supplied = headerValue(req, "x-server-proposal-token") || "";
  if (supplied === token || authorization === `Bearer ${token}`) return;
  const error = new Error("Server proposal token is required");
  error.statusCode = 401;
  throw error;
}

function parseBodyValue(body) {
  if (!body) return {};
  if (typeof body === "object") return body;
  if (typeof body === "string") return body.trim() ? JSON.parse(body) : {};
  if (Buffer.isBuffer(body)) {
    const text = body.toString("utf8");
    return text.trim() ? JSON.parse(text) : {};
  }
  return {};
}

function readJsonBody(req) {
  if (req.body !== undefined) {
    return Promise.resolve(parseBodyValue(req.body));
  }

  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("Request body is too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(parseBodyValue(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function apiPath(req) {
  const raw = req.url || "/";
  const pathname = decodeURIComponent(raw.split("?")[0]);
  return pathname.startsWith("/api/") ? pathname : `/api${pathname}`;
}

async function handleApi(req, res, cleanUrl) {
  if (req.method === "GET" && cleanUrl === "/api/status") {
    sendJson(res, 200, await getStatus());
    return true;
  }

  if (req.method === "GET" && cleanUrl === "/api/vote-encryption") {
    sendJson(res, 200, await getVoteEncryptionConfig());
    return true;
  }

  if (req.method === "POST" && cleanUrl === "/api/translate") {
    const body = await readJsonBody(req);
    sendJson(res, 200, await translateRoundOptions(body));
    return true;
  }

  if (req.method === "POST" && cleanUrl === "/api/proposals") {
    assertServerProposalAccess(req);
    const body = await readJsonBody(req);
    sendJson(res, 200, await createSiteProposal(body));
    return true;
  }

  if (req.method === "POST" && cleanUrl === "/api/wallet/proposal-tx") {
    const body = await readJsonBody(req);
    sendJson(res, 200, await buildWalletProposalTransaction(body));
    return true;
  }

  if (req.method === "POST" && cleanUrl === "/api/wallet/proposal-confirm") {
    const body = await readJsonBody(req);
    sendJson(res, 200, await confirmWalletProposalTransaction(body));
    return true;
  }

  if (req.method === "POST" && cleanUrl === "/api/vote") {
    const body = await readJsonBody(req);
    sendJson(res, 200, await castSiteVote(body));
    return true;
  }

  if (req.method === "POST" && cleanUrl === "/api/wallet/vote-tx") {
    const body = await readJsonBody(req);
    sendJson(res, 200, await buildWalletVoteTransaction(body));
    return true;
  }

  if (req.method === "POST" && cleanUrl === "/api/wallet/vote-confirm") {
    const body = await readJsonBody(req);
    sendJson(res, 200, await confirmWalletVoteTransaction(body));
    return true;
  }

  if (req.method === "POST" && cleanUrl === "/api/tally") {
    const body = await readJsonBody(req);
    sendJson(res, 200, await publishSiteTally(body));
    return true;
  }

  if (req.method === "POST" && cleanUrl === "/api/wallet/tally-tx") {
    const body = await readJsonBody(req);
    sendJson(res, 200, await buildWalletTallyTransaction(body));
    return true;
  }

  if (req.method === "POST" && cleanUrl === "/api/wallet/tally-confirm") {
    const body = await readJsonBody(req);
    sendJson(res, 200, await confirmWalletTallyTransaction(body));
    return true;
  }

  sendJson(res, 404, { error: "API route not found" });
  return true;
}

module.exports = async function handler(req, res) {
  try {
    await handleApi(req, res, apiPath(req));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendJson(res, error.statusCode || 500, { error: message });
  }
};
