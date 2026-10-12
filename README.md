# Shellside

**Private** site framework for dual-surface personal portfolios (readable site + optional console), content collections, and a **dev-only** editorial desk.

Shellside is **not** a hosted CMS. It is a **filesystem-first kit**: content lives as YAML/Markdown, the public site is a static (or node) Astro build, and the admin/live-edit surface exists only in development.

First marquee consumer: [charlesberret.net](https://github.com/charlesberret/charlesberret.net) (or local `~/cloud/git-projects/charlesberret.net`).

## Why this exists

- Capture schematics that would otherwise stay as local idiosyncrasies
- Make the dual-surface + look + content-edit stack **portable** to the next site
- Give agents a documented contract so they can contribute without rediscovering the house style
- Periodically ask: *what would it take for people to notice, appreciate, and use this?* — without sidelining the portfolio itself

## Packages

| Package | Role |
|---------|------|
| `@shellside/content-model` | Schemas, **visibility** (`draft` \| `published`), lifecycle vs visibility, public filters |
| `@shellside/look` | Look roles, field-style map shape, weight/size/font tokens, history contract |
| `@shellside/edit-protocol` | `data-edit` path grammar, allowlists, entity parse |
| `@shellside/dev-api` | DEV-only desk machinery: `createContentEditor` (fs write core), `createDevContentHandler` (gates + actions; site injects look surface) |

## Apps

| App | Role |
|-----|------|
| `apps/reference` | Minimal Astro host: portfolio list/detail + plaintext over content collections |

## Design pillars

1. **Content once, many surfaces** — portfolio page, console VFS, plaintext, llms.txt all read the same collections
2. **Visibility ≠ lifecycle** — `visibility: draft|published` is orthogonal to work `current|complete` or writing `forthcoming`
3. **Look is role-scoped** — restyle “item title”, not only `work:kettle:title`
4. **Admin is DEV-only** — no production write surface; drafts never ship if filters are correct
5. **Site owns taste** — type, palette, chrome stay in the marquee site; shellside owns *structure*

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

**R0 is declared** (2026-10-11): contracts extracted and consumed — the marquee builds on vendored `@shellside/*` packages (`vendor/shellside`, synced by `scripts/sync-marquee-vendor.mjs`; details in [docs/MARQUEE_SWITCH.md](./docs/MARQUEE_SWITCH.md)) — plus reference host, toy fixture, leak audit, CI, and marquee-content portability. Console VFS is R1.

**Roadmap & feature set:** [docs/ROADMAP.md](./docs/ROADMAP.md) — north star, release bars (R0 contracts + content portability smoke → R1 dual-surface with marquee content fixture → R2 publishable), phased delivery, and marquee sync protocol.

## What “renders correctly” means

A production build of the reference host shows the **public** work, writing, and records graph with boring chrome. Drafts (`visibility: draft`, or legacy `status: draft|unpublished` when `visibility` is absent) and redacted private paths are absent from `dist`. It is not a visual twin of charlesberret.net.

## Commands

```bash
npm ci
npm run check          # packages, unit tests, reference prod build, leak audit
npm run export         # copy marquee src/content → fixtures/marquee-content (gitignored)
npm run dev -w @shellside/reference
```

Each of `work`, `writing`, `records`, `profile`, and `page-copy` loads from a root `<name>.yaml` list when present (the marquee shape), else from `<name>/` entry files (the toy keeps records and work that way).

`npm run check` builds the reference app from the committed toy fixture when no export is present. After `npm run export`, the next reference build uses that tree instead. Force the toy with `REFERENCE_CONTENT=fixtures/toy/content`.

Export source: `--source`, else `MARQUEE_ROOT`, else `../charlesberret.net`, else `~/cloud/git-projects/charlesberret.net`. Private directories (`archive`, `enigma`, `private`, `reading-rights`, `secrets`, `.env*`) are dropped. See `scripts/redaction.mjs`.

## License

Private. Not published to npm. All rights reserved unless explicitly opened later.
