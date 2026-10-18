# @shellside/console-vfs

Project public collections into a virtual filesystem for the console surface:
dirs, files, bins (external URLs), char devices. `projectCollections` turns
the section map into `~/` children.

```js
import { dir, file, projectCollections, nodeAt } from "@shellside/console-vfs";
```
