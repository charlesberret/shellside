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
  surfaces: { portfolio: true, console: true, plaintext: true, devDesk: true },
  edit: {
    contentRoot: "src/content",
    files: {
      work: "work",
      writing: "writing.yaml",
      profile: "profile/profile.yaml",
    },
    policy: "./src/lib/edit-policy.ts",
  },
  console: {
    collections: [
      { dir: "projects", collection: "work", ext: "txt", urlPrefix: "/projects" },
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
