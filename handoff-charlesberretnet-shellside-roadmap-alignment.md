# Handoff — charlesberret.net (marquee) → shellside: roadmap alignment

**Date:** 2026-10-16
**From:** marquee seat (charlesberret.net tree)
**To:** shellside agent
**Ask:** read this, then return a plan for aligning the two project roadmaps. Linear anchors are cited throughout — the marquee board is `charlesberret.net` (P-LAB-19), yours is Shellside (P-LAB-17).

---

## 1. What the site is (settled, not open)

- Live Astro portfolio at charlesberret.net, deployed by a self-hosted GitHub Actions runner (release dir + symlink swap — `.github/workflows/deploy.yml`).
- **Two canonical interfaces** reading one set of content collections under `src/content/` (`profile.yaml`, `work/*.md`, `writing.yaml`, `records.yaml`, plus `cv.yaml`, `resume.yaml`, `page-copy.yaml`, `design-tokens.yaml`): the standard **portfolio** and the terminal-style **console**. Both permanent; never propose collapsing.
- Palette locked to blue-violet (`src/styles/palettes.css`); production ground is `#080e1a` (LAB-601 closed keep-D 2026-10-12).
- **No agent edits to `src/content/*` or in-page prose** without an explicit patron ask — that boundary applies to anything flowing back into this tree from shellside work too.
- `archive/enigma/` is source material only, never live-site content.

## 2. Codebase state today

### Shellside consumption (the thin-adapter map)

Vendored builds under `vendor/shellside/` (`manifest.json` stamped at shellside `6f22f0c`; your HEAD `71fa4b1` is docs-only ahead, dists match). Consumed as `file:vendor/shellside/<pkg>` — deliberate, the runner can't resolve `file:../shellside` (`docs/ROADMAP.md` §6.5).

| Site file | LOC | Relationship to kit |
|---|---|---|
| `src/lib/public-content.ts` | 110 | thin adapter over `@shellside/content-model` |
| `src/lib/look-roles.ts` | 307 | thin adapter over `@shellside/look` (keeps labels/hints/selectors — taste) |
| `src/lib/look-history.ts` | 17 | thin adapter over `@shellside/look/fs` |
| `src/lib/field-styles.ts` | 341 | delegates map I/O to `createFieldStyles`; still owns CSS/token maps |
| `src/lib/design-tokens.ts` | 277 | delegates file I/O to `@shellside/look/fs` (`createDesignTokens`/`createPalettePresets`, adopted 2026-10-15, `def5594`) |
| `src/lib/content-edit.ts` | 338 | thin over `@shellside/edit-protocol` + `dev-api`; keeps allowlist/joins/layout |
| `src/pages/api/dev-content.ts` | — | endpoint using `createDevContentHandler` + `createContentEditor` |
| admin-preview flag | — | shared constant from `@shellside/edit-protocol` (25ee9b2) |

**Still site-local** (per `EXTRACTION_MAP.md`): `src/scripts/live-edit.js` (~3.5k), admin shell/`admin-app.js`, `console.astro` (~6k), lattice/contact visuals, deploy, Enigma, taste.

### Check / deploy gate (what runs where)

`npm run check:content` = `check-vendor` → `check-live-edit-map` → `check-content`, then `astro build`, then `postbuild` = `check-public-output` + `check-portfolio`. GHA deploy runs `check:content` + `build` + a live smoke — **so `check-vendor` executes on the runner but exits 0 with "trusting vendored copy"** (no sibling checkout there). `check:portfolio:browser` exists but is local-only and has no recorded full run since 2026-08-26. Console checks are a `check:console:*` family; `check:admin` is 32/32.

### The working tree is dirty — two in-flight things you should know about

1. **Content tranche (patron-ruled territory):** `profile.yaml` (Capture + Common Measure added to the bio, 2026-10-16), `writing.yaml` Enigma cull (2026-10-14), `records.yaml`, nine `work/*.md`, and `archive/enigma` cut from 20→12 entries with `INDEX.md`/`archive-enigma.sh` changes — all uncommitted. **Your export fixture is about to change shape**: fewer Enigma rows, new profile projects. LAB-1459 (blocked by LAB-1455) tracks re-running `export-marquee-content` + reference build + leak audit once this lands.
2. **In-flight engineering (another sitting):** `src/scripts/live-edit.js` (+13), `src/components/SubdivisionField.astro` (−638, gutted into a switcher), new `src/scripts/lattice/{fireworks,grain-field,ring-field}.ts` (~650 LOC, taste — stays site), new `src/lib/project-mentions.ts` (47 LOC), `src/pages/lab/subdivision.astro`. **Relevant to LAB-1415:** `live-edit.js` is being touched right now — coordinate the preview-bridge protocol extraction against current source, not the last committed snapshot.

### Board snapshot (marquee, P-LAB-19)

- **In Progress:** LAB-596 (token validator accepts invalid hex).
- **Backlog, live-editor lane:** LAB-597 (Look layer paints own literals), LAB-598 (warm accent 4.41:1 contrast), LAB-599 (contact lattice can't follow palette), LAB-600 (typeTalk page-copy key), LAB-648 (A1 empty-state recut), LAB-649 (Phase B/C recovery), LAB-651 (self-host declared fonts or drop).
- **Stale gate:** LAB-396 — premise obsolete per the project description itself; needs revise-or-close.
- **New threads filed 2026-10-16** (detail below): LAB-1447 + LAB-1450–1454, LAB-1448 + LAB-1455–1459, LAB-1449 + LAB-1460–1462.

## 3. What's ahead on the marquee roadmap

Three threads now hold the forward work; each has a shellside seam.

### a) Foundations Phase 2 — Shell/Portfolio contract (LAB-1447, milestone "Foundations Phase 2")

Opt-in widgets (LAB-1450), live-edit CSS split (LAB-1451), body skin class + single CRT import (LAB-1452), per-page meta (LAB-1453), and **LAB-1454 — the sync-protocol closeout**: re-export + reference build + leak audit + promote candidates, per your ROADMAP §6.2. Phase 2 touches the extraction surface (chrome mounting, skin boundaries); anything that turns out to be a stable contract promotes upstream rather than forking site-local (§6.4: marquee stays source of truth for product behavior until the contract updates). After Phase 2 the roadmap continues into Phase 3 (portfolio.css split, class renames, shared breakpoints) and Phase 4 (site config, nav-from-config, portable kit) — Phase 4 is effectively your R1 bar applied to the site itself.

### b) Launch-hardening review closeout (LAB-1448, milestone "Hardening")

Mostly `gate:patron` rulings (Enigma role vocabulary LAB-1456, featured five LAB-1457, Gov Archive author split LAB-1458, tranche reconciliation LAB-1455). Your touchpoint is **LAB-1459**: after the tranche lands, the public content set changes → re-export + reference prod build + leak audit, fixing kit or redaction rather than marquee.

### c) Honest deploy gate (LAB-1449, milestone "Hardening")

`check:portfolio:browser` to green (LAB-1460) then into GHA (LAB-1462), and **LAB-1461**: `check-vendor` gains a manifest-vs-vendored-dist verification that works with no shellside checkout — this hardens your §6.5 vendoring model on the runner. The manifest format is currently `{shellside: <sha>, packages: {<pkg>: {version, dist: <sha256 tree hash>}}}`; LAB-1461 reads it as the verification contract — flag now if you plan to change it. Also noted: `look` now depends on `js-yaml`, so the next real vendor sync refreshes the marquee lockfile (your `_Status.md` known gap — confirmed).

### d) The lane where our roadmaps can collide

Your next action is **LAB-1415 — extract the typed preview-bridge protocol (live-edit event names/payloads)**. The marquee's live-editor lane is simultaneously the most active engineering surface here (LAB-596/597/648/649/600 plus the in-flight `live-edit.js` edit). If you extract the protocol from a snapshot while marquee fixes keep landing, we get exactly the "two competing parsers" outcome §6.4 forbids. Suggestion: treat the marquee's live-edit leftovers as *input* to LAB-1415 (they're where the event contract actually proves out), and let LAB-1454 be the formal handshake point.

## 4. Asks — what the alignment plan should answer

1. Sequence LAB-1415 against the marquee live-edit backlog (LAB-596/597/648/649/600): extract now and absorb fixes via sync protocol, or let the backlog land first? Your call, but say which and why.
2. Confirm the `vendor/shellside/manifest.json` shape is stable enough for LAB-1461 to treat as a contract — or name the change you want first.
3. Time the LAB-1459 re-export: immediately after the tranche commit (LAB-1455), or batched with the Phase 2 content-shape changes later?
4. Tell me whether anything in the in-flight marquee diff (§2 — `project-mentions.ts`, gutted `SubdivisionField`, new lattice modules) reads as contract-worthy to you. My read: all taste/site-local per `EXTRACTION_MAP.md`, but you own that map.
5. Flag any R1 checklist row ("marquee has deleted local duplicates for promoted code") you believe the marquee hasn't actually met — `field-styles.ts` at 341 LOC and `content-edit.ts` at 338 are the fattest remaining adapters.
6. Say whether the console VFS extraction (`@shellside/console-vfs`, `fadc34c`) is at a point where the marquee's ~6k-line `console.astro` should start delegating, or whether that's still reference-only.

## 5. Pointers

- Marquee orientation: `CLAUDE.md`, `_Status.md`, `.kettle/PROJECT.md`, `docs/PORTFOLIO_FOUNDATIONS_ROADMAP.md`, `docs/LIVE_EDITOR_ROADMAP.md`, `docs/CONSOLE_SHELL_ROADMAP.md`, `docs/MARQUEE_SWITCH.md` (yours).
- The grill that surfaced most of this: `.local/grill/2026-10-11.md`.
- Sync contract being invoked throughout: `shellside/docs/ROADMAP.md` §6 (esp. 6.2 cadence, 6.4 conflict rule, 6.5 dependency hygiene).
