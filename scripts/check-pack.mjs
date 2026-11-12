/**
 * npm pack dry-run lint for all @shellside/* workspace packages.
 * Run after `npm run build` so dist/ is present in each tarball.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const PACKAGES = [
  "content-model",
  "look",
  "edit-protocol",
  "dev-api",
  "console-vfs",
  "console-engine",
  "site",
];

const REQUIRED_PATHS = ["LICENSE", "README.md", "dist/index.js"];

function fail(message) {
  throw new Error(message);
}

for (const dir of PACKAGES) {
  const pkgRoot = path.join(root, "packages", dir);
  const manifest = JSON.parse(
    readFileSync(path.join(pkgRoot, "package.json"), "utf8"),
  );

  if (!manifest.license) fail(`${manifest.name}: missing license`);
  if (!manifest.description) fail(`${manifest.name}: missing description`);
  if (!manifest.repository) fail(`${manifest.name}: missing repository`);

  const repo = manifest.repository;
  if (typeof repo !== "object" || repo === null) {
    fail(`${manifest.name}: repository must be an object`);
  }
  if (repo.type !== "git") {
    fail(`${manifest.name}: repository.type must be "git"`);
  }
  if (!String(repo.url).includes("github.com/charlesberret/shellside")) {
    fail(`${manifest.name}: repository.url must point at charlesberret/shellside`);
  }
  if (repo.directory !== `packages/${dir}`) {
    fail(`${manifest.name}: repository.directory must be packages/${dir}`);
  }

  const pack = spawnSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: pkgRoot,
    encoding: "utf8",
  });
  if (pack.status !== 0) {
    fail(`${manifest.name}: npm pack failed\n${pack.stderr || pack.stdout}`);
  }

  const entry = JSON.parse(pack.stdout.trim())[0];
  const paths = new Set(entry.files.map((f) => f.path));

  for (const need of REQUIRED_PATHS) {
    if (!paths.has(need)) {
      fail(`${manifest.name}: pack tarball missing ${need}`);
    }
  }

  if (dir === "site") {
    const hasPages = [...paths].some((p) => p.startsWith("pages/"));
    const hasComponents = [...paths].some((p) => p.startsWith("components/"));
    if (!hasPages) fail(`${manifest.name}: pack tarball missing pages/`);
    if (!hasComponents) fail(`${manifest.name}: pack tarball missing components/`);
  }

  console.log(`check-pack: ${manifest.name} ok (${entry.entryCount} files)`);
}

console.log("check-pack: ok");
