const http = require("http");
const fs = require("fs");
const path = require("path");
require("tsx/cjs");

const {
  castSiteVote,
  createSiteProposal,
  getStatus,
  publishSiteTally
} = require("../app/siteApi.ts");

const root = path.join(__dirname, "..", "site");
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
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

  if (req.method === "POST" && cleanUrl === "/api/proposals") {
    const body = await readJsonBody(req);
    sendJson(res, 200, await createSiteProposal(body));
    return true;
  }

  if (req.method === "POST" && cleanUrl === "/api/vote") {
    const body = await readJsonBody(req);
    sendJson(res, 200, await castSiteVote(body));
    return true;
  }

  if (req.method === "POST" && cleanUrl === "/api/tally") {
    const body = await readJsonBody(req);
    sendJson(res, 200, await publishSiteTally(body));
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
    sendJson(res, 500, { error: message });
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
  console.error(`Unable to start local server on 127.0.0.1:${port}: ${err.message}`);
  process.exit(1);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`CipherDAO running at http://127.0.0.1:${port}`);
});
