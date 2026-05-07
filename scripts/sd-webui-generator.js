const http = require("node:http");
require("./load-env");

const host = process.env.IMAGE_GENERATOR_HOST || "127.0.0.1";
const port = Number(process.env.IMAGE_GENERATOR_PORT || 7861);
const sdWebuiUrl = (process.env.SD_WEBUI_URL || "http://127.0.0.1:7860").replace(/\/$/, "");
const token = process.env.IMAGE_GENERATOR_TOKEN || "";
const imageSize = dimension(process.env.IMAGE_GENERATION_SIZE, 512);
const width = dimension(process.env.IMAGE_WIDTH, imageSize);
const height = dimension(process.env.IMAGE_HEIGHT, imageSize);
const steps = numberEnv("SD_STEPS", 18);
const cfgScale = numberEnv("SD_CFG_SCALE", 6.5);
const samplerName = process.env.SD_SAMPLER || "Euler a";
const timeoutMs = numberEnv("IMAGE_GENERATION_TIMEOUT_MS", 180000);
const stylePrompt = process.env.SD_STYLE_PROMPT
  || "exactly one cute funny chibi-style Korean female character sticker illustration, fully clothed, bold clean outline, expressive character, full face and upper body visible, centered square composition, simple background, no text, no watermark";
const negativePrompt = process.env.SD_NEGATIVE_PROMPT
  || "text, caption, watermark, logo, multiple characters, duplicate character, duplicated face, two girls, group, character sheet, sprite sheet, reference sheet, contact sheet, grid, collage, four panels, split screen, blank speech bubble, empty speech bubble, white blob, abstract blob, abstract shape, faceless character, cropped face, blurry, low quality, distorted hands, extra limbs, nsfw, gore";

const useLocalLlmPrompts = process.env.USE_LOCAL_LLM_PROMPTS === "1";
const ollamaUrl = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
const ollamaModel = process.env.OLLAMA_MODEL || "qwen2.5:3b-instruct";
const llmPromptTimeoutMs = numberEnv("LLM_PROMPT_TIMEOUT_MS", 30000);

const pinataJwt = String(process.env.PINATA_JWT || "").trim();
const pinataGateway = String(process.env.PINATA_GATEWAY || "").trim().replace(/\/$/, "");
const pinataNetwork = String(process.env.PINATA_NETWORK || "public").trim() || "public";

function dimension(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(256, Math.min(1024, Math.round(parsed / 8) * 8));
}

function numberEnv(name, fallback) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function pinataConfigured() {
  return Boolean(pinataJwt && pinataGateway);
}

function isAuthorized(req) {
  if (!token) return true;
  const bearer = req.headers.authorization || "";
  return bearer === `Bearer ${token}` || req.headers["x-image-generator-token"] === token;
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 256 * 1024) throw new Error("Request body is too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(data));
}

function promptFor(value) {
  return [String(value || "").trim(), stylePrompt].filter(Boolean).join(", ");
}

function requestDimensions(body) {
  const raw = body && body.size;
  if (raw == null || raw === "") {
    return { width, height };
  }
  const s = dimension(raw, width);
  return { width: s, height: s };
}

function categoryLabel(category) {
  if (category == null) return "General";
  if (typeof category === "string") return category.trim() || "General";
  if (typeof category === "object") {
    const en = typeof category.en === "string" ? category.en.trim() : "";
    const ko = typeof category.ko === "string" ? category.ko.trim() : "";
    if (en && ko) return `${en} / ${ko}`;
    return en || ko || "General";
  }
  return "General";
}

function buildLlmInstruction(choice, category) {
  return `You convert Korean/English would-you-rather choices into image prompts.

Rules:
- Output only one English image prompt.
- No text, captions, letters, UI, symbols, logos, or watermark in the image.
- Make the scene funny and instantly understandable.
- Use exactly one chibi girl as the only character.
- Do not create duplicate characters, a character sheet, a sprite sheet, a contact sheet, panels, grid, or collage.
- Include one clear prop or situation that directly represents the choice.
- Keep it safe, non-sexual, non-graphic.
- Style: exactly one cute funny chibi-style Korean female character sticker, fully clothed, bold clean outline, expressive character, centered square composition.
- Do not explain.

Choice:
${choice}

Category:
${category}`;
}

function languageLabel(value) {
  return value === "ko" ? "Korean" : "English";
}

function buildTranslationInstruction(items, from, to, category) {
  const entries = Object.entries(items)
    .filter(([, value]) => String(value || "").trim())
    .map(([key, value]) => `${key.toUpperCase()}: ${String(value).trim()}`)
    .join("\n");

  return `Translate would-you-rather options from ${languageLabel(from)} to ${languageLabel(to)}.

Rules:
- Return strict JSON only.
- Preserve the meaning and A/B dilemma structure.
- Keep the tone natural, casual, and funny.
- Do not add explanations.
- Do not add markdown fences.
- Use keys exactly as provided.

Category:
${category}

Options:
${entries}

Return format example:
{"a":"translated option A","b":"translated option B"}`;
}

function normalizeRewrittenPrompt(text) {
  let s = String(text || "").trim();
  if (!s) return "";
  s = s.replace(/^```[\w]*\n?/i, "").replace(/\n?```$/i, "").trim();
  const firstLine = s.split(/\r?\n/).map((line) => line.trim()).find((line) => line.length > 0);
  if (firstLine) s = firstLine;
  s = s.replace(/^["']|["']$/g, "").trim();
  return s.slice(0, 800);
}

function parseTranslationJson(text) {
  const raw = String(text || "").trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  const candidate = start >= 0 && end > start ? raw.slice(start, end + 1) : raw;
  const parsed = JSON.parse(candidate);
  if (!parsed || typeof parsed !== "object") throw new Error("translation response was not a JSON object");
  return Object.fromEntries(
    Object.entries(parsed)
      .filter(([, value]) => typeof value === "string" && value.trim())
      .map(([key, value]) => [key, value.trim().slice(0, 180)])
  );
}

async function ollamaGenerate(prompt, timeoutMsForRequest = llmPromptTimeoutMs) {
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: ollamaModel,
      stream: false,
      prompt
    }),
    signal: AbortSignal.timeout(timeoutMsForRequest)
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Ollama returned ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ""}`);
  }
  const data = await response.json();
  return typeof data.response === "string" ? data.response : "";
}

async function ollamaRewrite(choice, category) {
  return normalizeRewrittenPrompt(await ollamaGenerate(buildLlmInstruction(choice, category)));
}

async function translateOptions(body) {
  const from = body.from === "ko" ? "ko" : "en";
  const to = body.to === "ko" ? "ko" : "en";
  if (from === to) throw new Error("from and to languages must differ");
  const items = body.items && typeof body.items === "object" ? body.items : {};
  const cleanItems = Object.fromEntries(
    Object.entries(items)
      .filter(([, value]) => typeof value === "string" && value.trim())
      .map(([key, value]) => [key, value.trim().slice(0, 180)])
  );
  if (!Object.keys(cleanItems).length) throw new Error("items must include text to translate");
  const raw = await ollamaGenerate(
    buildTranslationInstruction(cleanItems, from, to, categoryLabel(body.category)),
    numberEnv("TRANSLATION_TIMEOUT_MS", 30000)
  );
  const translated = parseTranslationJson(raw);
  return {
    from,
    to,
    items: translated
  };
}

async function resolveSdPrompt(body, key) {
  const raw = String((body.prompts || {})[key] || "").trim();
  if (!raw) throw new Error(`Request must include prompts.${key}`);
  if (!useLocalLlmPrompts) return raw;
  try {
    const rewritten = await ollamaRewrite(raw, categoryLabel(body.category));
    return rewritten || raw;
  } catch (error) {
    console.error(`Ollama rewrite failed for ${key}:`, error instanceof Error ? error.message : error);
    return raw;
  }
}

async function generateImage(prompt, dims) {
  const w = dims.width;
  const h = dims.height;
  const response = await fetch(`${sdWebuiUrl}/sdapi/v1/txt2img`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: promptFor(prompt),
      negative_prompt: negativePrompt,
      width: w,
      height: h,
      steps,
      cfg_scale: cfgScale,
      sampler_name: samplerName,
      batch_size: 1,
      n_iter: 1,
      seed: -1,
      restore_faces: false
    }),
    signal: AbortSignal.timeout(timeoutMs)
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Stable Diffusion WebUI returned ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ""}`);
  }

  const data = await response.json();
  const image = Array.isArray(data.images) ? data.images[0] : "";
  if (typeof image !== "string" || !image) {
    throw new Error("Stable Diffusion WebUI response did not include an image");
  }
  return image.startsWith("data:image/") ? image : `data:image/png;base64,${image}`;
}

function dataUrlToPngBuffer(dataUrl) {
  const match = /^data:image\/png;base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) throw new Error("Expected data:image/png;base64 from Stable Diffusion");
  return Buffer.from(match[1], "base64");
}

function extractPinataCid(json) {
  if (json && typeof json.data === "object" && json.data && typeof json.data.cid === "string") {
    return json.data.cid.trim();
  }
  if (json && typeof json.cid === "string") return json.cid.trim();
  return "";
}

async function uploadPngToPinata(pngBuffer, filename) {
  const form = new FormData();
  form.append("network", pinataNetwork);
  form.append("file", new Blob([pngBuffer], { type: "image/png" }), filename);
  form.append("name", filename);

  const response = await fetch("https://uploads.pinata.cloud/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${pinataJwt}` },
    body: form,
    signal: AbortSignal.timeout(timeoutMs)
  });
  const text = await response.text().catch(() => "");
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }
  if (!response.ok) {
    throw new Error(`Pinata upload returned ${response.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
  }
  const cid = extractPinataCid(json);
  if (!cid) throw new Error("Pinata response did not include a CID");
  return cid;
}

async function maybePinataUrl(dataUrl, proposalId, side) {
  if (!pinataConfigured()) return dataUrl;
  try {
    const buf = dataUrlToPngBuffer(dataUrl);
    const safeId = String(proposalId || "unknown").replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80) || "unknown";
    const filename = `would-you-dao-${safeId}-${side}.png`;
    const cid = await uploadPngToPinata(buf, filename);
    return `${pinataGateway}/ipfs/${cid}`;
  } catch (error) {
    console.error(`Pinata upload failed for ${side}:`, error instanceof Error ? error.message : error);
    return dataUrl;
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, {
      ok: true,
      sdWebuiUrl,
      width,
      height,
      localLlm: useLocalLlmPrompts,
      translation: true,
      pinata: pinataConfigured()
    });
    return;
  }

  if (req.method !== "POST" || (url.pathname !== "/generate" && url.pathname !== "/translate")) {
    sendJson(res, 404, { error: "Not found" });
    return;
  }

  if (!isAuthorized(req)) {
    sendJson(res, 401, { error: "Unauthorized" });
    return;
  }

  try {
    const body = await readJson(req);
    if (url.pathname === "/translate") {
      sendJson(res, 200, await translateOptions(body));
      return;
    }

    const prompts = body.prompts || {};
    if (!prompts.a || !prompts.b) {
      throw new Error("Request must include prompts.a and prompts.b");
    }

    const dims = requestDimensions(body);
    const proposalId = typeof body.id === "string" ? body.id : "";

    const promptA = await resolveSdPrompt(body, "a");
    const promptB = await resolveSdPrompt(body, "b");

    const dataA = await generateImage(promptA, dims);
    const dataB = await generateImage(promptB, dims);

    const a = await maybePinataUrl(dataA, proposalId, "a");
    const b = await maybePinataUrl(dataB, proposalId, "b");

    sendJson(res, 200, {
      images: {
        a,
        b,
        status: "generated"
      }
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

server.listen(port, host, () => {
  if (host !== "127.0.0.1" && host !== "localhost" && !token) {
    console.warn("Warning: IMAGE_GENERATOR_HOST is not localhost and IMAGE_GENERATOR_TOKEN is empty.");
  }
  console.log(`Would You DAO image generator on http://${host}:${port}/generate`);
  console.log(`Stable Diffusion WebUI target: ${sdWebuiUrl}`);
  console.log(`Image size: ${width}x${height}, steps: ${steps}, sampler: ${samplerName}`);
  if (useLocalLlmPrompts) {
    console.log(`Local LLM prompts: Ollama ${ollamaUrl} model ${ollamaModel}`);
  }
  if (pinataConfigured()) {
    console.log("Pinata IPFS upload: enabled (gateway configured)");
  }
});
