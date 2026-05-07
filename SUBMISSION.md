# Would You DAO Submission

## Summary

Would You DAO? is a private balance-game DAO for Solana. It turns funny everyday "would you rather" questions into sealed voting rounds: live vote splits stay hidden while a round is open, and only the final result is published after Arcium finalization.

Live site: https://wouldudao.vercel.app

## Arcium Usage

The project includes an Arcium project layout with:

- `encrypted-ixs/private_vote.rs`: Arcis confidential instructions.
- `programs/private_dao/src/lib.rs`: Solana program queues Arcium computations and verifies callbacks.
- `app/privateDaoClient.ts`: TypeScript client flow for input encryption and finalization.

Votes are encrypted client-side, processed inside Arcium MPC, stored as MXE-owned encrypted state, and revealed only as final yes, no, abstain, and total counts.

The compiled Arcis circuits are published as public off-chain artifacts and referenced from the Solana program with `OffChainCircuitSource` plus `circuit_hash!(...)`, reducing Solana rent while preserving circuit integrity checks.

## Privacy Benefits

- No public interim vote choices.
- No public running tally before close.
- Reduced bribery, retaliation, and tactical voting.
- Public final result with verified Arcium callback output.

## User Experience

The web app starts directly in a mobile-first voting feed with `Finalized`, `New`, and `Profile` navigation. Users can connect their own Solana wallet, create bilingual rounds from a single input form, cast encrypted A/B votes, and reveal final results after the broadcast window closes.

## Impact

The app uses a funny social format, but the privacy model is serious: people can answer awkward or socially loaded questions without exposing their choice before the final tally. The same pattern can extend to community governance, grant councils, validator delegations, and any decision where early vote visibility changes voter behavior.

## Repository

The project is MIT licensed and published as an open-source GitHub repository:

https://github.com/tenoli750/cipherdao-arcium

## Deployment

Production app:

https://wouldudao.vercel.app
