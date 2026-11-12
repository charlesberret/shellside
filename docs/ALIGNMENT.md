# Alignment plan — shellside ↔ charlesberret.net

**Date:** 2026-10-16 · **Drivers:** a marquee handoff memo (roadmap alignment); patron ask: the marquee ends as an *instance* of shellside — content + config + taste, with the framework carrying the machinery.

## End state

`charlesberret.net` reduces to: `src/content/` collections, a site config (routes, nav, theme roots), taste (styles, components, console lore, lattice/contact visuals), and `deploy.yml`. Everything else — collection loading, visibility filtering, dual-surface routing, console VFS + engine, dev desk, plaintext, leak audit — comes from `@shellside/*`.

## Phases

| Phase | What | Where | Work items |
|---|---|---|---|
| **A — contract completion** | finish extracting the machinery the site still implements inline | kit | preview-bridge protocol, console-engine, reference collections (reading/cv/resume) |
| **B — site delegation** | marquee consumes the finished contracts; `console.astro` mounts `console-vfs` + engine; live-edit uses the typed bridge; adapters stay thin | marquee | requested via reply memo (see §Asks-answered) |
| **C — site-instance contract** | design spike → `site.config.ts` shape (collections map, routes, nav, theme roots) + `@shellside/site` host; reference app becomes config-driven | kit | design spike done — ADR `docs/decisions/2026-10-16-site-instance-contract.md`; the `@shellside/site` host |
| **D — inversion** | marquee builds on the host; `create-site` scaffold makes a second site | both | `create-site` landed 2026-10-16; marquee adoption = R2 window |

## Sequencing calls

- **The bridge protocol extracts now**, ahead of the marquee's live-edit backlog. Those fixes are implementation internals (validator, look-paint), not bridge-surface changes; the protocol is names+payloads and cheap to iterate. Marquee fixes land via sync; a typed-bridge handshake issue is the formal handshake. Extracting after the backlog would serialize both lanes.
- **Vendor manifest is a contract** — shape `{shellside, packages:{name:{version,dist:sha256}}}` is stable for the deploy runner's verification. Change protocol: bump with a docs note in RELEASING.md before reshaping.
- **Export-proof timing:** immediately after the patron tranche lands, not batched into Phase 2 — the kit should prove the export continuously, not at milestone boundaries.
- **R1 "deleted duplicates" row: met.** `field-styles.ts`/`content-edit.ts` remaining LOC are site adapters (CSS maps, allowlist, layout) — that's the contract, not a duplicate.
- **In-flight marquee diff:** `project-mentions.ts` is the only contract-adjacent piece — a pure `mentionsInText(text, ids)` transform would be promote-worthy later; let it bake, revisit at the Phase-2 sync. Lattice/SubdivisionField = taste.
- **console-vfs delegation is ready now.** `console.astro` can adopt `projectCollections`/`dir`/`file` for collection-backed trees while keeping lore trees site-local. The kit already speaks the marquee's node vocabulary (`t:"c"`/`gen`, `bin.url`, `editLabel`/`editDesc` on links — `f76c289`).

## Kit-side work

- preview-bridge protocol — extract now (see above)
- reference covers reading/cv/resume
- `@shellside/console-engine`
- site-instance design spike → ADR (`site.config.ts` + host boundary)
- `@shellside/site` host — config-driven dual-surface host (blocked by the spike + engine)
- ~~create-site scaffold~~ — done 2026-10-16 (`bd273ee`)

## Marquee-side work (requested in reply memo)

1. `console.astro` delegates collection trees to `@shellside/console-vfs` (now) and commands to `@shellside/console-engine` (after the engine contract lands)
2. Adopt typed bridge constants when the bridge protocol lands
3. Bridge handshake — keep as Phase-2 closeout; run the export proof right after the tranche
4. Deploy-runner manifest verification (shape above, confirmed stable)
5. Phase-4 prep: collect the site-config surface (nav, per-page meta, theme roots) as input to the kit's design spike

## IA mapping (2026-10-18)

Memo delivered at `charlesberret.net/handoff-shellside-charlesberretnet-ia-mapping.md`:
per-collection fate under filesystem-IA (dirs→sections, yaml lists→sections,
`.site` for singletons, `.meta` for ordering), plus four open questions the
marquee seat decides (singleton fold, intra-section ordering, lore stays
site-side, route aliases vs dir renames).
