# Live edit / editorial desk (contract)

Full operational notes for the marquee implementation live in  
`charlesberret.net/docs/LIVE_EDIT_MODE.md`. This doc is the **portable contract**.

## Guarantees

| Concern | Contract |
|---------|----------|
| Availability | DEV only; production build must not expose write API |
| Host | Prefer localhost / loopback until real auth exists |
| Storage | Content → site `src/content/*`; Look → `field-styles.yaml`; tokens → `design-tokens.yaml` |
| Path grammar | `@shellside/edit-protocol` (`work:id:field`, `writing:id:field`, …) |
| Look scope | Role-scoped via `@shellside/look` |
| History | Optional snapshot-on-write of Look map (rollback full map) |

## Surfaces

1. **Admin shell** — persistent chrome, nav, iframe preview, docked editor  
2. **Preview bridge** — postMessage field open / CSS apply / reload  
3. **Public DEV toggle** — optional; admin is preferred  

## Field kinds

- Scalar text  
- Tags (work)  
- Link object (label / href / description) — Look **per leaf**  
- Look: font, **weight**, size, color  

## Look history

- Directory: `.look-history/field-styles/` (gitignored)  
- `previous.yaml` + daily `YYYY-MM-DD.yaml`  
- UI: **Rollback look** restores full map  

## Extraction status

| Piece | In marquee | In shellside |
|-------|------------|--------------|
| Path parse / allowlist | yes | `edit-protocol` stub |
| Look roles | yes | `look` stub + role id list |
| field-styles I/O | yes | contract only |
| Admin shell JS | yes | not yet |
| DEV API | yes | contract notes in `dev-api` |
