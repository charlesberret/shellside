# Shellside threads

Full plan: [docs/ROADMAP.md](./docs/ROADMAP.md). Prefer small promotions that marquee can absorb.

## Open (Phase 0 → R0)

- [ ] **edit-protocol parity** with marquee `content-edit.ts` parse; marquee imports package, deletes local parse
- [ ] **look pure parity** (`pathToLookRole`, roles, weights); marquee thin-wraps `@shellside/look`
- [ ] Extract look-history fs implementation behind a `contentRoot` option
- [ ] DEV API factory (`createDevContentHandler`) — Phase 1
- [ ] Minimal Astro reference app (visibility demo page) — Phase 2 gate for R1
- [ ] `@shellside/console-vfs` (or equiv.) — VFS projection, no personality
- [ ] Wire CI for `npm run check`
- [ ] Optional R2: file: dep → npm workspace / published private package

## Done

- [x] Scaffold monorepo, packages, architecture + visibility docs
- [x] Private GitHub: https://github.com/charlesberret/shellside
- [x] Marquee uses `@shellside/content-model` + visibility filters on public surfaces
- [x] Roadmap + feature set (`docs/ROADMAP.md`)
