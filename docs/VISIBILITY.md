# Visibility (draft / published)

## Principle

**Visibility is not lifecycle.**

| Concept | Field | Examples |
|---------|-------|----------|
| **Visibility** | `visibility` | `draft` \| `published` |
| **Lifecycle / editorial** | `status` (site-specific) | work: `current` \| `complete`; writing: `forthcoming` \| `published` (legacy) |

Overloading work `status: current|complete` with “draft” would break “Current Work” sections.

## Public rule

```ts
import { isPublicItem } from "@shellside/content-model";

// production + public pages
items.filter(isPublicItem);
```

- Missing `visibility` → treat as **`published`** (safe default for existing content).
- `draft` → excluded from portfolio, console public VFS, plaintext, llms.txt, sitemaps.

## How admin sees drafts

**Not** a separate CMS-only list that looks unlike the site.

**Yes** — drafts appear **in the same section structure** as published items, in **admin/DEV only**, **as they would when published**, with clear draft chrome.

Example (projects):

```
Current Work
  [draft] Kettle          ← admin only; same ProjectRecord layout
  [     ] Something live

Selected Work
  …

Drafts (optional collator)
  [draft] …               ← optional filter strip, not the only place drafts live
```

### Implications

1. **Same components** — `ProjectRecord`, writing rows, record cards render drafts when `includeDrafts: true`.
2. **Draft badge / label** — admin chrome only (`[draft]`, amber pill, or section kicker).
3. **No production HTML** for draft-only routes — filter at collection use; don’t generate `/projects/#draft-id` pages that are linked publicly.
4. **Preview fidelity** — editor sees published appearance + badge, not a wireframe.
5. **Console** — public console VFS omits draft files; admin console may include them with a dim flag.

### Context flags

```ts
type ContentContext = {
  /** true in DEV admin / optional ?includeDrafts in DEV only */
  includeDrafts: boolean;
};
```

| Context | includeDrafts |
|---------|----------------|
| `astro build` (prod) | `false` |
| Public pages in DEV | `false` by default (optional toggle) |
| Admin iframe | `true` |
| Content checks for “public output” | `false` |

## Migration (writing)

Writing already has `status: draft | unpublished | …`. Prefer:

1. Add `visibility` with default `published`.
2. Map existing `status: draft` → `visibility: draft` (one-time or dual-read).
3. Keep `forthcoming` as editorial status, not visibility.

## Leak checklist

Before calling drafts “done”, audit:

- [ ] portfolio / projects / writing / index
- [ ] console VFS + autocomplete
- [ ] `*.txt` and `llms.txt`
- [ ] reading overlay IDs
- [ ] admin “open public” still respects public filters
