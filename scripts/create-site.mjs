/**
 * create-site — scaffold a second dual-surface site from this repo.
 *
 * Usage: node scripts/create-site.mjs <target-dir> [--name "Site Name"]
 *
 * Packs the shellside packages to tarballs (no sibling file: links, no
 * registry publish needed), copies templates/create-site, writes
 * package.json with file: tarball deps, then installs + builds + audits.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv[2];
if (!target) {
  console.error("usage: node scripts/create-site.mjs <target-dir> [--name \"Site Name\"]");
  process.exit(1);
}
const targetDir = path.resolve(target);
const nameArg = process.argv.indexOf("--name") !== -1
  ? process.argv[process.argv.indexOf("--name") + 1]
  : path.basename(targetDir);
const slug = nameArg.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "site";

function npmCli() {
  const npm = execFileSync("which", ["npm"], { encoding: "utf8" }).trim();
  return fs.realpathSync(npm);
}

const PACKAGES = [
  "content-model",
  "edit-protocol",
  "look",
  "dev-api",
  "console-vfs",
  "console-engine",
  "site",
];

if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length) {
  console.error(`create-site: ${targetDir} exists and is not empty`);
  process.exit(1);
}
fs.mkdirSync(path.join(targetDir, "vendor"), { recursive: true });

for (const pkg of PACKAGES) {
  const out = execFileSync(process.execPath, [npmCli(), "pack", "--pack-destination", path.join(targetDir, "vendor")], {
    cwd: path.join(root, "packages", pkg),
    encoding: "utf8",
  }).trim().split("\n").pop().trim();
  if (!out.endsWith(".tgz")) {
    console.error(`create-site: unexpected pack output for ${pkg}: ${out}`);
    process.exit(1);
  }
}

fs.cpSync(path.join(root, "templates", "create-site"), targetDir, { recursive: true });

for (const rel of walk(targetDir)) {
  if (/\.(ts|mjs|md|json)$/.test(rel) && fs.readFileSync(rel, "utf8").includes("{{")) {
    fs.writeFileSync(
      rel,
      fs.readFileSync(rel, "utf8")
        .replaceAll("{{NAME}}", nameArg)
        .replaceAll("{{SLUG}}", slug),
    );
  }
}

const pj = JSON.parse(fs.readFileSync(path.join(targetDir, "package.json"), "utf8"));
for (const tgz of fs.readdirSync(path.join(targetDir, "vendor"))) {
  const name = tgz.replace(/^shellside-/, "").replace(/-\d+\.\d+\.\d+\.tgz$/, "");
  pj.dependencies[`@shellside/${name}`] = `file:vendor/${tgz}`;
}
fs.writeFileSync(path.join(targetDir, "package.json"), JSON.stringify(pj, null, 2) + "\n");

console.log(`create-site: ${targetDir} (${nameArg})`);
console.log("  next: npm install && npm run dev");

function* walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) yield* walk(abs);
    else yield abs;
  }
}
