# Shellside threads

Full plan: [docs/ROADMAP.md](./docs/ROADMAP.md). Prefer small promotions that marquee can absorb.

## Open (Phase 0 → R0)

**Proof A — marquee switch done** (2026-10-11; vendored packages, see [docs/MARQUEE_SWITCH.md](./docs/MARQUEE_SWITCH.md))

- [x] Marquee imports `@shellside/edit-protocol` and deleted local `parseContentPath`
- [x] Marquee thin-wraps `@shellside/look` (kept role metadata: labels/hints/selectors)
- [x] Marquee adopts `@shellside/content-model`, `@shellside/look/fs`, `@shellside/dev-api` — check:admin 32/32 green

**Phase 1 (may trail R0 declaration)**

- [x] Marquee adopts `createLookHistory` — `src/lib/look-history.ts` is a thin adapter (2026-10-11)
- [x] DEV API factory (`createDevContentHandler` + `createContentEditor`) — dev-content.ts thin; look surface injected (2026-10-11)
- [x] Field-styles map I/O — `createFieldStyles` at `@shellside/look/fs` (2026-10-12). marquee adopted 2026-10-15 (`781b8f5`, LAB-1287); the file is now thin (CSS maps + options)

## Open (R1 done → R2)

- [x] `@shellside/site` host (LAB-1466), demo on GitHub Pages, create-site scaffold (LAB-1467)
- [x] Filesystem-IA (LAB-1511): `projectSiteTree`, demo + scaffold consume it; dotfiles console-only
- [ ] Default skin sign-off — built + deployed (LAB-1517); the look needs patron eyes
- [ ] Optional R2: tarball vendor → published packages (waits on LAB-113 name ruling)

## Marquee sync (§6)

- [ ] **Vendored drift** — `vendor/shellside` in the marquee needs re-sync (`npm run vendor:sync` … actually `node scripts/sync-marquee-vendor.mjs`) after any shellside package change; `scripts/check-vendor.mjs` fails the build check when a sibling checkout sees staleness
- [ ] **Dirty-guard contract** — when live-edit is extracted, `snapshotCleanState(saved)` must take persisted values; `closePanel({ force })` after destructive actions. Marquee `86344e1`.

## Done

- [x] **look-history fs factory** — `createLookHistory({ contentRoot, historyDir, retainDays })` at `@shellside/look/fs`, ported from marquee `src/lib/look-history.ts`; temp-dir tests (2026-10-11)
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
- [x] Kit `@shellside/content-model` owns visibility filters; marquee re-exports them from `src/lib/public-content.ts` and keeps the Astro context helpers. Consumption is vendored builds (`vendor/shellside`), not `file:../shellside` (2026-10-11)
- [x] Roadmap + feature set (`docs/ROADMAP.md`)
- [x] R0/R1 include content portability (marquee content → kit prod build, structural fidelity)
