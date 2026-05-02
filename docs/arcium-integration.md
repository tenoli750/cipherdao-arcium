# Arcium Integration

CipherDAO uses Arcium to make DAO voting private until the final result is published.

## Problem

DAO votes are often public from the moment they are submitted. That leaks interim sentiment, encourages vote-copying, and can expose voters to coercion or retaliation.

## Arcium design

CipherDAO keeps the ballot state inside an Arcium MPC computation.

- Voters encrypt `VoteInput` in the browser with the MXE public key and submit ciphertexts through Solana.
- `cast_private_vote_v2` runs in Arcis and updates `Enc<Mxe, BallotState>`.
- The encrypted state is stored back on Solana, but only the MXE can decrypt it.
- Interim vote choices and running totals are never revealed to voters, validators, RPC providers, or the application host.
- `publish_private_tally_v2` runs after the close time and reveals only aggregate counts.
- The Solana callback verifies Arcium's signed output before storing final results.

## Confidential instruction surface

`encrypted-ixs/private_vote.rs` defines:

- `VoteInput`: a private voter hash and choice.
- `BallotState`: encrypted yes, no, abstain, and total counters.
- `cast_private_vote_v2`: updates the encrypted counter state inside `Enc<Mxe, BallotState>`.
- `publish_private_tally_v2`: counts yes, no, and abstain privately, then reveals only totals.
- The compiled `.arcis` circuits are published in `public-circuits/` and referenced as off-chain circuit sources. Arcium nodes verify them with compile-time `circuit_hash!(...)` values before execution.

The circuit uses fixed-size structs because Arcis circuits need static structure. It avoids `Vec`, `String`, `match`, dynamic loops, and early returns.

## Solana program surface

`programs/private_dao/src/lib.rs` defines:

- DAO and proposal accounts.
- Computation definition initialization for each confidential instruction.
- Queue instructions that build Arcium arguments with `ArgBuilder`.
- Callback handlers that call `verify_output(...)`.
- Public events for encrypted vote receipts and finalized tally publication.

## Privacy benefit

The public chain sees that a voter participated and sees encrypted receipt data, but it does not see the voter's choice or any interim aggregate. Only the final tally is revealed after the proposal closes. This reduces tactical voting, bribery markets, and social pressure while keeping the final result auditable on Solana.

## Production notes

- The demo site now uses an injected Solana wallet for proposal, vote, and tally signatures. A production frontend should replace the lightweight Phantom integration with a maintained wallet adapter.
- Use `@arcium-hq/client@0.9.7` to fetch the MXE public key, encrypt inputs, derive Arcium PDAs, and wait for finalization. The browser bundle in `site/vendor/arcium-vote.js` contains the vote-encryption subset used by the site.
- Use unique nonces for every encrypted input.
- Initialize computation definitions once per deployment.
- Add membership and nullifier checks before production use. The devnet demo focuses on private tallying and does not enforce one-vote-per-wallet.
- Reclaim rent from finalized computation accounts when appropriate.
- Keep callback payloads under Solana transaction limits. Split large proposals or use compact packed state if needed.
