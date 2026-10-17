# Architecture

## Dual surface, one content graph

```
                    ┌─────────────────────┐
                    │  src/content/*      │
                    │  work / writing /   │
                    │  records / profile  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
       ┌────────────┐  ┌─────────────┐  ┌──────────────┐
       │ Portfolio  │  │ Console VFS │  │ Plaintext /  │
       │ (readable) │  │ (terminal)  │  │ llms.txt     │
       └────────────┘  └─────────────┘  └──────────────┘
              ▲
              │ iframe preview (DEV)
       ┌──────┴───────┐
       │ Admin shell  │── live-edit panel ── DEV API ── filesystem write
       │ /admin       │
       └──────────────┘
```

## Layers (shellside ownership)

| Layer | Package / docs | Site owns |
|-------|----------------|-----------|
| Content schemas + visibility | `@shellside/content-model` | Actual YAML/MD files, copy |
| `data-edit` path grammar | `@shellside/edit-protocol` | Which paths are allowlisted |
| Look roles + field styles shape | `@shellside/look` | Token values, typefaces, palette |
| DEV content/look API | contract in `dev-api` | Full handler, host checks |
| Admin chrome + preview bridge | later extract | Layout, nav, monome, console personality |
| Deploy | — | GH Actions runner, domain |

## Invariants

1. **Public build omits drafts** — every public collection consumer uses `isPublicItem`.
2. **Admin/DEV can list drafts** — same card/layout as published, with chrome that marks draft.
3. **Look is role-scoped** — not per arbitrary path (paths map *to* roles).
4. **No production write API** — `import.meta.env.DEV` + a `Host` check for localhost (or successor auth later). The `Host` check is not a check of the socket. See below.
5. **Console is a surface, not a second content store** — VFS is a projection.

## Are you insane? This is a really bad idea.

`/console` is a browser program over a JSON copy of the public content. The prompt is costume. The editorial desk is the part that writes: an HTTP API in the dev process, with no accounts, gated by `isDev()` and a `Host` header of `localhost` or `127.0.0.1`. The marquee dev server listens on every interface (`server.host: true` in `~/cloud/git-projects/charlesberret.net/astro.config.mjs`). While that dev server is running, anyone who can open the port and send that header can rewrite the content files.

The file-by-file account — what a visitor of `/console` can read, what the desk can write, what `parseContentPath` refuses, and what `leakAudit` does and does not watch — is [Are you insane? This is a really bad idea.](./ARE_YOU_INSANE.md).

## Non-goals (for now)

- Multi-tenant hosting
- Auth for remote editors (local DEV only)
- WYSIWYG block editor
- Database-backed content
