# Shellside

Site framework for dual-surface personal portfolios, content collections, and a **dev-only** editorial desk. A dual-surface portfolio is a readable site plus an optional console.

Shellside is **not** a hosted CMS. It is a **filesystem-first kit**. Content lives as YAML/Markdown. The public site is a static or node Astro build. The admin and live-edit surface exists only in development.

First marquee consumer: [charlesberret.net](https://github.com/charlesberret/charlesberret.net), or the local tree `~/cloud/git-projects/charlesberret.net`.

## Why this exists

- Capture schematics that would otherwise stay as local idiosyncrasies
- Make the dual-surface + look + content-edit stack **portable** to the next site
- Give agents a documented contract so they can contribute without rediscovering the house style
- Periodically ask: *what would it take for people to notice, appreciate, and use this?* Do that without sidelining the portfolio itself

## Packages

| Package | Role |
|---------|------|
| `@shellside/content-model` | Schemas, **visibility** `draft` or `published`, lifecycle vs visibility, public filters |
| `@shellside/look` | Look roles, field-style map shape, weight/size/font tokens, history contract |
| `@shellside/edit-protocol` | `data-edit` path grammar, allowlists, entity parse |
| `@shellside/console-vfs` | VFS node types + collection→tree projection for a second-site console (`ls`/`cat` data only — no personality) |
| `@shellside/dev-api` | DEV-only desk machinery. `createContentEditor` is the fs write core. `createDevContentHandler` covers gates and actions. The site injects the look surface. |
| `@shellside/console-engine` | Terminal mechanics — parse/path/pipeline/runner/io + fs/filter commands. Personality stays in the site. |
| `@shellside/site` | Config-driven host: `shellsite()` Astro integration injects `/console` + `/list.txt`; site keeps chrome. |

## Apps

| App | Role |
|-----|------|
| `apps/reference` | Minimal Astro host. Portfolio list/detail, a read-only `/console` (`ls`/`cat` over the VFS), and `list.txt` plaintext — all over the same collections |

## Design pillars

1. **Content once, many surfaces.** Portfolio page, console VFS, plaintext, and llms.txt all read the same collections
2. **Visibility ≠ lifecycle.** `visibility: draft|published` is orthogonal to work `current|complete` or writing `forthcoming`
3. **Look is role-scoped.** Restyle "item title", not only `work:kettle:title`
4. **Admin is DEV-only.** No production write surface. Drafts never ship if filters are correct
5. **Site owns taste.** Type, palette, and chrome stay in the marquee site. Shellside owns *structure*

## Relationship to charlesberret.net

```
charlesberret.net     shellside
─────────────────     ─────────
Site chrome,          Contracts, filters,
console personality,  path grammar, look
deploy, copy    ──►   roles, docs, kits
                  ◄── extract when stable
```

See [docs/EXTRACTION_MAP.md](./docs/EXTRACTION_MAP.md).

## Status

**R0 declared** 2026-10-11; **R1 in flight** — `@shellside/console-vfs` and a read-only `/console` in the reference app landed 2026-10-15 (104-page marquee export verified, leak audit green). The marquee builds on vendored `@shellside/*` packages in `vendor/shellside`, synced by `scripts/sync-marquee-vendor.mjs`. Details: [docs/MARQUEE_SWITCH.md](./docs/MARQUEE_SWITCH.md).

**Roadmap and feature set.** [docs/ROADMAP.md](./docs/ROADMAP.md) covers the north star, the release bars, phased delivery, and the marquee sync protocol. The release bars run R0, contracts plus a content portability smoke, then R1, dual-surface with a marquee content fixture, then R2, publishable.

## What "renders correctly" means

A production build of the reference host shows the **public** work, writing, and records graph with boring chrome. Drafts stay out of `dist` when `visibility` is `draft`, or when `visibility` is absent and legacy `status` is `draft` or `unpublished`. Redacted private paths stay out of `dist`. It is not a visual twin of charlesberret.net.

## Commands

```bash
npm ci
npm run check          # packages, unit tests, reference prod build, leak audit
npm run export         # copy marquee src/content → fixtures/marquee-content (gitignored)
npm run dev -w @shellside/reference
```

Each of `work`, `writing`, `records`, `profile`, and `page-copy` loads from a root `<name>.yaml` list when present, the marquee shape, else from `<name>/` entry files. The toy keeps records and work that way.

`npm run check` builds the reference app from the committed toy fixture when no export is present. After `npm run export`, the next reference build uses that tree instead. Force the toy with `REFERENCE_CONTENT=fixtures/toy/content`.

Export source: `--source`, else `MARQUEE_ROOT`, else `../charlesberret.net`. Private directories are dropped: `archive`, `enigma`, `private`, `reading-rights`, `secrets`, `.env*`. See `scripts/redaction.mjs`.

## Walkthrough

**From zero to dual-surface** — the committed toy fixture proves the shape with no marquee checkout:

```bash
npm ci && npm run check        # builds packages, tests, reference prod build, leak audit
npm run dev -w @shellside/reference
```

Routes: `/` portfolio, `/projects/<id>`, `/writing/<id>`, `/records/<id>`, `/console` (read-only shell over the VFS), `/list.txt`.

**With marquee content** — the export is the R1 acceptance fixture:

```bash
npm run export                 # ../charlesberret.net or MARQUEE_ROOT=…
npm run build:reference        # 104 public pages + /console; leak audit asserts the public set
```

**For a second site** — copy the marquee's consumption pattern: vendor the packages you use (`scripts/sync-marquee-vendor.mjs` is written for the marquee but the shape transfers), mount the DEV handler only in dev (`createDevContentHandler`), keep your own tokens/chrome. See [docs/ROADMAP.md](./docs/ROADMAP.md) §4 for the contract-level map.

## License

MIT. See [LICENSE](./LICENSE). Not published to npm.
