# ADR — filesystem as information architecture

**Status:** proposed, 2026-10-17
**Context:** patron ask — "a simple system directory architecture in which
the flat file and folder structure determines page content, headings,
subheadings, etc. for the main page, whereas dotfiles and hidden directories
appear only in the console view. Site and page configs are given in hidden
plaintext files with read-only access in console mode." Extends
`2026-10-16-site-instance-contract.md`.

## Decision

The content tree **is** the site structure. `src/content/` maps 1:1 to the
console's `~/` — the same tree both surfaces read.

### Contract

- **Root** — `content/` itself; `content/.site` is the site config (see below).
- **Directories** — each top-level dir is a **section** on the index page and
  a dir in the console. Order: alphabetical, `.meta` can override.
- **Files** — a file inside a section dir is an **entry** (a row under the
  section heading; a page at `/<dir>/<slug>`). Markdown renders; `.txt` is
  verbatim.
- **Root-level files** — `*.md`/`*.txt` at `content/` root are standalone
  entries on the index (no section heading) and files under `~/` in console.
- **Deeper nesting** — `dir/sub/file.md` renders at `/<dir>/<sub>/<slug>` and
  appears as a nested dir in console. Index lists it under the section as
  `sub/file` (flat mention, not a new heading) — headings beyond h2 are the
  entry pages' own business.
- **Dotfiles / hidden dirs** — any name starting `.` is invisible to page
  rendering and to `ls` without `-a`; fully present in the console tree
  (`ls -a`, `cat`, `cd` all work on them).
- **Hidden plaintext config** — `.site` at content root (site config: name,
  tagline, identity block, `key: value` lines); `.meta` inside any dir
  (section title, order, blurb). Readable via `cat` in the console; never
  writable from it (the console has no write verbs — this is structural).
- **Drafts** — `visibility: draft` frontmatter (or legacy `status`) still
  gates; hidden-by-dot and hidden-by-visibility are orthogonal.

### What this replaces

- `site.config.ts` `console.collections` map — dirs no longer need declaring;
  the tree *is* the collection map. (Name → route is now literally `dir`.)
- Index pages' hardcoded section lists — sections enumerate the tree.
- `entryCollection`/`loaderFor` shapes — a dir of markdown **is** a
  collection; a `*.yaml` list stays supported as an entry file whose body is
  a list (`records.yaml` → a section "records" whose entries are its rows).

### What stays

- Astro content collections remain the **render path** for detail pages
  (zod passthrough + `render()`); the IA projection is a *structure* layer
  over the same files — loaders can keep pointing at the same dirs.
- `visibility` filtering gates both surfaces.
- Taste stays site-side; the projection emits structure, not chrome.

## Consequences

- `@shellside/site` gains `projectSiteTree(contentDir)` (or console-vfs gains
  it) returning `{ sections, entries, hidden }`; index + console + list.txt +
  llms.txt all consume it.
- `site.config` shrinks: identity, surfaces, edit hooks remain; the
  collection map collapses into the tree itself.
- create-site's content dir becomes the tutorial — add a dir, get a section.

## Revisit when

The marquee evaluates adopting (their model is typed collections; the IA
projection must subsume `selectedProjects`/profile-style singletons — decide
in implementation whether singletons like `profile.yaml` stay or fold into
`.site`-style config files).
