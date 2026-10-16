/**
 * Sync built shellside packages into the marquee's vendor/ directory.
 *
 * The marquee deploy runner cannot resolve `file:../shellside` (it checks out
 * only the marquee repo), so the packages it consumes are vendored under
 * `vendor/shellside/` and referenced as `file:vendor/shellside/<name>`.
 *
 * Usage:
 *   node scripts/sync-marquee-vendor.mjs            # build first, then copy
 *   node scripts/sync-marquee-vendor.mjs --no-build # copy existing dist
 *
 * Source tree: MARQUEE_ROOT, else ../charlesberret.net, else the default path.
 */
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGES = ["content-model", "edit-protocol", "look", "dev-api", "console-vfs", "console-engine"];

const marquee =
  process.env.MARQUEE_ROOT ||
  [path.join(root, "..", "charlesberret.net")]
    .find((p) => fs.existsSync(p));

if (!marquee) {
  console.error("sync-marquee-vendor: marquee checkout not found (set MARQUEE_ROOT)");
  process.exit(1);
}
if (!process.argv.includes("--no-build")) {
  execFileSync("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
}

const destRoot = path.join(marquee, "vendor", "shellside");
const sha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();

function treeHash(dir) {
  const h = crypto.createHash("sha256");
  const walk = (d, rel) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const r = rel ? `${rel}/${ent.name}` : ent.name;
      if (ent.isDirectory()) walk(path.join(d, ent.name), r);
      else h.update(r).update(fs.readFileSync(path.join(d, ent.name)));
    }
  };
  walk(dir, "");
  return h.digest("hex");
}

const manifest = { shellside: sha, packages: {} };
for (const name of PACKAGES) {
  const src = path.join(root, "packages", name);
  const dist = path.join(src, "dist");
  if (!fs.existsSync(dist)) {
    console.error(`sync-marquee-vendor: missing ${dist} — run npm run build`);
    process.exit(1);
  }
  const dest = path.join(destRoot, name);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(dist, path.join(dest, "dist"), { recursive: true });
  const pkg = JSON.parse(fs.readFileSync(path.join(src, "package.json"), "utf8"));
  for (const [dep, range] of Object.entries(pkg.dependencies ?? {})) {
    if (dep.startsWith("@shellside/")) pkg.dependencies[dep] = `file:../${dep.split("/")[1]}`;
    void range;
  }
  fs.writeFileSync(path.join(dest, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
  manifest.packages[name] = { version: pkg.version, dist: treeHash(dist) };
}
fs.writeFileSync(path.join(destRoot, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`sync-marquee-vendor: ${PACKAGES.length} packages → ${destRoot} (shellside ${sha.slice(0, 7)})`);
