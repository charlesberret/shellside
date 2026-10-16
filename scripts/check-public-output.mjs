/**
 * R0 leak audit for the reference production build.
 * Delegates to @shellside/site's leakAudit — same function scaffolded sites run.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { leakAudit } from "../packages/site/dist/leak-audit.js";
import { REDACTION_NEEDLES } from "./redaction.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const failures = leakAudit({
  contentDir: path.join(root, "apps", "reference", "src", "content"),
  distDir: path.join(root, "apps", "reference", "dist"),
  routeDirs: { work: "projects", writing: "writing", records: "records", reading: "reading" },
  needles: REDACTION_NEEDLES,
  sentinelMarkerFile: path.join(root, "apps", "reference", "src", "content", ".shellside-toy"),
  plaintextRoute: "list.txt",
});

if (failures.length) {
  console.error("check-public-output: FAILED");
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log("check-public-output: ok");
