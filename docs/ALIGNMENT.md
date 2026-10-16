# Alignment plan — shellside ↔ charlesberret.net

**Date:** 2026-10-16 · **Drivers:** marquee handoff `handoff-charlesberretnet-shellside-roadmap-alignment.md`; patron ask: the marquee ends as an *instance* of shellside — content + config + taste, with the framework carrying the machinery.

## End state

`charlesberret.net` reduces to: `src/content/` collections, a site config (routes, nav, theme roots), taste (styles, components, console lore, lattice/contact visuals), and `deploy.yml`. Everything else — collection loading, visibility filtering, dual-surface routing, console VFS + engine, dev desk, plaintext, leak audit — comes from `@shellside/*`.

## Phases

| Phase | What | Where | Issues |
|---|---|---|---|
| **A — contract completion** | finish extracting the machinery the site still implements inline | kit | LAB-1415 (preview-bridge), LAB-1464 (console-engine), LAB-1463 (reference collections: reading/cv/resume) |
| **B — site delegation** | marquee consumes the finished contracts; `console.astro` mounts `console-vfs` + engine; live-edit uses the typed bridge; adapters stay thin | marquee | requested via reply memo (see §Asks-answered) |
| **C — site-instance contract** | design spike → `site.config.ts` shape (collections map, routes, nav, theme roots) + `@shellside/site` host; reference app becomes config-driven | kit | LAB-1465 done — ADR `docs/decisions/2026-10-16-site-instance-contract.md`; LAB-1466 (host) |
| **D — inversion** | marquee builds on the host; `create-site` scaffold makes a second site | both | `create-site` landed 2026-10-16 (LAB-1467); marquee adoption = R2 window |

## Sequencing calls

- **LAB-1415 (bridge protocol) extracts now**, ahead of the marquee's live-edit backlog (LAB-596/597/648/649/600). Those fixes are implementation internals (validator, look-paint), not bridge-surface changes; the protocol is names+payloads and cheap to iterate. Marquee fixes land via sync; LAB-1454 is the formal handshake. Extracting after the backlog would serialize both lanes.
- **Vendor manifest is a contract** — shape `{shellside, packages:{name:{version,dist:sha256}}}` is stable for LAB-1461's runner-side verification. Change protocol: bump with a docs note in RELEASING.md before reshaping.
- **LAB-1459 timing:** immediately after the patron tranche lands (LAB-1455 gate), not batched into Phase 2 — the kit should prove the export continuously, not at milestone boundaries.
- **R1 "deleted duplicates" row: met.** `field-styles.ts`/`content-edit.ts` remaining LOC are site adapters (CSS maps, allowlist, layout) — that's the contract, not a duplicate.
- **In-flight marquee diff:** `project-mentions.ts` is the only contract-adjacent piece — a pure `mentionsInText(text, ids)` transform would be promote-worthy later; let it bake, revisit at the Phase-2 sync. Lattice/SubdivisionField = taste.
- **console-vfs delegation is ready now.** `console.astro` can adopt `projectCollections`/`dir`/`file` for collection-backed trees while keeping lore trees site-local. The kit already speaks the marquee's node vocabulary (`t:"c"`/`gen`, `bin.url`, `editLabel`/`editDesc` on links — `f76c289`).

## Kit-side issues

- LAB-1415 · preview-bridge protocol — extract now (see above)
- LAB-1463 · reference covers reading/cv/resume
- LAB-1464 · `@shellside/console-engine`
- LAB-1465 · site-instance design spike → ADR (`site.config.ts` + host boundary)
- LAB-1466 · `@shellside/site` host — config-driven dual-surface host (blocked by LAB-1465, LAB-1464)
- ~~LAB-1467~~ create-site scaffold — done 2026-10-16 (`bd273ee`)

## Marquee-side issues (requested in reply memo)

1. `console.astro` delegates collection trees to `@shellside/console-vfs` (now) and commands to `@shellside/console-engine` (after LAB-1464)
2. Adopt typed bridge constants when LAB-1415 lands
3. LAB-1454 handshake — keep as Phase-2 closeout; run LAB-1459 right after the tranche
4. LAB-1461 with the manifest shape above (confirmed stable)
5. Phase-4 prep: collect the site-config surface (nav, per-page meta from LAB-1453, theme roots) as input to the kit's design spike
