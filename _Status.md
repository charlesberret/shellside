---
project: shellside
kind: software
phase: active
canonical: ~/cloud/git-projects/shellside
deps: npm
test_cmd: npm ci && npm run check
test_signal: green — 69 package tests, 3 script tests, toy reference build, leak audit ok
healthbeacon: none
---

## Status

Private framework kit for dual-surface portfolio sites; charlesberret.net is the
first consumer. R0 proof B (marquee content → kit prod build) holds: a local
`npm run export` from the marquee builds 103 public pages (10 work, 42 writing,
51 records) and the leak audit passes. Proof A (marquee consumes the packages)
is still open on the marquee side. Detailed boards: `THREADS.md`,
`docs/ROADMAP.md` §8.

## Next action

- [ ] Marquee imports `@shellside/edit-protocol` and deletes local `parseContentPath` (marquee repo; `docs/MARQUEE_SWITCH.md`)
- [ ] Marquee thin-wraps `@shellside/look` and deletes its local role map (marquee repo)
- [ ] Visibility leak checklist re-run on the marquee (marquee repo)
- [ ] Marquee adopts `createLookHistory` (marquee repo; adapter in `docs/MARQUEE_SWITCH.md`)
- [ ] Phase 1: DEV API factory (`createDevContentHandler`)

## Known gaps

- The marquee export path is checked locally only; CI runs the toy fixture, which covers both loader shapes (YAML list and per-entry Markdown).
- Writing and records detail pages render no body for YAML rows (they have none); only summary shows.
- Linear project Shellside is P-LAB-17. No open `mode:agent` issue (2026-10-11). LAB-113 (npm + PyPI name) is `mode:human` / `motion:park`. `THREADS.md` is the working checklist.
