---
title: console-vfs
kind: package
summary: Project filtered collections into a virtual filesystem — dirs, files, bins, char devices — for the console surface.
visibility: published
links:
  - label: source
    href: https://github.com/charlesberret/shellside/tree/main/packages/console-vfs
---

The VFS contract: `projectCollections` turns public entries into
`~/projects/*.txt`-style trees; `mount`, `nodeAt`, `walk` do the traversal.
Speaks the marquee's node vocabulary (`t:"c"`, `bin.url`).
