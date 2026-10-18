# @shellside/content-model

The visibility contract and shared zod schemas. Every public surface filters
through `isPublicItem` — drafts never reach pages, console, plaintext, or
llms.txt.

```js
import { isPublicItem, entrySchema } from "@shellside/content-model";
```

Docs: `docs/VISIBILITY.md` at the repo root.
