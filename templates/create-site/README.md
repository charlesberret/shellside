# {{NAME}}

A shellside dual-surface site: portfolio pages + `/console` + `/list.txt`
over shared content collections.

- `npm install` (shellside packages resolve from `vendor/*.tgz` — no sibling checkouts)
- `npm run dev` — local
- `npm run build` — static build to `dist/`
- `npm run check` — leak audit (drafts must never reach `dist/`)

Content lives in `src/content/` (`work/*.md`, `writing.yaml`, `records/*.md`,
`reading/*.md`, `cv.yaml`, `resume.yaml`). Drafts: `visibility: draft`.
Site shape: `site.config.ts`.
