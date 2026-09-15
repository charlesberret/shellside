# Shellside threads

Full plan: [docs/ROADMAP.md](./docs/ROADMAP.md). Prefer small promotions that marquee can absorb.

## Open (Phase 0 → R0)

**Proof A — contracts**

- [ ] **edit-protocol parity** with marquee `content-edit.ts` parse; marquee imports package, deletes local parse
- [ ] **look pure parity** (`pathToLookRole`, roles, weights); marquee thin-wraps `@shellside/look`
- [ ] Wire CI for `npm run check`

**Proof B — content portability (R0 gate)**

- [ ] Minimal Astro reference host (portfolio list over content collections)
- [ ] `scripts/export-marquee-content` + redaction list (`MARQUEE_ROOT` / sibling path)
- [ ] Committed toy fixture (draft + published) for CI without marquee
- [ ] Reference **prod** build + basic leak audit on fixture and on marquee export

**Phase 1 (may trail R0 declaration)**

- [ ] Extract look-history fs behind a `contentRoot` option
- [ ] DEV API factory (`createDevContentHandler`)

## Open (R1)

- [ ] `@shellside/console-vfs` (or equiv.) — VFS projection, no personality
- [ ] Reference: portfolio + console over marquee public export; leak audit green
- [ ] Optional R2: file: dep → npm workspace / published private package

## Marquee sync (§6)

- [ ] **Skin isolation test** — unit test for `crossSkinStyle()` (color + case only); wire when `look` gets a test runner
- [ ] **Dirty-guard contract** — when live-edit is extracted, `snapshotCleanState(saved)` must take persisted values; `closePanel({ force })` after destructive actions. Marquee `86344e1`.

## Done

- [x] Skin isolation invariant recorded (`CROSS_SKIN_STYLE_KEYS`, docs/LIVE_EDIT.md) — marquee `c3a96b2`
- [x] Scaffold monorepo, packages, architecture + visibility docs
- [x] Private GitHub: https://github.com/charlesberret/shellside
- [x] Marquee uses `@shellside/content-model` + visibility filters on public surfaces
- [x] Roadmap + feature set (`docs/ROADMAP.md`)
- [x] R0/R1 include content portability (marquee content → kit prod build, structural fidelity)
