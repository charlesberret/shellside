/**
 * Bump the workspace release version: root package.json, every packages/*
 * package.json, and all internal @shellside/* dependency pins.
 *
 * Usage: node scripts/bump-version.mjs <semver>
 * Example: node scripts/bump-version.mjs 0.5.0
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const version = process.argv[2];

const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][\w.-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][\w.-]*))*))?(?:\+([\w.-]+))?$/;

if (!version || !SEMVER.test(version)) {
  console.error("usage: node scripts/bump-version.mjs <semver>");
  process.exit(1);
}

const DEP_KEYS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

function bumpPackageJson(file) {
  const raw = fs.readFileSync(file, "utf8");
  const pkg = JSON.parse(raw);
  const prev = pkg.version;
  pkg.version = version;

  for (const key of DEP_KEYS) {
    const deps = pkg[key];
    if (!deps) continue;
    for (const name of Object.keys(deps)) {
      if (name.startsWith("@shellside/")) {
        deps[name] = version;
      }
    }
  }

  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
  return { name: pkg.name ?? path.basename(path.dirname(file)), prev };
}

const touched = [];

const rootPkg = path.join(root, "package.json");
touched.push({ ...bumpPackageJson(rootPkg), file: "package.json" });

const packagesDir = path.join(root, "packages");
for (const dir of fs.readdirSync(packagesDir).sort()) {
  const file = path.join(packagesDir, dir, "package.json");
  if (!fs.existsSync(file)) continue;
  touched.push({
    ...bumpPackageJson(file),
    file: `packages/${dir}/package.json`,
  });
}

for (const { file, name, prev } of touched) {
  console.log(`${file}: ${prev} → ${version}${name ? ` (${name})` : ""}`);
}
