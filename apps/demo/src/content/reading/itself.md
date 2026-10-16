---
writingId: itself
title: This demo site, explained
sourceUrl: https://github.com/charlesberret/shellside
sourceLabel: shellside repo
rights: own
---

## A site about its own kit

Every page here is a `@shellside/site` instance: the portfolio listing,
the `/console` shell, and `/list.txt` all come from the same config and
the same content dir. Nothing about this site is bespoke chrome —
that is the point being demonstrated.

`site.config.ts` in `apps/demo/` is the whole definition: identity,
collection shapes, surface flags, console collection map.
