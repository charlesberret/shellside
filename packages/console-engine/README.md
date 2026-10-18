# @shellside/console-engine

Terminal mechanics for the console surface: tokenize, path resolution,
pipelines (`|`), the runner (echo/capture/history hooks), fs commands
(ls/cd/cat/tree/open/find), filter commands (grep/head/tail/wc/sort/uniq/diff/strings),
plus `createHistory` and `completeLine`. Everything site-flavored arrives by
injection.

```js
import { createRunner, createFsCommands, createFilterCommands, createHistory, completeLine } from "@shellside/console-engine";
```
