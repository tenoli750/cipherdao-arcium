# Deployment

The safest deployment path for this project is a small VPS that runs the DAO web/API server and, optionally, talks to a private GPU image generator over LAN or VPN.

Static hosting alone is not enough because the app needs API routes for Solana transaction building, Arcium status, proposal state, and generated image storage.

## Recommended Layout

```text
Browser + Phantom
  -> HTTPS domain
  -> Nginx reverse proxy
  -> Would You DAO Node server
  -> Solana devnet RPC + Arcium
  -> optional private image generator
```

Keep the GPU image generator off the public internet.

## VPS Setup

Install Node.js, clone the repo, and install dependencies:

```bash
git clone <your-repo-url>
cd arcium
npm ci
npm run check
```

Create a server wallet keypair on the VPS or copy a dedicated devnet keypair:

```bash
mkdir -p ~/.config/solana
solana-keygen new --outfile ~/.config/solana/would-you-dao.json
```

Fund that wallet on devnet if needed:

```bash
solana airdrop 2 ~/.config/solana/would-you-dao.json --url https://api.devnet.solana.com
```

Start the DAO server:

```bash
PORT=4173 \
HOST=127.0.0.1 \
RPC_URL=https://api.devnet.solana.com \
ARCIUM_CLUSTER_OFFSET=456 \
KEYPAIR=$HOME/.config/solana/would-you-dao.json \
REMOTE_IMAGE_GENERATOR_URL=http://PRIVATE_GPU_IP:7861/generate \
IMAGE_GENERATOR_TOKEN=change-this-token \
IMAGE_GENERATION_SIZE=384 \
DEEPL_API_KEY=$DEEPL_API_KEY \
npm run dev
```

If you are not using generated images yet, omit `REMOTE_IMAGE_GENERATOR_URL`, `IMAGE_GENERATOR_TOKEN`, and `IMAGE_GENERATION_SIZE`.
If you are not using automatic translation, omit `DEEPL_API_KEY`.

## Process Manager

Use `pm2` or a systemd service so the app restarts after crashes or reboot.

Example with `pm2`:

```bash
npm install -g pm2
pm2 start scripts/dev-server.js --name would-you-dao --update-env
pm2 save
pm2 startup
```

Pass the environment variables through your shell, `.env` loader, or the process manager's ecosystem config.

## Nginx

Expose the local Node server through HTTPS:

```nginx
server {
  server_name your-domain.com;

  location / {
    proxy_pass http://127.0.0.1:4173;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

Then use Certbot or your host's TLS tooling to issue HTTPS certificates.

## Platform Hosting

For Render, Fly.io, Railway, or similar Node platforms:

```bash
npm ci
HOST=0.0.0.0 PORT=$PORT npm run dev
```

You still need persistent storage for:

- `artifacts/site-proposals.json`
- `site/generated/`

If the platform filesystem is ephemeral, move proposal metadata and generated images to a database/object storage before treating it as production.

## Vercel

This repo includes `vercel.json` and `api/index.js` so Vercel can serve the mobile site and route `/api/*` requests into a serverless function.

Deploy with:

```bash
npm run check
vercel --prod
```

Recommended Vercel environment variables:

```bash
RPC_URL=https://api.devnet.solana.com
ARCIUM_CLUSTER_OFFSET=456
ENABLE_IMAGE_GENERATION=0
DEEPL_API_KEY=<server-side-deepl-key>
SUPABASE_URL=<supabase-project-url>
SUPABASE_SERVICE_ROLE_KEY=<server-side-service-role-key>
SUPABASE_STATE_TABLE=would_you_dao_state
SUPABASE_STATE_ID=production
```

Do not upload a personal wallet key unless you intentionally want server-signed admin routes on Vercel. Connected-wallet proposal, vote, and tally flows use the user's wallet for signing. If you do need a dedicated server wallet, set exactly one of:

```bash
KEYPAIR_JSON=<solana keypair JSON array>
KEYPAIR_BASE64=<base64 encoded keypair JSON array>
```

On Vercel, if Supabase env vars are not configured, the default state path is `/tmp/site-proposals.json`, which is ephemeral. That is enough for a deploy preview and demo seeded rounds, but production proposal metadata should use Supabase.

## Supabase Metadata Store

Solana and Arcium hold the actual proposal state, encrypted vote state, and final tally. Supabase only stores website metadata that is not practical to keep directly in the current on-chain account layout:

- question text and translations
- category labels
- the proposal list the mobile feed should show
- transaction receipts used by the UI

Create the table by running [supabase/schema.sql](../supabase/schema.sql) in the Supabase SQL editor.

The preferred setup for this project is the Supabase Postgres pooler URL. The app will create the metadata table automatically when `DATABASE_URL` or `POSTGRES_URL` is set:

```bash
vercel env add DATABASE_URL production --sensitive
vercel env add SUPABASE_STATE_TABLE production --value would_you_dao_state --yes
vercel env add SUPABASE_STATE_ID production --value production --yes
vercel --prod
```

You can also use the Supabase REST API with a service-role key:

```bash
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production --sensitive
vercel env add SUPABASE_STATE_TABLE production --value would_you_dao_state --yes
vercel env add SUPABASE_STATE_ID production --value production --yes
vercel --prod
```

Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only. It is used only inside `/api/*`; it is never exposed to the browser bundle.
Keep `DATABASE_URL` or `POSTGRES_URL` server-side only for the same reason.

## Security Checklist

- Do not commit private keypairs, `.env` files, API keys, or generator tokens.
- Keep `DEEPL_API_KEY` server-side only; never put it in `site/` frontend code.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only; never put it in `site/` frontend code.
- Keep `DATABASE_URL` and `POSTGRES_URL` server-side only; they include database credentials.
- Keep `KEYPAIR` as a dedicated low-balance devnet/server wallet.
- Keep the GPU generator private; do not port-forward it publicly.
- Set `IMAGE_GENERATOR_TOKEN` whenever the generator is reachable over LAN/VPN.
- Use HTTPS for the public domain so Phantom wallet connections work reliably.
- Back up `artifacts/site-proposals.json` and `site/generated/` if you care about preserving rounds and images.
