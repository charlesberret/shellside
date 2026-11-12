import { defineShellsiteConfig } from "@shellside/site";

export default defineShellsiteConfig({
  identity: { name: "{{NAME}}" },
  collections: {},
  surfaces: { console: true, plaintext: true, llmsTxt: true },
});
