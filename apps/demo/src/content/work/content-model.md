---
title: content-model
kind: package
summary: Schemas and the visibility contract — draft never leaks into public surfaces.
visibility: published
links:
  - label: source
    href: https://github.com/charlesberret/shellside/tree/main/packages/content-model
---

`filterByVisibility` is the single gate every surface passes through:
portfolio pages, the console VFS, `list.txt`, and the leak audit alike.
