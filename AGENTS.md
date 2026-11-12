# Shellside — agent notes

## What this is

A **public-bound** framework repo (MIT) for dual-surface portfolio sites + dev editorial desk. Not charlesberret.net itself; that site is the first consumer.

**Public-surface rule:** tracked files are publishable — no Linear ids, local `~/` paths, or house-process files. Status and threads live untracked in `.local/`; the pre-commit hook enforces it.

## Rules

1. **Prefer contracts over copies.** When promoting code from the marquee site, extract *stable* APIs (schemas, path grammar, filters), not one-off page chrome.
2. **Do not invent a hosted CMS.** Writes are filesystem + DEV API; production is build-time.
3. **Visibility vs lifecycle** — never overload `status: current|complete` with draft/published. Use `visibility`.
4. **Documentation is a feature.** Architecture docs and extraction maps are first-class deliverables.
5. **Marquee site is not a dumping ground for framework experiments.** Prototype in `apps/reference` or packages; promote deliberately.

## Key docs

- `docs/ROADMAP.md` — release bars, feature set, phases, marquee sync protocol
- `docs/ARCHITECTURE.md` — system diagram
- `docs/VISIBILITY.md` — draft/published model (incl. how admin sees drafts)
- `docs/LIVE_EDIT.md` — editorial desk contract
- `docs/ARE_YOU_INSANE.md` — what `/console` and the desk actually expose
- `docs/EXTRACTION_MAP.md` — what stays site-local vs kit
- `docs/ALIGNMENT.md` — kit↔marquee phases + sequencing rationale
- `.local/_Status.md` — project status + next actions (untracked)

## Marquee path

Local: `../charlesberret.net` (sibling checkout)  
Promote with care; keep site deploy green.

## Failure modes

- Treating shellside as “clone the whole portfolio”
- Shipping admin/write APIs in production
- Filtering drafts on portfolio but leaking them via console / plaintext / llms.txt
- Committing issue ids or house-process files into the public-bound tree
