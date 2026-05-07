const http = require("http");
const fs = require("fs");
const path = require("path");
require("./load-env");
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

const root = path.join(__dirname, "..", "site");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
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

function readJsonBody(req) {
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
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
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

  if (cleanUrl.startsWith("/api/")) {
    sendJson(res, 404, { error: "API route not found" });
    return true;
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  const cleanUrl = decodeURIComponent((req.url || "/").split("?")[0]);

  try {
    if (await handleApi(req, res, cleanUrl)) return;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendJson(res, error.statusCode || 500, { error: message });
    return;
  }

  const requestPath = cleanUrl === "/" ? "/index.html" : cleanUrl;
  const filePath = path.normalize(path.join(root, requestPath));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": types[path.extname(filePath)] || "application/octet-stream"
    });
    res.end(data);
  });
});

server.on("error", (err) => {
  console.error(`Unable to start Would You DAO server on ${host}:${port}: ${err.message}`);
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`Would You DAO running at http://${host}:${port}`);
});
