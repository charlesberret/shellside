# Extraction map (marquee → shellside)

Marquee: `~/cloud/git-projects/charlesberret.net`

## Promote soon (high reuse, low taste coupling)

| Marquee path | Shellside target | Notes |
|--------------|------------------|-------|
| `src/content/schemas.mjs` (visibility parts) | `packages/content-model` | Keep site-specific enums in site |
| visibility filters (to add) | `packages/content-model` | `isPublicItem`, `listForContext` |
| `src/lib/look-roles.ts` | `packages/look` | Pure map is in the package. Marquee still thin-wraps — [MARQUEE_SWITCH.md](./MARQUEE_SWITCH.md) |
| `src/lib/look-history.ts` | `packages/look` (`@shellside/look/fs`) | `createLookHistory({ contentRoot, historyDir, retainDays })`; marquee adapter in MARQUEE_SWITCH.md |
| path parse in `content-edit.ts` | `packages/edit-protocol` | Pure parse, kinds, allowlist, file builder. Marquee still deletes the local parse |
| Look weight/size/font option lists | `packages/look` | `WEIGHT_*`, `SIZE_*`, `FONT_*` slot names (not typefaces) |

## Promote later (works, needs adapters)

| Marquee path | Adapter needed |
|--------------|----------------|
| `src/lib/field-styles.ts` | content root path, token maps |
| `src/lib/design-tokens.ts` | paths, palette presets |
| `src/pages/api/dev-content.ts` | host policy, fs root |
| `src/scripts/live-edit.js` | mount host, admin bridge |
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
