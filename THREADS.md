# Shellside threads

Full plan: [docs/ROADMAP.md](./docs/ROADMAP.md). Prefer small promotions that marquee can absorb.

## Open (Phase 0 → R0)

**Proof A — marquee switch still open** (package parity is in; see [docs/MARQUEE_SWITCH.md](./docs/MARQUEE_SWITCH.md))

- [ ] Marquee imports `@shellside/edit-protocol` and deletes local `parseContentPath`
- [ ] Marquee thin-wraps `@shellside/look` and deletes the local role map

**Phase 1 (may trail R0 declaration)**

- [ ] Extract look-history fs behind a `contentRoot` option
- [ ] DEV API factory (`createDevContentHandler`)

## Open (R1)

- [ ] `@shellside/console-vfs` (or equiv.) — VFS projection, no personality
- [ ] Reference: portfolio + console over marquee public export; leak audit green
- [ ] Optional R2: file: dep → npm workspace / published private package

## Marquee sync (§6)

- [ ] **Dirty-guard contract** — when live-edit is extracted, `snapshotCleanState(saved)` must take persisted values; `closePanel({ force })` after destructive actions. Marquee `86344e1`.

## Done

- [x] **Marquee export renders the full public graph** — reference loads root `<collection>.yaml` lists (marquee shape) or per-entry Markdown (toy); leak audit reads both; toy writing is YAML so CI covers the path. `npm run check` green again on a clean `npm ci` (YAML scalar types, no `sharp`) (2026-10-11)
- [x] **edit-protocol parity** — path grammar, field kinds, allowlist, content-root file builder; tests cover live `data-edit` shapes (2026-10-06 public build)
- [x] **look pure parity** — `pathToLookRole` includes `byline` → item-meta and `page:writing.group*` → section-heading; size/font slot lists; `crossSkinStyle` test
- [x] CI: `.github/workflows/check.yml` runs `npm run check`
- [x] Minimal Astro reference host (portfolio list/detail + `/list.txt`)
- [x] `scripts/export-marquee-content` + `scripts/redaction.mjs`
- [x] Committed toy fixture (`fixtures/toy`, draft + published + legacy `status: draft`)
- [x] Reference prod build + `scripts/check-public-output.mjs` (toy in CI; marquee export when `MARQUEE_ROOT` is present)
- [x] Skin isolation test (`crossSkinStyle`, color + case only)
- [x] Skin isolation invariant recorded (`CROSS_SKIN_STYLE_KEYS`, docs/LIVE_EDIT.md) — marquee `c3a96b2`
- [x] Scaffold monorepo, packages, architecture + visibility docs
- [x] Private GitHub: https://github.com/charlesberret/shellside
- [x] Marquee uses `@shellside/content-model` + visibility filters on public surfaces
- [x] Roadmap + feature set (`docs/ROADMAP.md`)
- [x] R0/R1 include content portability (marquee content → kit prod build, structural fidelity)
