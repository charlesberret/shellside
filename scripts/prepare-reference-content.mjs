/**
 * Fill apps/reference/src/content before dev/build.
 *
 * REFERENCE_CONTENT wins. Otherwise a non-empty fixtures/marquee-content
 * (export output) wins. Otherwise the committed toy fixture.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dest = path.join(root, "apps", "reference", "src", "content");
const toy = path.join(root, "fixtures", "toy", "content");
const exported = path.join(root, "fixtures", "marquee-content");

function hasEntries(dir) {
  if (!fs.existsSync(dir)) return false;
  return fs.readdirSync(dir).some((name) => name !== ".gitkeep" && !name.startsWith("."));
}

const source =
  process.env.REFERENCE_CONTENT || (hasEntries(exported) ? exported : toy);

if (!hasEntries(source)) {
  console.error(`prepare-reference-content: empty source ${source}`);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(source, dest, { recursive: true });
console.log(
  `prepare-reference-content: ${path.relative(root, source)} → apps/reference/src/content`,
);
