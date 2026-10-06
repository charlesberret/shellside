# Toy content fixture

Committed stand-in for a marquee export so CI can build `apps/reference` without a charlesberret.net checkout.

- Published work, writing, and records
- One `visibility: draft` in each of those collections
- One writing file with legacy `status: draft` and no `visibility`
- Draft bodies carry `SHELLSIDE_*_SENTINEL` strings. The leak audit fails if those strings or draft routes appear in `dist`

`scripts/prepare-reference-content.mjs` copies this tree unless `fixtures/marquee-content` or `REFERENCE_CONTENT` is set.
