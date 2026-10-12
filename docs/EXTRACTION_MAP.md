# Extraction map (marquee → shellside)

Marquee: `~/cloud/git-projects/charlesberret.net`

## Promote soon (high reuse, low taste coupling)

| Marquee path | Shellside target | Notes |
|--------------|------------------|-------|
| `src/content/schemas.mjs` (visibility parts) | `packages/content-model` | Keep site-specific enums in site |
| visibility filters (to add) | `packages/content-model` | `isPublicItem`, `listForContext` |
| `src/lib/look-roles.ts` | `packages/look` | **Done 2026-10-11** — package owns ids + path map; marquee keeps labels/hints/selectors |
| `src/lib/look-history.ts` | `packages/look` (`@shellside/look/fs`) | **Done 2026-10-11** — `createLookHistory`; marquee is a 2-line adapter |
| `src/lib/content-edit.ts` | `packages/dev-api` (`createContentEditor`) + `packages/edit-protocol` | **Done 2026-10-11** — machinery in dev-api; marquee file is layout/allowlist/joins/draft config |
| `src/lib/public-content.ts` | `packages/content-model` | **Done 2026-10-11** — filters re-exported; site keeps Astro context helpers |
| `src/pages/api/dev-content.ts` | `packages/dev-api` (`createDevContentHandler`) | **Done 2026-10-11** — gates + content actions in kit; look surface injected |
| Look weight/size/font option lists | `packages/look` | `WEIGHT_*`, `SIZE_*`, `FONT_*` slot names (not typefaces) |

## Promote later (works, needs adapters)

| Marquee path | Adapter needed |
|--------------|----------------|
| `src/lib/field-styles.ts` | content root path, token maps |
| `src/lib/design-tokens.ts` | paths, palette presets |
| `src/scripts/live-edit.js` | mount host, admin bridge; also duplicates `pathToLookRole` client-side (keep in sync with `@shellside/look`; `coauthors` is a kit extra) |
| `src/scripts/admin-*.js` | site nav, preview origins |
| console edit surfaces | VFS schema per site |

## Stay site-local forever (probably)

- Console personality, easter eggs, monome/lattice  
- Portfolio CSS, palettes, type stacks  
- Deploy runner, domain, contact form backend  
- Page copy, CV/resume generation  
- Enigma archive, reading rights  

## Promotion checklist

1. No hard-coded project titles or charlesberret paths in the package  
2. Unit tests for pure functions  
3. Marquee imports package and deletes local duplicate  
4. Docs updated in both repos  
5. `npm run check` green on shellside; marquee build green  

## Periodic review prompt

> What would it take for Shellside to be noticed, appreciated, and used — without sidelining the portfolio?

Capture answers in `docs/PRODUCT_NOTES.md` when they arise.

## Roadmap

Phased promote order, release bars (R0/R1/R2), content portability (marquee content → kit prod build), and marquee sync protocol: **[ROADMAP.md](./ROADMAP.md)** (§2.1).
