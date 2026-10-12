# Marquee switch (proof A) — DONE 2026-10-11

charlesberret.net consumes shellside packages. Since the deploy runner only
checks out the marquee repo, consumption is via **vendored builds**:

- `scripts/sync-marquee-vendor.mjs` (shellside) copies each package's
  `package.json` + `dist/` into `<marquee>/vendor/shellside/<name>` (the
  marquee's `file:` deps point there), and stamps `manifest.json` with the
  shellside SHA + per-package dist hashes.
- `scripts/check-vendor.mjs` (marquee) fails when a sibling shellside
  checkout exists and its built dist differs from the vendored copy; skips
  on the runner.
- `vendor/**/dist/` is deliberately unignored in the marquee `.gitignore`.

## What the marquee keeps (site-owned)

| Kept in marquee | Why |
|-----------------|-----|
| `look-roles.ts` LOOK_ROLES labels/hints/selectors + `lookRolesClientPayload` | selectors encode site DOM |
| `live-edit.js` client copy of `pathToLookRole` | client-side, no build dep; keep in sync — `@shellside/look` adds `coauthors` → item-meta |
| `public-content.ts` Astro context helpers (`adminPreview`, `contentContextFromUrl`) | `import.meta.env` is site-bound |
| `content-edit.ts` collection layout, allowlist, `PROFILE_LIST_JOIN`, draft builders | site content shapes and policy |
| `dev-content.ts` look surface (tokens, palettes, field-styles CSS) | site token names + taste |
| `field-styles.ts` CSS, `design-tokens.ts` | I/O is `createFieldStyles` (2026-10-12); the site file still owns CSS and token maps |

## Parity notes

- `@shellside/edit-protocol` `parseContentPath`: profile/page are two-segment
  only; `records:` aliases to `record`; archive `id` is the sub-document and
  `archiveKinds` (`["cv","resume"]`) enforces the which-check the old parser
  did. `isAllowedEdit` → `allowlist` config (same regexes as before).
- `@shellside/look` `pathToLookRole` now covers the full marquee map
  including `profile:*` list roles, `page:portfolio.heroKicker`, and the
  page caption set (`plaintext|completeIndex|readOnSite|fullRecord`).
- `@shellside/dev-api` `createDevContentHandler`: gates on injected `isDev`
  + loopback host; content actions delegate to `createContentEditor`; the
  look surface (`meta`, `pathExtras`, `writeExtras`, `setStyle`,
  `historyList`, `historyRestore`, `setTokens`, `palette`) is injected.
- `coerceVisibility`, writing-year coercion, byline `and`-split, and the
  profile-list empty-save guard are kit defaults (they are contract, not
  taste); the site may override via `createContentEditor` options.
