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
4. **No production write API** — `import.meta.env.DEV` + localhost (or successor auth later).
5. **Console is a surface, not a second content store** — VFS is a projection.

## Non-goals (for now)

- Multi-tenant hosting
- Auth for remote editors (local DEV only)
- WYSIWYG block editor
- Database-backed content
