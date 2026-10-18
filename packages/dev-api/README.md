# @shellside/dev-api

The editorial desk's write API — DEV only, never production. `createDevContentHandler`
returns the HTTP handler a site mounts (the marquee mounts it at
`/api/dev-content`); `createContentEditor` is the persistence layer.

```js
import { createDevContentHandler } from "@shellside/dev-api";
```

Gates: `isDev()` + localhost Host check. See `docs/ARE_YOU_INSANE.md`.
