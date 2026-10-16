---
title: dev-api
kind: package
summary: DEV-only desk machinery — content editor and the gated HTTP handler behind the admin surface.
visibility: published
links:
  - label: source
    href: https://github.com/charlesberret/shellside/tree/main/packages/dev-api
---

`createContentEditor` is the filesystem write core;
`createDevContentHandler` the DEV route. Nothing here ships to
production builds.
