# Changelog

All notable changes to this project are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are
semver tags, starting at `0.x` while the kit is pre-publishable (R2 is
the packaging milestone).

## [Unreleased]

- **Filesystem-IA** (`docs/decisions/2026-10-17-filesystem-ia.md`): the content tree is the site structure — dirs → sections/headings, files → entries, root `*.yaml` lists → sections, dotfiles console-only. `projectSiteTree()` in `@shellside/site`; demo index + `[dir]/[...id]` consume it; `.site`/`.meta` hidden plaintext config readable via `cat` in console.
- **`/llms.txt`** surface behind `surfaces.llmsTxt`; `surfaces.devDesk` marked planned (LAB-1519).
- **Packaged console**: `less` overlay pager, clickable fs entries, `open <file>` follows `node.url`, `console.helpTopics` config.
- **Default skin**: dark-mode + focus-visible pass on demo/template css.


- **`@shellside/console-engine`** gained `createHistory` (ring + draft restore) and `completeLine` (lcp + cycle on repeat Tab); the packaged `/console` page is now a bundled engine-driven shell — pipes, grep/find/head/tail/wc/sort/uniq/diff/strings, ls/cd/cat/tree/open, ↑/↓ history, Tab completion — replacing the hand-rolled if/else shell.
- **`apps/demo`** — self-describing demo on GitHub Pages (`shellsite` instance; packages as entries, docs as writing, releases as records). `.github/workflows/pages.yml` builds packages → demo → leak-audit gate → deploy.

## [0.3.0] — 2026-10-16

The kit completes the grand-plan lane: engine mechanics, the config-driven
host, the create-site scaffold, and the shared leak audit are all in. The
console-vfs node-vocabulary change is **breaking within 0.x** — consumers
using `t:"chr"`/`read`/`bin.href` must adopt `t:"c"`/`gen()`/`bin.url`.

### Changed

- **`@shellside/console-vfs`** adopted the marquee's node vocabulary (breaking within 0.x): `t:"c"`/`gen()` char devices, `bin.url`, `file()` emits `html`/`links`/`compactLinks` defaults; `VfsLink` gains `editLabel`/`editDesc`; `link()` shortcut. New `docs/DIVERGENCES.md` tracks marquee↔kit alignment.

### Added

- **`@shellside/site`** gained `leakAudit` — the draft/private-content leak audit as a library function; `scripts/check-public-output.mjs` delegates, scaffolded sites get `scripts/check.mjs`.
- **`scripts/create-site.mjs` + `templates/create-site/`** — scaffold a second site: `npm pack` tarballs into `vendor/` (no sibling `file:` links, no registry publish), template copied with `{{NAME}}`/`{{SLUG}}` tokens. Verified end-to-end in a fresh dir: install → build → leak audit green.
- **`@shellside/site`** — config-driven dual-surface host: `shellsite(config)` Astro integration injects `/console` (packaged read-only VFS shell) and `/list.txt`; `virtual:shellsite/config` carries plain-data config (`defineShellsiteConfig`); shared `publicEntries`/`byTitle`/`entryId`. Reference app now builds on it (marquee export: 119 pages, leak audit green).
- **`@shellside/console-engine`** — extracted the marquee engine mechanics: `parse`/`path`/`pipeline`/`runner`/`io` + `createFsCommands`/`createFilterCommands`, ported to TS with the marquee's test suites; path aliases injectable. Marquee delegates (marquee `5fc9228`); session/site/help/man-pages/lore stay site.
- **Reference app** covers the full exported set: `reading/` collection + `/reading/[id]` detail pages, `/about/cv` + `/about/resume` from `cv.yaml`/`resume.yaml` (marquee export build: 119 pages). Toy fixture gained matching entries.
- **`@shellside/edit-protocol`** gained the preview-bridge contract (`BRIDGE_*_SOURCE`, `BRIDGE_EDITOR_EVENT`, typed message unions, `shellMessage`/`previewMessage`/`isShellToPreview`/`isPreviewToShell`). Marquee call sites adopted (marquee `9616b54`; `live-edit.js` pending the in-flight session commit).
- **`@shellside/edit-protocol`** gained the admin-preview flag helpers (`ADMIN_PREVIEW_PARAM`, `isAdminPreviewUrl`, `withAdminPreview`) — the desk/site param name is now contract.
- **`@shellside/look/fs`** gained `createDesignTokens` and `createPalettePresets` — design-tokens.yaml load/merge/set with validated writes, palette-preset file I/O; site injects keys/defaults/builtins. Marquee delegates (marquee `def5594`).

## [0.2.0] — 2026-10-15

R1 progress: the kit now covers the console surface. Anyone consuming the
packages can project their filtered collections into a VFS and serve a
working `ls`/`cat` console — as the reference app does — without writing
tree plumbing. No consumer action needed; nothing a site relies on broke.

### Added

- **`@shellside/console-vfs`** — VFS node types (`dir`/`file`/`bin`/`chr`), `mount`/`nodeAt`/`walk`, and `projectCollections` mapping filtered collections to `dir/<slug>.<ext>` trees. No personality.
- **Reference app `/console`** — read-only `ls`/`cd`/`cat`/`tree` shell over the public VFS (104-page marquee export verified; drafts absent).

### Documentation

- **README** gained a dual-surface walkthrough ("from zero" and "with marquee content") and the release-steps doc; R1 wording de-privated across ROADMAP/PRODUCT_NOTES/_Status.

## [0.1.0] — 2026-10-15

R0: the extraction gate. Contracts and machinery extracted from
charlesberret.net and consumed by it.

### Added

- `@shellside/content-model` — visibility schemas and filters; `visibility` is orthogonal to lifecycle `status`.
- `@shellside/edit-protocol` — `data-edit` path grammar, field-kind classification, allowlists, content-file mapping.
- `@shellside/look` — semantic role map, field-style contracts, option lists, cross-skin isolation; `createLookHistory` and `createFieldStyles` under `@shellside/look/fs`.
- `@shellside/dev-api` — DEV-only desk machinery: `createContentEditor` (fs write core), `createDevContentHandler` (DEV + loopback gates; look surface injected).
- `apps/reference` — Astro static host proving content portability: toy fixtures, exported marquee content (103 public pages), or `REFERENCE_CONTENT`.
- `scripts/export-marquee-content.mjs`, `check-public-output.mjs` (leak audit), `check-reference.mjs`, `sync-marquee-vendor.mjs`, `prepare-reference-content.mjs`.
- `_Status.md`, `docs/decisions/` ADR convention (first: vendored package consumption).

### Changed

- The marquee consumes all four packages as vendored builds (`vendor/shellside`, `file:vendor/shellside/*`); its content-edit, dev-content, look-history, look-roles, public-content, and field-styles modules are thin adapters. `check:admin` 32/32 green through the kit factories.
- Repo is public MIT (2026-10-14); `main` is protected (required check `check`).

### Verified

- `npm run check`: all package suites + reference build + leak audit + script tests green.
- Drafts/legacy-hidden entries excluded from portfolio routes, plaintext, and console projections (negative-tested).

[0.1.0]: https://github.com/charlesberret/shellside/releases/tag/v0.1.0
