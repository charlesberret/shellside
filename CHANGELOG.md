# Changelog

All notable changes to this project are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are
semver tags, starting at `0.x` while the kit is pre-publishable (R2 is
the packaging milestone).

## [Unreleased]

### Changed

- **`@shellside/console-vfs`** adopted the marquee's node vocabulary (breaking within 0.x): `t:"c"`/`gen()` char devices, `bin.url`, `file()` emits `html`/`links`/`compactLinks` defaults; `VfsLink` gains `editLabel`/`editDesc`; `link()` shortcut. New `docs/DIVERGENCES.md` tracks marquee↔kit alignment.

### Added

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
