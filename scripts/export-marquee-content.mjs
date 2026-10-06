/**
 * Copy a marquee content root into fixtures/marquee-content.
 *
 *   MARQUEE_ROOT=/path/to/charlesberret.net npm run export
 *   node scripts/export-marquee-content.mjs --source ../charlesberret.net
 *   node scripts/export-marquee-content.mjs --optional
 *
 * Source resolution: --source, then MARQUEE_ROOT, then ../charlesberret.net,
 * then ~/cloud/git-projects/charlesberret.net.
 * The content directory is `<source>/src/content`, or `source` itself when
 * that directory already holds collection folders.
 *
 * Private paths are dropped (see redaction.mjs). Output is gitignored.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isRedactedRelativePath, redactionNeedleIn } from "./redaction.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function defaultOutDir() {
  return path.join(root, "fixtures", "marquee-content");
}

export function candidateSources() {
  const home = os.homedir();
  return [
    process.env.MARQUEE_ROOT,
    path.resolve(root, "../charlesberret.net"),
    path.join(home, "cloud", "git-projects", "charlesberret.net"),
  ].filter(Boolean);
}

export function resolveContentDir(source) {
  const withSrc = path.join(source, "src", "content");
  if (fs.existsSync(withSrc)) return withSrc;
  if (
    fs.existsSync(path.join(source, "work")) ||
    fs.existsSync(path.join(source, "writing")) ||
    fs.existsSync(path.join(source, "records"))
  ) {
    return source;
  }
  return null;
}

function walkFiles(dir, base = dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name === ".git" || ent.name === "node_modules") continue;
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walkFiles(abs, base, acc);
    else if (ent.isFile()) acc.push(path.relative(base, abs));
  }
  return acc;
}

function looksBinary(buf) {
  const n = Math.min(buf.length, 8000);
  for (let i = 0; i < n; i++) if (buf[i] === 0) return true;
  return false;
}

/**
 * @returns {{ copied: string[], redacted: string[], missing: boolean }}
 */
export function exportMarqueeContent({ source, out, optional = false }) {
  const resolvedSource = source ?? candidateSources().find((dir) => fs.existsSync(dir));
  if (!resolvedSource || !fs.existsSync(resolvedSource)) {
    if (optional) {
      return { copied: [], redacted: [], missing: true };
    }
    throw new Error(
      "Marquee source not found. Set MARQUEE_ROOT or pass --source. Use --optional to skip.",
    );
  }
  const contentDir = resolveContentDir(resolvedSource);
  if (!contentDir) {
    if (optional) return { copied: [], redacted: [], missing: true };
    throw new Error(`No src/content under ${resolvedSource}`);
  }

  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  const copied = [];
  const redacted = [];
  for (const rel of walkFiles(contentDir)) {
    const relPosix = rel.split(path.sep).join("/");
    const from = path.join(contentDir, rel);
    if (isRedactedRelativePath(relPosix)) {
      redacted.push(relPosix);
      continue;
    }
    const buf = fs.readFileSync(from);
    if (!looksBinary(buf)) {
      const needle = redactionNeedleIn(buf.toString("utf8"));
      if (needle) {
        redacted.push(`${relPosix} (contains ${needle})`);
        continue;
      }
    }
    const dest = path.join(out, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    copied.push(relPosix);
  }
  return { copied, redacted, missing: false };
}

function argValue(argv, name) {
  const i = argv.indexOf(name);
  if (i === -1) return undefined;
  return argv[i + 1];
}

function isCli() {
  const entry = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return entry === fileURLToPath(import.meta.url);
}

if (isCli()) {
  const argv = process.argv.slice(2);
  const optional = argv.includes("--optional");
  try {
    const result = exportMarqueeContent({
      source: argValue(argv, "--source"),
      out: argValue(argv, "--out") ?? defaultOutDir(),
      optional,
    });
    if (result.missing) {
      console.log("export-marquee-content: source absent, skipped");
    } else {
      console.log(
        `export-marquee-content: copied ${result.copied.length}, redacted ${result.redacted.length}`,
      );
      for (const rel of result.redacted) console.log(`  redacted ${rel}`);
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
