# @shellside/reference

Minimal Astro host for the R0 content-portability gate. Boring chrome. It lists **published** work, writing, and records from content collections and emits the same public set as `/list.txt`.

Content is not committed here. `predev` / `prebuild` copy either `fixtures/marquee-content` or `fixtures/toy/content` into `src/content`.

```bash
npm run dev -w @shellside/reference
npm run build -w @shellside/reference
```

Drafts stay in the content tree and must not appear in `dist`. `node scripts/check-public-output.mjs` enforces that after a production build.
