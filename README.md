# Shellside

A filesystem-first Astro kit for dual-surface personal portfolios: a readable site plus an optional terminal-style console, built from the same content collections, with a **dev-only** editorial desk. It is for people who want a personal site whose content is plain YAML and Markdown files and whose structure is documented enough for an agent to work on safely.

Shellside is **not** a hosted CMS. Content lives as YAML/Markdown. The public site is a static or node Astro build. The admin and live-edit surface exists only in development.

First consumer (the "marquee" site): [charlesberret.net](https://charlesberret.net).

## Why this exists

- Capture schematics that would otherwise stay as local idiosyncrasies
- Make the dual-surface + look + content-edit stack **portable** to the next site
- Give agents a documented contract so they can contribute without rediscovering the conventions
- Keep the portfolio itself first: the kit exists to serve the site, not the other way round

## Live demo

https://charlesberret.github.io/shellside/ — a `@shellside/site` instance whose content is the kit itself (packages as projects, docs as writing, releases as records). Deployed by `.github/workflows/pages.yml` on changes to `apps/demo/` or `packages/`.

## Packages

| Package | Role |
|---------|------|
| `@shellside/content-model` | Schemas, **visibility** `draft` or `published`, lifecycle vs visibility, public filters |
| `@shellside/look` | Look roles, field-style map shape, weight/size/font tokens, history contract |
| `@shellside/edit-protocol` | `data-edit` path grammar, allowlists, entity parse |
| `@shellside/console-vfs` | VFS node types + collection→tree projection for a second-site console (`ls`/`cat` data only — no personality) |
| `@shellside/dev-api` | DEV-only desk machinery. `createContentEditor` is the fs write core. `createDevContentHandler` covers gates and actions. The site injects the look surface. |
| `@shellside/console-engine` | Terminal mechanics — parse/path/pipeline/runner/io + fs/filter commands. Personality stays in the site. |
| `@shellside/site` | Config-driven host: `shellsite()` Astro integration injects `/console` + `/list.txt`; site keeps chrome; `leakAudit` audits dist for draft leaks. |

## Apps

| App | Role |
|-----|------|
| `apps/reference` | Minimal Astro host. Portfolio list/detail, a read-only `/console` (`ls`/`cat` over the VFS), and `list.txt` plaintext — all over the same collections |
| `apps/demo` | The live demo above: the kit described by its own content |

## Design pillars

1. **Content once, many surfaces.** Portfolio page, console VFS, plaintext, and llms.txt all read the same collections
2. **Visibility ≠ lifecycle.** `visibility: draft|published` is orthogonal to work `current|complete` or writing `forthcoming`
3. **Look is role-scoped.** Restyle "item title", not only `work:kettle:title`
4. **Admin is DEV-only.** No production write surface. Drafts never ship if filters are correct
5. **Site owns taste.** Type, palette, and chrome stay in the marquee site. Shellside owns *structure*

## Are you insane? This is a really bad idea.

The console looks like a shell on the site. It is a browser over the public content, baked into the HTML at build time. The editorial desk is a real write API, and it has no accounts: `isDev()` plus a `Host` header of `localhost`. The full account is [docs/ARE_YOU_INSANE.md](./docs/ARE_YOU_INSANE.md).

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

Pre-1.0; releases are `0.x` tags listed in [CHANGELOG.md](./CHANGELOG.md). **R0 was declared 2026-10-11 and R1 on 2026-10-18**: a reference host, a packaged read-only console, the config-driven `@shellside/site` host, a `create-site` scaffold, a filesystem-as-information-architecture projection, a dev-only desk route, and a leak audit that runs against the marquee's public export (about 119 pages, green). The marquee builds on vendored `@shellside/*` packages in `vendor/shellside`, synced by `scripts/sync-marquee-vendor.mjs`. Details: [docs/MARQUEE_SWITCH.md](./docs/MARQUEE_SWITCH.md).

**Next is R2, a publishable kit**: packages installable without vendoring. Nothing is published to npm yet, and no second real site has run the scaffold. [docs/ROADMAP.md](./docs/ROADMAP.md) covers the north star, the release bars, phased delivery, and the marquee sync protocol. The release bars run R0, contracts plus a content portability smoke, then R1, dual-surface with a marquee content fixture, then R2, publishable.

## What "renders correctly" means

A production build of the reference host shows the **public** work, writing, and records graph with boring chrome. Drafts stay out of `dist` when `visibility` is `draft`, or when `visibility` is absent and legacy `status` is `draft` or `unpublished`. Redacted private paths stay out of `dist`. It is not a visual twin of charlesberret.net.

## Commands

Requires Node 20 or newer.

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
npm run build:reference        # public pages + /console; leak audit asserts the public set
```

**For a second site** — scaffold one from the template. From a built checkout (`npm ci && npm run build`), the script packs the packages as tarballs into the new site's `vendor/` (no sibling checkouts needed), then installs, builds and runs the leak audit there:

```bash
node scripts/create-site.mjs ../my-site --name "My Site"
```

Then follow the generated site's README (`npm run dev`, `npm run build`, `npm run check`). Mount the DEV handler only in dev, and keep your own tokens and chrome. See [docs/ROADMAP.md](./docs/ROADMAP.md) §4 for the contract-level map.

## License

MIT. See [LICENSE](./LICENSE). Not published to npm.
