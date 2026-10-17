/** Leak audit — drafts must never reach dist. */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { leakAudit, projectSiteTree } from "@shellside/site";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tree = projectSiteTree(path.join(root, "src", "content"));
const routeDirs = Object.fromEntries(tree.sections.map((s) => [s.dir, s.dir]));
const failures = leakAudit({
  contentDir: path.join(root, "src", "content"),
  distDir: path.join(root, "dist"),
  routeDirs,
  plaintextRoute: "list.txt",
});
if (failures.length) {
  console.error("check-public: FAILED");
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("check-public: ok");
