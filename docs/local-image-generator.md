# Local Image Generator

This project can replace the A/B image placeholders by calling a private image generator over HTTP.
The recommended low-cost setup is Stable Diffusion WebUI on the RTX 4060 machine, plus the small bridge in `scripts/sd-webui-generator.js`.

If the GPU is on a Windows PC and the DAO site is on this Mac, follow `docs/windows-gpu-mac-dao.md`.

## GPU Machine

Start Stable Diffusion WebUI with its API enabled.

For AUTOMATIC1111 WebUI, launch it with:

```bash
./webui.sh --api
```

On Windows, use the equivalent `webui-user.bat` arguments:

```bat
set COMMANDLINE_ARGS=--api
webui-user.bat
```

Then run the bridge server from this repo:

```bash
IMAGE_GENERATION_SIZE=512 \
SD_WEBUI_URL=http://127.0.0.1:7860 \
IMAGE_GENERATOR_TOKEN=change-this-token \
IMAGE_GENERATOR_HOST=0.0.0.0 \
npm run image:sd-webui
```

Use `IMAGE_GENERATION_SIZE=384` if the 4060 is too slow. The value is rounded to a multiple of 8.

## DAO Machine

Run the DAO server with the GPU machine's LAN IP:

```bash
REMOTE_IMAGE_GENERATOR_URL=http://GPU_LAN_IP:7861/generate \
IMAGE_GENERATION_SIZE=512 \
IMAGE_GENERATOR_TOKEN=change-this-token \
npm run dev
```

When a new vote is created, the DAO server sends two prompts:

- `prompts.a` for option A
- `prompts.b` for option B

The bridge returns:

```json
{
  "images": {
    "a": "data:image/png;base64,...",
    "b": "data:image/png;base64,..."
  }
}
```

The DAO server saves those data URLs under `site/generated/` and the feed renders them in the existing square image boxes.

## Useful Settings

```bash
IMAGE_WIDTH=512
IMAGE_HEIGHT=512
SD_STEPS=18
SD_CFG_SCALE=6.5
SD_SAMPLER="Euler a"
SD_STYLE_PROMPT="cute funny Korean webtoon sticker illustration, bold clean outline, no text"
SD_NEGATIVE_PROMPT="text, watermark, blurry, low quality, nsfw"
IMAGE_GENERATION_TIMEOUT_MS=180000
```

## Security Notes

- Keep Stable Diffusion WebUI bound to `127.0.0.1` on the GPU machine.
- Only expose the bridge server to your LAN when needed.
- Always set `IMAGE_GENERATOR_TOKEN` if `IMAGE_GENERATOR_HOST=0.0.0.0`.
- Do not port-forward the generator to the public internet.
- Do not put generator tokens or API keys in frontend files under `site/`.
