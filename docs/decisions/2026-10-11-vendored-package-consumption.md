# ADR 2026-10-11: Marquee consumes shellside via vendored builds

## Context

The marquee (charlesberret.net) deploys from a self-hosted runner that checks
out only the marquee repo. A `file:../shellside` dependency cannot resolve
there (marquee commit `0ef4785` removed it for exactly this reason), and the
kit is not published to any registry. Meanwhile every promoted contract
(content-model, edit-protocol, look, dev-api) needs a working consumer for
proof A to be real.

## Decision

Ship built package output into the marquee under `vendor/shellside/<pkg>`,
referenced as `file:vendor/shellside/<pkg>` and committed (vendored `dist/` is
un-ignored on purpose). `scripts/sync-marquee-vendor.mjs` copies
`package.json` + `dist`, rewrites intra-kit deps to `file:../<pkg>`, and
stamps `vendor/shellside/manifest.json` with the shellside SHA and per-package
dist hashes. The marquee's `scripts/check-vendor.mjs` fails when a sibling
checkout's built dist differs.

## Options set aside

- **file:../shellside workspace dep** — cannot resolve on the runner.
- **Deploy-key second checkout in CI** — needs a secret on the runner.
- **Private registry / GitHub Packages** — needs an auth token plus a publish
  step; deferred to R2 (ROADMAP lists it there).

## Consequences

- Deploy consumes vendored code exactly as committed — no private-path
  resolution at deploy time.
- Re-sync is manual: a shellside package change does not reach the marquee
  until someone runs the sync script; `check-vendor` surfaces staleness
  locally but cannot on the runner.
- Vendored code carries no history; diffs between syncs are whole-file.

## Revisit when

R2's packaging question returns (public npm or private registry), or drift
noise makes manual sync painful.
