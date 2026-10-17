import { defineShellsiteConfig } from "@shellside/site";

export default defineShellsiteConfig({
  identity: { name: "{{NAME}}" },
  collections: {},
  surfaces: { console: true, plaintext: true, llmsTxt: true },
  console: {
    collections: [
      { dir: "entries", collection: "entries", ext: "txt", urlPrefix: "/entries" },
      { dir: "index", collection: "index", ext: "txt", urlPrefix: "/index" },
    ],
  },
});
