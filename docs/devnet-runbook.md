# Devnet Runbook

## Current devnet deployment

- Program ID: `BasNpiyU8fAv9zYjZxS59p47tSKLA2UbJCWJu6vGPqUV`
- DAO PDA: `AyNsESQFGTSvjD7Jzn7a1iymmJQNxEefGanSbZECDQD1`
- Cluster offset: `456`
- RPC used: `https://api.devnet.solana.com`

Completed:

- Program deployed to devnet.
- IDL uploaded.
- MXE initialized.
- DAO account initialized.
- Computation definition accounts initialized.

Blocked:

- Circuit upload/finalization needs additional devnet SOL for raw circuit account rent.
- The public devnet faucet rate-limited additional airdrops after initial deployment.

## Commands

```bash
npm run deploy:devnet
```

```bash
RPC_URL=https://api.devnet.solana.com ARCIUM_CLUSTER_OFFSET=456 npm run dao:bootstrap
```

```bash
PROPOSAL=<proposal-pda> STATE_NONCE=<nonce> CHOICE=yes \
RPC_URL=https://api.devnet.solana.com ARCIUM_CLUSTER_OFFSET=456 npm run dao:vote
```

```bash
PROPOSAL=<proposal-pda> STATE_NONCE=<nonce> \
RPC_URL=https://api.devnet.solana.com ARCIUM_CLUSTER_OFFSET=456 npm run dao:tally
```

## Funding note

Arcium circuit upload stores raw circuit accounts on Solana. That requires rent. If bootstrap fails with insufficient lamports, fund the deploy wallet:

```bash
solana address
solana balance --url https://api.devnet.solana.com
solana airdrop 5 --url https://api.devnet.solana.com
```

If the public faucet is rate-limited, use another devnet faucet or a funded devnet wallet, then rerun `npm run dao:bootstrap`.
