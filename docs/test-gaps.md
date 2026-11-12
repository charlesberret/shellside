# Test gap analysis

Sprint baseline: current `main` workspace packages and root scripts. Package tests use Node’s built-in test runner with `tsx` for TypeScript. Run `npm run build` before `npm test` so workspace packages resolve each other’s `dist/` outputs (CI does this in `.github/workflows/check.yml`).

## Coverage by unit

### Root

| Unit | Test command | Summary |
| --- | --- | --- |
| **shellside (aggregate)** | `npm test` | Chains all seven workspace package test scripts in dependency-friendly order. |
| **scripts/** | `node --test scripts/*.test.mjs` | Also run from `npm run check` after reference build. |

```
$ npm test
# (final workspace in chain)
# tests 15
# pass 15
# fail 0
```

```
$ node --test scripts/*.test.mjs
# tests 3
# suites 2
# pass 3
# fail 0
```

### `@shellside/content-model`

| Command | `npm run test -w @shellside/content-model` |
| Summary | `# tests 10` · `# suites 3` · `# pass 10` · `# fail 0` |

**Source:** `visibility.ts` only. **Tests:** `visibility.test.ts` (normalize, public filter, legacy status, `contentContextFromSearch`). `index.ts` is re-exports.

### `@shellside/edit-protocol`

| Command | `npm run test -w @shellside/edit-protocol` |
| Summary | `# tests 16` · `# suites 5` · `# pass 16` · `# fail 0` |

**Source:** `paths.ts`, `preview.ts`, `preview-bridge.ts`, `kinds.ts`, `allow.ts`, `files.ts`. **Tests:** `paths.test.ts`, `preview.test.ts`, `preview-bridge.test.ts`, `parity.test.ts` (kinds, allow, files parity with desk expectations). No isolated unit file for `allow.ts` / `kinds.ts` beyond parity.

### `@shellside/look`

| Command | `npm run test -w @shellside/look` |
| Summary | `# tests 72` · `# suites 11` · `# pass 72` · `# fail 0` |

**Source:** field styles, tokens, roles, history, fs adapters, design tokens, presets. **Tests:** `field-styles.test.ts`, `field-styles-fs.test.ts`, `history-fs.test.ts`, `roles.test.ts`, `tokens.test.ts`. **Untested modules:** `options.ts`, `weights.ts` (constants consumed by tests indirectly), thin `fs.ts` barrel.

### `@shellside/dev-api`

| Command | `npm run test -w @shellside/dev-api` |
| Summary | `# tests 16` · `# suites 2` · `# pass 16` · `# fail 0` |

**Source:** `content-editor.ts`, `handler.ts`, `contract.ts`. **Tests:** `editor.test.ts` (editor + HTTP handler), `contract.test.ts` (`isLoopbackHost`). `contract.ts` string notes are documentation only.

### `@shellside/console-vfs`

| Command | `npm run test -w @shellside/console-vfs` |
| Summary | `# tests 6` · `# pass 6` · `# fail 0` |

**Source:** `vfs.ts`, `project.ts`. **Tests:** `vfs.test.ts` (mount, walk, `projectCollections` flat and grouped). High line coverage for a small package.

### `@shellside/console-engine`

| Command | `npm run test -w @shellside/console-engine` |
| Summary | `# tests 11` · `# pass 11` · `# fail 0` |

**Source:** parse, path, io, pipeline, complete, history, `runner.ts`, `commands/*`. **Tests:** one file per subsystem under `src/` and `src/commands/` except **`runner.ts`** (covered indirectly via `pipeline.test.ts` `createRunner`). No browser/DOM tests for console UI (lives in `packages/site/pages/console.astro`).

### `@shellside/site`

| Command | `npm run test -w @shellside/site` |
| Summary | `# tests 15` · `# pass 15` · `# fail 0` |

**Source:** Astro integration (`index.ts`), `config.ts`, `site-tree.ts`, `frontmatter.ts`, `public.ts`, `leak-audit.ts`, `endpoints/*.ts`, packaged `console.astro`. **Tests:** `index.test.ts`, `site-tree.test.ts`, `frontmatter.test.ts`, `public.test.ts`, `leak-audit.test.ts`. **No direct tests:** `endpoints/list-txt.ts`, `llms-txt.ts`, `section-txt.ts` (exercised only via `build:reference` / `check-public-output`).

### Apps (no package test script)

| Unit | Verification in CI |
| --- | --- |
| `apps/reference` | `npm run build:reference` + `node scripts/check-reference.mjs` |
| `apps/demo` | `astro build` + `scripts/check.mjs` (leak audit on demo dist) |

### `scripts/`

| Command | `node --test scripts/*.test.mjs` |
| Summary | `# tests 3` · `# suites 2` · `# pass 3` · `# fail 0` |

**Tests:** `export-marquee-content.test.mjs` (redaction rules + export). **Untested scripts:** `check-reference.mjs`, `check-public-output.mjs`, `prepare-reference-content.mjs`, `sync-marquee-vendor.mjs`, `create-site.mjs` (integration-only).

---

## Ten riskiest previously untested behaviours

Ordered by impact if they regress (security and content leakage first).

1. **`leakAudit` — draft HTML routes emitted under `dist/`** — Public build must not ship URLs for `visibility: draft` items; audit is the release gate for console + portfolio parity.
2. **`leakAudit` — `SHELLSIDE_*_SENTINEL` strings from draft bodies appearing in dist** — Canary text in draft fixtures; a vacuous audit would give false confidence.
3. **`leakAudit` — configured redaction needles** — Private export paths must not appear in built output.
4. **`publicEntries` / shared listing helpers** — Console, plaintext, and portfolio must apply the same `filterByVisibility` rules; mismatch leaks drafts on one surface only.
5. **`isLoopbackHost` — DEV write API host gate** — Mis-parsing allows non-loopback hosts while `import.meta.env.DEV` is true (see architecture docs on Host header trust).
6. **`parseFrontmatter` — scalar parsing for audit + site tree** — Wrong parsing hides draft metadata or breaks `site-tree` section detection.
7. **Plaintext endpoints (`list-txt`, `section-txt`, `llms-txt`)** — No unit tests; only full Astro builds. Regressions could omit drafts filter or wrong sort order on public text surfaces.
8. **`createDevContentHandler` with custom `hostOk`** — Default loopback is tested; injected `hostOk` bypass paths are not explicitly regression-tested.
9. **`projectCollections` skipping empty slug/body** — Partially covered; edge case of HTML fragments + `compactLinks` in production console mount is untested at site integration level.
10. **Marquee export + `check-public-output` script wiring** — Depends on `leakAudit` but script itself has no test; wrong `routeDirs` or needles config would silently weaken CI.

Items **1–6** received new unit tests in this pass (see below). **7–10** remain integration or follow-up gaps.

---

## Gap-filling tests added (this change)

| Area | File | New cases |
| --- | --- | --- |
| Leak audit | `packages/site/src/leak-audit.test.ts` | Clean dist; draft route + sentinel failures; missing dist + redaction needle |
| Frontmatter | `packages/site/src/frontmatter.test.ts` | No fence; quoted scalars; unclosed delimiter |
| Public listings | `packages/site/src/public.test.ts` | `entryId`; `publicEntries` visibility matrix; `byTitle` sort |
| DEV API contract | `packages/dev-api/src/contract.test.ts` | `isLoopbackHost` accept/reject matrix |

**Verify:**

```bash
npm run build && npm test
```

Last lines (after build):

```
# tests 15
# pass 15
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 189.373618
```

(`@shellside/site` and `@shellside/dev-api` counts increase; full `npm test` aggregate ends on site’s 15 tests in the workspace chain.)

---

## Suggested follow-ups

- Thin endpoint tests for plaintext handlers (mock `getCollection`, assert filtering and MIME).
- Explicit test that `hostOk: () => true` still requires `import.meta.env.DEV` in the handler.
- Optional coverage report (`c8` or `node --experimental-test-coverage`) once a threshold is agreed for the monorepo.
