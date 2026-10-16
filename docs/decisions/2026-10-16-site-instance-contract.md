# ADR — site-instance contract: what a shellside site declares

**Status:** proposed, 2026-10-16
**Context:** the alignment plan (`docs/ALIGNMENT.md`) aims at the marquee
becoming an *instance* of shellside — content + config + taste. This is the
design spike for the boundary (LAB-1465). The marquee's own Phase-4 roadmap
row ("site config, nav-from-config, portable kit") names the same target.

## Decision

A site is **`site.config.ts` + content collections + taste files + deploy**.
The config is plain data (no imports — serializable, diffable, safe for a
second-site scaffold). Shellside provides the machinery as an **Astro
integration + helpers**, not a page-replacement framework.

### What the config declares

```ts
export default {
  identity: { name, host, tagline },              // console prompt, <title>, llms.txt
  collections: {                                 // names → shape
    work: "entries-md",                          // work/*.md
    writing: "list-yaml",                        // writing.yaml
    records: "list-yaml",
    reading: "entries-md",
    // site adds/renames here; shapes: "entries-md" | "list-yaml" | "data-yaml"
  },
  dataFiles: { cv: "cv.yaml", resume: "resume.yaml" },   // non-collection YAML
  surfaces: {
    portfolio: true, console: true, plaintext: true, llmsTxt: true,
    devDesk: true,                               // DEV-gated, never production
  },
  nav: [{ key, label, href, editPath? }],        // nav-from-config (their Phase 4)
  theme: {                                       // taste pointers, not values
    styles: ["./src/styles/palettes.css", "..."],
    consoleLore?: "./src/console/lore.ts",       // VFS extras + commands
  },
  edit: {                                        // desk contract inputs
    allowlist: "./src/lib/allowlist.ts",
    contentRoot: "./src/content",
  },
};
```

### What `@shellside/site` provides

An Astro integration `shellsideSite(config)` that injects routes the site
shouldn't re-implement: `/console` (engine + VFS projection from the
collection map), `/list.txt`/`llms.txt`-style plaintext surfaces, the
dev-content API route (DEV only), and the preview-bridge wiring. Plus a
small component/helper kit (`<Base>`, `publicEntries`, `byTitle`) so site
pages stay thin but stay *theirs* — portfolio chrome is taste and remains
site-owned `.astro`.

Site keeps: content, config, styles, components, console personality
(lore commands/VFS extras via `theme.consoleLore`), `deploy.yml`.

## Options set aside

- **Full page replacement** (kit owns every route; site only fills slots):
  rejected — the portfolio surface *is* the site's art direction; the
  extraction doctrine (contracts over copies) would invert.
- **Config-less convention** (kit scans `src/content` and invents surfaces):
  rejected — invisible magic is worse than a file you can read.
- **Monorepo build** (site built *inside* shellside): rejected — deploy
  stays per-site; vendored `file:` packages already proved the boundary.

## Consequences

- LAB-1466 scopes to: `shellsideSite()` integration + config loader +
  injected generic surfaces; `apps/reference` becomes the proof site.
- The marquee's Phase-4 work (nav-from-config, per-page meta) is the
  reference input; their adoption is a Phase-D unit on their board.
- `site.config.ts` types live in the package so both trees typecheck it.

## Revisit when

A second real site exists and shows where the config is too thin or too
thick; or if Astro's integration API proves awkward for VFS injection.
