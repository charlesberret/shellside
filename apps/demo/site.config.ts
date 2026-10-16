import { defineShellsiteConfig } from "@shellside/site";

export default defineShellsiteConfig({
  identity: { name: "Shellside", tagline: "a kit for dual-surface portfolio sites" },
  collections: {
    work: "entries-md",
    writing: "list-yaml",
    records: "list-yaml",
    reading: "entries-md",
  },
  surfaces: { portfolio: true, console: true, plaintext: true },
  console: {
    collections: [
      { dir: "packages", collection: "work", ext: "txt", urlPrefix: "/projects" },
      { dir: "docs", collection: "writing", ext: "txt", urlPrefix: "/writing" },
      {
        dir: "index",
        collection: "records",
        ext: "txt",
        groupBySection: true,
        urlPrefix: "/records",
      },
    ],
    homeFiles: {
      "readme.txt":
        "This site is built on the kit it describes.\nEach file under packages/ is one shellside package; docs/ holds the kit docs.\nls packages/ · cat docs/architecture.txt · cat releases/v0.3.0.txt",
    },
  },
});
