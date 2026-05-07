# Windows GPU + Mac DAO Setup

Use this when the RTX GPU is on a Windows PC and the DAO site is running on this Mac.

## 1. Windows PC: Ollama (optional, for prompt rewriting)

If you want the bridge to rewrite each choice into a tighter English Stable Diffusion prompt using a **local** model only, install [Ollama](https://ollama.com/) on Windows, then:

```bat
ollama pull qwen2.5:3b-instruct
ollama serve
```

Leave this running in its own window when `USE_LOCAL_LLM_PROMPTS=1` is set on the bridge.

## 2. Windows PC: Start Stable Diffusion WebUI

Open `webui-user.bat` and make sure the API flag is enabled:

```bat
set COMMANDLINE_ARGS=--api
```

Then start WebUI:

```bat
webui-user.bat
```

Leave this window open. The WebUI API should be available on:

```text
http://127.0.0.1:7860
```

## 3. Windows PC: Start the Would You DAO Bridge

Open another Command Prompt in this repo folder.

Install dependencies once:

```bat
npm ci
```

Start the bridge:

```bat
scripts\start-windows-image-generator.cmd
```

Default settings:

- Bridge URL: `http://WINDOWS_LAN_IP:7861/generate`
- Health URL: `http://WINDOWS_LAN_IP:7861/health`
- Token: `would-you-dao-local`
- Image size: `384x384`
- Steps: `14`

With Ollama and Pinata enabled (via environment variables in the script or your shell), the bridge can rewrite prompts, translate custom vote options, and return `https://…/ipfs/…` URLs instead of `data:image/…` payloads. See `docs/windows-cursor-request.md` for the full contract.

## 4. Windows PC: Find LAN IP

In Command Prompt:

```bat
ipconfig
```

Find the `IPv4 Address` for the active Wi-Fi or Ethernet adapter. It usually looks like:

```text
192.168.0.23
```

## 5. Mac: Test the Windows Bridge

Replace `WINDOWS_LAN_IP` with the IP from step 4:

```bash
curl http://WINDOWS_LAN_IP:7861/health
```

On the Windows machine itself you can use:

```bat
curl http://127.0.0.1:7861/health
```

Expected response includes `ok`, `sdWebuiUrl`, and `width` / `height`. When optional features are configured, `localLlm` and `pinata` booleans reflect whether Ollama rewriting and Pinata upload are active.

If this fails, check Windows Firewall and allow Node.js on Private networks.

## 6. Mac: Start the DAO Site with Windows Image Generation

```bash
REMOTE_IMAGE_GENERATOR_URL=http://WINDOWS_LAN_IP:7861/generate \
IMAGE_GENERATOR_TOKEN=would-you-dao-local \
IMAGE_GENERATION_SIZE=384 \
DEEPL_API_KEY=$DEEPL_API_KEY \
npm run dev
```

Open:

```text
http://127.0.0.1:4173
```

Create a New Vote. The placeholder boxes should be replaced by generated A/B images after the round is prepared.

If `DEEPL_API_KEY` is set on the Mac DAO server, the New Vote form uses DeepL for EN/KR auto-translation. Keep this key out of frontend code and do not commit it.

## 7. Faster or Better Images

Faster:

```bat
set IMAGE_GENERATION_SIZE=320
set SD_STEPS=10
scripts\start-windows-image-generator.cmd
```

Better:

```bat
set IMAGE_GENERATION_SIZE=512
set SD_STEPS=18
scripts\start-windows-image-generator.cmd
```

## 8. Safety

- Use the bridge only on your private home/work LAN.
- Do not port-forward `7861`.
- Keep `IMAGE_GENERATOR_TOKEN` set.
- Keep Stable Diffusion WebUI itself on `127.0.0.1`; only the bridge needs LAN access.
- Do not put `PINATA_JWT` or other secrets in `site/` or commit `.env` files.
