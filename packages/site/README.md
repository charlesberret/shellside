# @shellside/site

The config-driven host: `shellsite(config)` is an Astro integration that
injects the dual-surface routes — `/console` (engine-driven, reads the VFS),
`/list.txt`, `/llms.txt`, `/<section>.txt` — and exports `projectSiteTree`
(filesystem-as-IA: the content tree determines sections, entries, headings;
dotfiles are console-only) and `leakAudit`.

```js
import { shellsite, defineShellsiteConfig, projectSiteTree, leakAudit } from "@shellside/site";
```

Docs: `docs/decisions/2026-10-16-site-instance-contract.md` and
`docs/decisions/2026-10-17-filesystem-ia.md` at the repo root.
