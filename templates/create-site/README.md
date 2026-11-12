# {{NAME}}

A shellside dual-surface site: a two-button landing picker (`plain` | `console`),
readable pages + `/console` + `/list.txt` over the same content tree.

- `npm install` (shellside packages resolve from `vendor/*.tgz` — no sibling checkouts)
- `npm run dev` — local
- `npm run build` — static build to `dist/`
- `npm run check` — leak audit (drafts must never reach `dist/`)

Content lives in `src/content/` — the filesystem IS the site structure:

- `index.md` — the main page's own body (`/plain/`)
- `entries/*.md` — a section dir; each file is an entry at `/entries/<slug>`
- `entries/index.md` — a directory's own page (`/entries/`)
- `index.yaml`, `cv.yaml`, `resume.yaml` — yaml lists → sections
- `.site` (site config) and anything dot-prefixed — console-only (`cat ~/.site`, `ls -a`)

Add a directory, get a section. Drafts: `visibility: draft`.
Site shape: `site.config.ts`.
