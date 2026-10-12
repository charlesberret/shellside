---
project: shellside
kind: software
phase: active
canonical: ~/cloud/git-projects/shellside
deps: npm
test_cmd: npm ci && npm run check
test_signal: green — 102 package tests (content-model 10, edit-protocol 11, look 67, dev-api 14), 3 script tests, toy reference build, leak audit ok
healthbeacon: none
---

## Status

Private framework kit for dual-surface portfolio sites; charlesberret.net is the
first consumer. **R0 declared 2026-10-11** — both proofs hold. A: the marquee
imports all four packages as vendored builds (`vendor/shellside`, synced by
`scripts/sync-marquee-vendor.mjs`); content-edit, dev-content, look-history,
and public-content are thin adapters, and check:admin is 32/32 green. B: a
local `npm run export` builds 103 public pages (10 work, 42 writing,
51 records) with the leak audit green. Boards: `THREADS.md`,
`docs/ROADMAP.md` §8.

## Next action

- [x] Field-styles map I/O — `createFieldStyles` in `@shellside/look/fs` (2026-10-12). The marquee file still owns CSS
- [ ] Re-sync vendored packages after shellside package changes (`node scripts/sync-marquee-vendor.mjs`); marquee `check-vendor` flags staleness
- [ ] R1: `@shellside/console-vfs` — VFS projection over the same collections

## Known gaps

- The marquee export path is checked locally only; CI runs the toy fixture, which covers both loader shapes (YAML list and per-entry Markdown).
- Writing and records detail pages render no body for YAML rows (they have none); only summary shows.
- Vendored packages are re-synced by hand; nothing pushes marquee-side (deliberate). Look now depends on `js-yaml`, so the next vendor sync changes the marquee lockfile.
- Kit `LEADING_OPTIONS` / `CASE_OPTIONS` are shorter than the on-disk field-styles names (`tight`…`airy`, `uppercase` / `lowercase` / `capitalize`). The loader accepts the file vocabulary. `upper` and `lower` are stored in the long form.
- Linear project Shellside is P-LAB-17. No open `mode:agent` issue (2026-10-12). LAB-113 (npm + PyPI name) is `mode:human` / `motion:park`. `THREADS.md` is the working checklist.
