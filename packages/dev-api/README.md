# @shellside/dev-api

The editorial desk's write API — DEV only, never production. `createDevContentHandler`
returns the HTTP handler a site mounts (the marquee mounts it at
`/api/dev-content`); `createContentEditor` is the persistence layer.

```js
import { createDevContentHandler } from "@shellside/dev-api";
```

Gates: `isDev()` + localhost Host check. See `docs/ARE_YOU_INSANE.md`.

## Actions (`DevApiActions`)

Scalar writes use `{ path, value? }`. Named actions include `add-link`, `remove-link`,
look-history helpers, and **`create-draft`** — POST `{ action: "create-draft", draftTitle,
draftKind? }` to allocate a new work markdown file or YAML row. Request/response shapes
live in `src/contract.ts` (`DevApiCreateDraftRequest`, `DevApiCreateDraftResponse`);
`createDevContentHandler` implements them.
