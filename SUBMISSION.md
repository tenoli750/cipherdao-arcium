# CipherDAO Submission

## Summary

CipherDAO is a private DAO voting interface for Solana. It uses Arcium to keep ballots and interim tallies encrypted while a proposal is open, then publishes only the final aggregate result after the vote closes.

## Arcium Usage

The project includes an Arcium project layout with:

- `encrypted-ixs/private_vote.rs`: Arcis confidential instructions.
- `programs/private_dao/src/lib.rs`: Solana program queues Arcium computations and verifies callbacks.
- `app/privateDaoClient.ts`: TypeScript client flow for input encryption and finalization.

Votes are encrypted client-side, processed inside Arcium MPC, stored as MXE-owned encrypted state, and revealed only as final yes, no, abstain, and total counts.

## Privacy Benefits

- No public interim vote choices.
- No public running tally before close.
- Reduced bribery, retaliation, and tactical voting.
- Public final result with verified Arcium callback output.

## User Experience

The web app starts directly in a working DAO dashboard. Users can connect a demo wallet, create proposals, cast encrypted votes, inspect encrypted receipts, and publish a final tally.

## Impact

Private DAO voting can make governance more credible for treasuries, validator delegations, grant councils, and community decisions where early vote visibility changes voter behavior.

## Repository

The project is MIT licensed and ready to publish as an open-source GitHub repository.
