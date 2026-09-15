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
- Look: font, **weight**, size, leading, case, color  

## Skin isolation (Look)

Look writes the **portfolio** skin. What crosses to the console:

| Key | Console |
|-----|---------|
| color, case | yes — signal without resizing the shell |
| size, font, weight, leading | **no** — console owns its type scale (mono, uniform), including the pagehead site name |

No per-role size exception. Helper: `crossSkinStyle()` in `@shellside/look`.  
Origin: marquee `c3a96b2` (2026-09-12) — the old `site-name` size exception let portfolio tokens paint the terminal header.

## Unsaved-edit guard

- **Baseline** for the dirty check is set after load and after each save, from the value that was **actually persisted** — not the input re-read after the fetch resolves (keystrokes during the in-flight POST must still read as unsaved).
- Prompt on close / field switch / reload when dirty. Links **list** is navigation only, never dirty. Compare text with newlines normalized and link fields trimmed.
- **Destructive actions** (remove-link) ask about unsaved edits **before** the POST; the close that follows a successful delete skips the prompt (the field is gone).
- Origin: marquee `86344e1` (ultrareview finding, 2026-09-12).

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
