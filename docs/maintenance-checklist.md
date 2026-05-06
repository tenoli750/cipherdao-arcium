# Maintenance checklist

Use this checklist before handing off a CipherDAO Arcium demo build.

## Local smoke test

- Install JavaScript dependencies with `npm install`.
- Run the site/dev tooling described in `README.md`.
- Keep `.env.example` in sync with any new runtime variables.
- Confirm `app/privateDaoClient.ts` and `app/siteApi.ts` still agree on the
  proposal and ballot data shape.

## Arcium-specific checks

- Keep `Arcium.toml`, `Anchor.toml`, and `Cargo.toml` changes reviewed
  together.
- When an encrypted instruction changes, update the matching circuit in
  `public-circuits/` and the integration notes in `docs/`.
- Run the devnet runbook after touching Solana or Arcium configuration.

## Release notes

- Mention whether a change affects only the static demo, the Anchor program,
  or encrypted instruction flow.
- Record any required wallet, devnet, or environment reset steps.
