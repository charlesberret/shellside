# R1 retrospective — second-site release + full content portability

**Date:** 2026-10-18 · **Scope:** the R1 milestone (edit protocol, content-model, look, dev-api, preview-bridge, reference collections, site-instance contract; the README-path ruling still open inside it) plus the post-milestone IA arc that landed in the same week (console-engine, the host, create-site, filesystem-IA). Written as the R1 close-out.

## What held

- **Contracts over copies held under pressure.** The one real divergence (console-vfs node vocabulary) was caught, logged in `DIVERGENCES.md`, and fixed by conforming the kit to the marquee (`f76c289`) rather than forking. Edit-protocol parity was *proved* — 98 probe paths, 62-probe role-map pin — not asserted.
- **The host arc ran to plan in days.** Site-instance ADR (10-16) → `@shellside/site` (`84c6ae0`) → create-site (`bd273ee`) → demo on Pages (`a2c00b2`) → filesystem-IA (`ab342dd`). R1's bar — dual-surface reference app on packages only, leak audit green — was met and then exceeded (packaged engine console, `llms.txt`, plaintext bundles).
- **Content portability is real.** Marquee export renders the full public graph (~119 pages); both loader shapes covered; leak audit runs as a library function sites inherit via scaffold.
- **Breaking-change discipline.** The 0.x vocabulary break was recorded in the CHANGELOG as breaking, not buried. Releases are being cut (`0.3.0`, `0.4.0`) with per-release notes.
- **The kit outgrew its source.** IA, engine mechanics, and the host all landed without touching the marquee — the framework is now leading design and the marquee adopts by memo (the per-collection IA mapping). That is the Phase-D inversion arriving early, through IA rather than config adoption.

## What dragged

- **Vendoring is the toll booth.** Every kit-side package change creates marquee-side toil (`sync-marquee-vendor.mjs` by hand; `check-vendor` fails builds on staleness; `js-yaml` dep changes the marquee lockfile on next sync). Right call for R1; it does not scale to R2's "installable without path hacks."
- **Divergence bookkeeping is reactive.** The `DIVERGENCES.md` table exists because drift was *discovered* after shipping (`chr`/`read` → `c`/`gen`), not prevented. Cost: one breaking change inside 0.x that the marquee had to absorb.
- **Contracts outran their own substrate.** The site-instance ADR (10-16) declared a `collections:` map in config; the filesystem-IA ADR (10-17) made the tree the collection map one day later. The earlier ADR's config sketch is partially superseded and still reads as current — an amendment note is owed.
- **Test/feature race reached CI once** (`706a1d3`): the injected-route test listed a surface the feature hadn't merged. Cheap fix, real signal — route-surface assertions should land with or behind the feature.
- **Milestone bookkeeping.** R1 shows 100% while the README-path ruling (a patron gate about a local path in the public README) sits open inside it. The milestone closed *around* the gate, not through it.

## Does the marquee adoption path still fit?

Mostly, with one reframe. `ALIGNMENT.md` Phase D assumed the marquee maps typed collections into `site.config.collections`. Post-IA the question is sharper: does the marquee's content tree *become* the config, or do typed collections stay behind an adapter? The IA-mapping memo delivered the per-collection mapping and named four questions the marquee seat owns (singleton fold, intra-section ordering, lore boundary, route aliases). Phase D is now blocked on that acknowledgement, not on kit machinery.

## What changes R2's shape

1. **devDesk is the last unfinished surface** — `surfaces.devDesk` is marked planned; the `edit.*` contract and the DEV-only route are the remaining engineering on the board.
2. **Publish is ready, gated, and cheap.** Metadata + dry-run done; the registry credentials are the only remaining step. R2's packaging risk is now zero technical, all credential.
3. **Second-site proof is still unproven.** create-site scaffolds a filesystem-IA site, but no second real site has run it. The demo stands in; a deliberate second instance (or the marquee itself adopting IA) is the real R2 exit evidence.
4. **R2's tail is patron-gated**: skin sign-off, the README path ruling, and the npm claim. All three wait on one queue.
5. **Amend the 10-16 ADR** so the `collections:` sketch reads as pre-IA — cheap hygiene, prevents the next sitting from implementing the superseded shape.
