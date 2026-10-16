---
title: console-engine
kind: package
summary: Terminal mechanics — parse/path/pipeline/runner/io plus fs and filter commands. Personality stays in the site.
visibility: published
links:
  - label: source
    href: https://github.com/charlesberret/shellside/tree/main/packages/console-engine
---

Extracted JSDoc→TS with the marquee's own test suites. Everything
site-flavored arrives by injection: `createFsCommands(ctx)`,
`createFilterCommands(ctx)`, `createRunner(deps)`.
