# Devnet Runbook

## Current devnet deployment

- Program ID: `6NvJiHpUPbmnbgrdHx6Pne5K1qzCWXfwkT5MmDxShkKe`
- DAO PDA: `DkY9gxYeKQSnbzjotaV3cBijqMPus42JbTMHZonCB1HK`
- Cluster offset: `456`
- RPC used: `https://api.devnet.solana.com`
- Deploy wallet: `G7edfAbsripisGuY4BKqWq3MR2kXkhqZM8zYWAUoYZn7`

Completed:

- Program deployed to devnet and upgraded with v2 confidential circuits.
- IDL uploaded and upgraded.
- MXE initialized.
- DAO account initialized.
- v2 computation definition accounts initialized with off-chain circuit sources.
- Public GitHub repository published at `https://github.com/tenoli750/wouldudao-arcium`.
- Private proposal bootstrap, encrypted vote, and private tally flow verified on devnet.

Verified proposal:

- Proposal PDA: `45jmnipw7eUj6hpUuemxDKRqP6JpSiXghuCJ2LECPyg6`
- Initial encrypted state chunks: `5`
- Vote choice submitted: encrypted `yes`
- Final result: `yes=1`, `no=0`, `abstain=0`, `total=1`
- Finalized: `true`

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

## Notes

The v2 computation definitions use off-chain `.arcis` files in `public-circuits/`:

- `init_private_ballot_v2.arcis`
- `cast_private_vote_v2.arcis`
- `publish_private_tally_v2.arcis`

Arcium nodes fetch these files from the public GitHub raw URLs and verify them against the on-chain `circuit_hash!(...)` values before execution.
