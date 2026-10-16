# Marquee ↔ kit divergence log

A running list of places where `charlesberret.net` and shellside describe
the same machinery differently. Kit conventions defer to the marquee —
the site is product truth; the kit extracts *its* vocabulary.

| Surface | Divergence | Resolution | Status |
|---|---|---|---|
| VFS node types | kit used `t:"chr"`/`read` + `bin.href`; marquee uses `t:"c"`/`gen` + `bin.url` | kit conforms to marquee | **fixed** 2026-10-15 (`console-vfs`) |
| `VfsLink` fields | marquee link items carry `editLabel`/`editDesc` data-edit paths | added to `VfsLink` | **fixed** 2026-10-15 |
| `file()` shape | marquee emits `html`/`links`/`compactLinks` always (defaults), kit spread opts (keys absent) | kit emits identical defaults; added `link()` shortcut | **fixed** 2026-10-15 |
| `chr`/`gen` vs JSON | the kit's `/console` embeds the VFS as JSON; `gen` functions can't serialize | sites embedding the tree rehydrate chr nodes client-side; marquee builds the VFS in-page | documented (node docstring) |
| Collections | reference app loads `work`/`writing`/`records`/`profile`/`pageCopy`; marquee also has `reading` (per-entry md), `cv.yaml`, `resume.yaml` — pages `/reading/[id]`, `/about/cv`, `/about/resume` | extend the reference app or document site-own coverage | **open — LAB-1416** |
| Console engine | kit extracts *projection only* (`console-vfs`); marquee's parse/runner/pipeline/commands/lore stay site | `@shellside/console-engine` extracts mechanics; personality commands stay site | **done** 2026-10-16 (LAB-1464) |
| Edit-path grammar | 98 probe paths across marquee source all parse via `@shellside/edit-protocol` | none needed | verified 2026-10-15 |
| Role map | live-edit client map pinned to `@shellside/look` via `check-live-edit-map` (62 probes) | pin test | verified 2026-10-15 |
| Schemas | marquee `schemas.mjs` (strict, zod) vs reference `.passthrough()` entry schema | deliberate: kit tolerates marquee fields rather than claiming them | by design |
| `adminPreview` in `is:inline` scripts | module call sites use `ADMIN_PREVIEW_PARAM`; `is:inline` scripts keep the literal | no imports inside `is:inline` — document, not drift | by design |
