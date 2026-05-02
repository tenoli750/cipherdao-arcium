# Would You DAO?

Would You DAO? is a private balance-game DAO for funny everyday dilemmas. It started with hygiene questions as `씻었DAO`, then expanded into daily life, food, money, relationships, school, work, superpowers, and absurd choices. The app keeps live vote splits hidden while a round is open, then publishes only the final tally and a verified computation result after finalization.

## Why this matters

Public voting creates vote-copying, social pressure, and tactical last-minute voting because every ballot is observable before the vote closes. Would You DAO? removes that signal for a lighter, more viral format: users choose A or B, receive public encrypted receipts, and only see the aggregate result after Arcium finalizes the round.

## What is included

- A usable bilingual balance-game site in `site/`.
- English-first mobile UI with a Korean `씻었DAO` mode in Profile.
- Scroll-snap voting feed with `Hot`, `New`, and `Profile` bottom navigation.
- A built-in bank of everyday A/B dilemmas.
- A Solana and Arcium project layout with `Anchor.toml`, `Arcium.toml`, `programs/private_dao/`, and `encrypted-ixs/`.
- A confidential Arcis instruction design for encrypted vote state and final tallying.
- A TypeScript client integration guide in `app/privateDaoClient.ts`.
- Public off-chain Arcis circuit artifacts in `public-circuits/`.
- English submission documentation in `docs/arcium-integration.md`.
- MIT license for open-source publication.

## Run the site

Run the local web server:

```bash
npm run dev
```

Then visit `http://127.0.0.1:4173`.

The local server serves the app and exposes a small devnet API that builds unsigned transactions for a connected Solana wallet:

- `GET /api/status`
- `GET /api/vote-encryption`
- `POST /api/wallet/proposal-tx`
- `POST /api/wallet/proposal-confirm`
- `POST /api/wallet/vote-tx`
- `POST /api/wallet/vote-confirm`
- `POST /api/wallet/tally-tx`
- `POST /api/wallet/tally-confirm`

That means the browser buttons connect Phantom or another injected Solana wallet, encrypt votes in the browser, ask the wallet to sign Solana devnet transactions, and then wait for Arcium finalization. Legacy relayer endpoints remain for scripted local demos, but the site UI uses the connected wallet path.

## Run checks

```bash
npm test
npm run check
```

The smoke test validates the static app files, bilingual balance-game UI, and deterministic governance helper logic.
If `site/src/arcium-vote-client.js` changes, rebuild the browser crypto bundle with `npm run build:site-crypto`.

## Devnet workflow

The project includes basic devnet scripts:

```bash
npm run deploy:devnet
RPC_URL=https://api.devnet.solana.com ARCIUM_CLUSTER_OFFSET=456 npm run dao:bootstrap
```

The current devnet program is `6NvJiHpUPbmnbgrdHx6Pne5K1qzCWXfwkT5MmDxShkKe`. See `docs/devnet-runbook.md` for the latest deployment state, proposal PDA, and follow-up commands.

Large Arcis circuits are configured for off-chain loading from the public GitHub repository. Arx nodes verify each downloaded circuit with `circuit_hash!(...)`, so the bytecode does not need to be stored fully on Solana for new deployments.

## Arcium flow

1. The browser fetches the MXE public key and encrypts the voter hash plus balance-game choice with the Arcium JavaScript crypto client.
2. The local API builds an unsigned Solana transaction whose fee payer is the connected wallet.
3. The wallet signs and sends the transaction, queuing `cast_private_vote_v2`. Option A maps to `yes`, option B maps to `no`, and skip maps to `abstain`.
4. Arcium converts ciphertexts into secret shares and updates `Enc<Mxe, BallotState>`.
5. No observer sees the vote choice or running tally while the proposal is open.
6. When the proposal closes, the wallet signs a transaction that queues `publish_private_tally_v2`.
7. Arcium reveals only the aggregate counts and returns a signed output.
8. The callback verifies the output with `verify_output(...)` before publishing the tally on Solana.

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

Public repository:

https://github.com/tenoli750/cipherdao-arcium
