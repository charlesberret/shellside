import { defineShellsiteConfig } from "@shellside/site";

export default defineShellsiteConfig({
  identity: { name: "Reference Site" },
  collections: {
    work: "entries-md",
    writing: "list-yaml",
    records: "list-yaml",
    reading: "entries-md",
    profile: "list-yaml",
    "page-copy": "list-yaml",
  },
  surfaces: { portfolio: true, console: true, plaintext: true },
  console: {
    collections: [
      { dir: "projects", collection: "work", ext: "txt", urlPrefix: "/projects" },
      { dir: "writing", collection: "writing", ext: "txt", urlPrefix: "/writing" },
      {
        dir: "index",
        collection: "records",
        ext: "txt",
        groupBySection: true,
        urlPrefix: "/records",
      },
    ],
  },
});
