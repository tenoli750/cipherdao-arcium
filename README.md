# CipherDAO

CipherDAO is a simple DAO voting site that demonstrates private governance on Solana with Arcium. The app keeps votes hidden while the proposal is open, then publishes only the final tally and a verified computation result after finalization.

## Why this matters

Public voting creates vote-copying, bribery, retaliation, and tactical last-minute voting incentives because every ballot is observable before the vote closes. CipherDAO removes that signal. Voters receive public encrypted receipts, but observers cannot learn interim preferences. The final result is computed by Arcium's MPC network and verified on Solana.

## What is included

- A usable static DAO dashboard in `site/`.
- A Solana and Arcium project layout with `Anchor.toml`, `Arcium.toml`, `programs/private_dao/`, and `encrypted-ixs/`.
- A confidential Arcis instruction design for encrypted vote state and final tallying.
- A TypeScript client integration guide in `app/privateDaoClient.ts`.
- English submission documentation in `docs/arcium-integration.md`.
- MIT license for open-source publication.

## Run the site

Open `site/index.html` in a browser, or run:

```bash
npm run dev
```

Then visit `http://127.0.0.1:4173`.

## Run checks

```bash
npm test
npm run check
```

The smoke test validates the static app files and the deterministic governance helper logic.

## Devnet workflow

The project includes basic devnet scripts:

```bash
npm run deploy:devnet
RPC_URL=https://api.devnet.solana.com ARCIUM_CLUSTER_OFFSET=456 npm run dao:bootstrap
```

The current devnet program is `BasNpiyU8fAv9zYjZxS59p47tSKLA2UbJCWJu6vGPqUV`. See `docs/devnet-runbook.md` for the latest deployment state and follow-up commands.

## Arcium flow

1. The voter encrypts a ballot in the browser with the MXE public key using the Arcium JavaScript client.
2. The Solana program queues the `cast_private_vote` confidential instruction.
3. Arcium converts ciphertexts into secret shares and updates `Enc<Mxe, BallotState>`.
4. No observer sees the vote choice or running tally while the proposal is open.
5. When the proposal closes, the program queues `publish_private_tally`.
6. Arcium reveals only the aggregate counts and returns a signed output.
7. The callback verifies the output with `verify_output(...)` before publishing the tally on Solana.

## Project status

This repository is designed as a hackathon-ready implementation scaffold. The browser app is runnable without dependencies. The Solana and Arcium files follow the Arcium `0.9.7` project shape.

Local verification was run with:

- Rust `1.95.0`
- Solana CLI `2.3.0`
- Anchor CLI `0.32.1`
- Arcium CLI `0.9.7`
- Docker via Colima

Verified locally:

```bash
arcium build
arcium test
npm run check
```

`Anchor.toml` uses a high validator gossip port range to avoid common local port conflicts.

## GitHub publication

Create a public GitHub repository named `cipherdao`, then push this project:

```bash
git init
git add .
git commit -m "Initial CipherDAO private governance demo"
git branch -M main
git remote add origin https://github.com/<your-org>/cipherdao.git
git push -u origin main
```
