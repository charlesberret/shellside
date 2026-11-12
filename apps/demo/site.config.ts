import { defineShellsiteConfig } from "@shellside/site";

export default defineShellsiteConfig({
  identity: { name: "Shellside", tagline: "a kit for dual-surface portfolio sites" },
  collections: {},
  surfaces: { portfolio: true, console: true, plaintext: true, llmsTxt: true, devDesk: true },
  console: {
    helpTopics: {
      lore: { short: "why this console exists", long: "The console surface reads the same content tree as the pages. ls, cat, grep — the text is the site's own." },
      shellside: { short: "the kit", long: "@shellside/site + console-vfs + console-engine. The whole tree fits in the page — drafts never ship." },
    },
    homeFiles: {
      "readme.txt":
        "This site is built on the kit it describes.\nEach file under packages/ is one shellside package; docs/ holds the kit docs.\nls packages/ · cat docs/architecture.txt · cat releases/v0.3.0.txt",
    },
  },
  edit: {
    contentRoot: "src/content",
    files: { work: "packages", writing: "docs.yaml", records: "releases.yaml" },
    policy: "./src/lib/edit-policy.ts",
  },
});
