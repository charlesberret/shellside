import { defineShellsiteConfig } from "@shellside/site";

export default defineShellsiteConfig({
  identity: { name: "Shellside", tagline: "a kit for dual-surface portfolio sites" },
  collections: {},
  surfaces: { portfolio: true, console: true, plaintext: true, llmsTxt: true },
  console: {
    collections: [
      { dir: "packages", collection: "packages", ext: "txt", urlPrefix: "/packages" },
      { dir: "docs", collection: "docs", ext: "txt", urlPrefix: "/docs" },
      { dir: "releases", collection: "releases", ext: "txt", urlPrefix: "/releases" },
      { dir: "notes", collection: "notes", ext: "txt", urlPrefix: "/notes" },
    ],
    helpTopics: {
      lore: { short: "why this console exists", long: "The console surface reads the same content tree as the pages. ls, cat, grep — the text is the site's own." },
      shellside: { short: "the kit", long: "@shellside/site + console-vfs + console-engine. The whole tree fits in the page — drafts never ship." },
    },
    homeFiles: {
      "readme.txt":
        "This site is built on the kit it describes.\nEach file under packages/ is one shellside package; docs/ holds the kit docs.\nls packages/ · cat docs/architecture.txt · cat releases/v0.3.0.txt",
    },
  },
});
