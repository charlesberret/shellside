/**
 * Regenerate apps/demo/src/content/releases.yaml from CHANGELOG.md and
 * docs.yaml from README.md and all docs/ markdown files.
 *
 *   node scripts/sync-demo-content.mjs          # write
 *   node scripts/sync-demo-content.mjs --check  # exit 1 if out of date
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const demoContent = path.join(root, "apps", "demo", "src", "content");
const releasesPath = path.join(demoContent, "releases.yaml");
const docsPath = path.join(demoContent, "docs.yaml");
const changelogPath = path.join(root, "CHANGELOG.md");
const docsDir = path.join(root, "docs");
const readmePath = path.join(root, "README.md");

const REPO = "https://github.com/charlesberret/shellside";
const check = process.argv.includes("--check");

function kebab(name) {
  return name.replace(/\.[^.]+$/, "").replace(/_/g, "-").toLowerCase();
}

function docIdFromPath(rel) {
  const base = path.basename(rel, ".md");
  const m = /^(\d{4}-\d{2}-\d{2}-)(.+)$/.exec(base);
  if (m) return m[2];
  return kebab(base);
}

function parseMarkdown(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let h1 = "";
  let h2 = "";
  const paragraphs = [];
  let buf = [];
  let inFence = false;
  const flush = () => {
    const p = buf.join(" ").trim();
    if (p) paragraphs.push(p);
    buf = [];
  };
  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      flush();
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^#\s+/.test(line) && !h1) {
      flush();
      h1 = line.replace(/^#\s+/, "").trim();
      continue;
    }
    if (/^##\s+/.test(line) && !h2) {
      flush();
      h2 = line.replace(/^##\s+/, "").trim();
      continue;
    }
    if (/^#+\s/.test(line)) {
      flush();
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    if (/^\*\*Status:\*\*/.test(line) || /^---$/.test(line) || /^\|/.test(line)) {
      flush();
      continue;
    }
    buf.push(line.trim());
  }
  flush();
  return { h1, h2, paragraphs };
}

function docTitle({ h1, h2 }) {
  if (!h1) return "Untitled";
  if (!h2) return h1;
  if (h1.includes("—") || h1.includes(" - ")) return h1;
  const subtitle = h2.replace(/,.*$/, "").toLowerCase();
  return `${h1} — ${subtitle}`;
}

function pickSummary(paragraphs, fallback = "", h2 = "") {
  const skip = (p) =>
    p.startsWith("|") ||
    p.length < 12 ||
    /^[A-Z][a-z]+:\s/.test(p) ||
    /^(\d+\.|\* )/.test(p) ||
    /[┌└├│]/.test(p) ||
    (p.match(/`/g) ?? []).length > 4;
  const p = paragraphs.find((x) => !skip(x));
  if (p) return p.replace(/\s+/g, " ").trim();
  if (h2) return h2.replace(/\*\*/g, "").trim();
  return (fallback || paragraphs[0] || "").replace(/\s+/g, " ").trim();
}

function compareSemver(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}

export function parseChangelogReleases(changelogText) {
  const lines = changelogText.replace(/\r\n/g, "\n").split("\n");
  const footerLinks = new Map();
  for (const line of lines) {
    const lm = /^\[([^\]]+)\]:\s+(\S+)/.exec(line);
    if (lm) footerLinks.set(lm[1], lm[2]);
  }

  const releases = [];
  let i = 0;
  while (i < lines.length) {
    const m = /^## \[(\d+\.\d+\.\d+)\]\s*[—-]\s*(\d{4}-\d{2}-\d{2})/.exec(lines[i]);
    if (!m) {
      i++;
      continue;
    }
    const version = m[1];
    const date = m[2];
    i++;
    const summaryLines = [];
    while (i < lines.length) {
      const line = lines[i];
      if (/^## \[/.test(line) || /^## \[Unreleased\]/.test(line)) break;
      if (/^###\s/.test(line)) break;
      if (/^-\s+\*\*/.test(line)) break;
      if (line.trim() === "") {
        if (summaryLines.length) break;
        i++;
        continue;
      }
      summaryLines.push(line.trim());
      i++;
    }
    let summary = summaryLines.join(" ").replace(/\s+/g, " ").trim();
    if (!summary) {
      summary = `Release ${version}.`;
    }
    const tag = `v${version}`;
    releases.push({
      id: tag.replace(/\./g, "-"),
      title: tag,
      type: "release",
      date,
      summary,
      url: footerLinks.get(version) ?? `${REPO}/releases/tag/${tag}`,
      visibility: "published",
    });
  }
  releases.sort((a, b) => compareSemver(a.title.slice(1), b.title.slice(1)));
  return releases;
}

function walkDocs(dir, base = dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDocs(abs, base, acc);
    else if (ent.isFile() && /\.md$/i.test(ent.name)) {
      acc.push(path.relative(base, abs).replace(/\\/g, "/"));
    }
  }
  return acc;
}

export function buildDocsItems() {
  const items = [];
  if (fs.existsSync(readmePath)) {
    const text = fs.readFileSync(readmePath, "utf8");
    const { h1, paragraphs } = parseMarkdown(text);
    items.push({
      id: "readme",
      title: "README — what shellside is",
      kind: "doc",
      summary:
        "The kit's own front page — contracts over copies, both surfaces, the desk.",
      url: REPO,
      visibility: "published",
    });
  }

  for (const rel of walkDocs(docsDir).sort()) {
    const abs = path.join(docsDir, rel);
    const text = fs.readFileSync(abs, "utf8");
    const { h1, h2, paragraphs } = parseMarkdown(text);
    const inDecisions = rel.startsWith("decisions/");
    items.push({
      id: docIdFromPath(rel),
      title: docTitle({ h1: h1 || kebab(path.basename(rel, ".md")), h2 }),
      kind: inDecisions ? "decision" : "doc",
      summary: pickSummary(paragraphs, "", h2),
      url: `${REPO}/blob/main/docs/${rel}`,
      visibility: "published",
    });
  }

  items.sort((a, b) => {
    if (a.id === "readme") return -1;
    if (b.id === "readme") return 1;
    if (a.kind !== b.kind) {
      if (a.kind === "decision" && b.kind !== "decision") return 1;
      if (b.kind === "decision" && a.kind !== "decision") return -1;
    }
    return a.id.localeCompare(b.id);
  });
  return items;
}

/** Fold long strings like committed hand-edited yaml (not js-yaml dump). */
function formatListFile(title, items, headerComment) {
  const body = { title, items };
  let out = headerComment ? `# ${headerComment}\n` : "";
  out += yaml.dump(body, {
    lineWidth: 78,
    quotingType: "'",
    forceQuotes: true,
    noRefs: true,
  });
  return out;
}

export function generateReleasesYaml() {
  const changelog = fs.readFileSync(changelogPath, "utf8");
  const items = parseChangelogReleases(changelog);
  if (!items.length) throw new Error("No semver releases found in CHANGELOG.md");
  return formatListFile("Releases", items);
}

export function generateDocsYaml() {
  const items = buildDocsItems();
  return formatListFile(
    "Docs",
    items,
    "Generated by scripts/sync-demo-content.mjs — run the script to refresh.",
  );
}

function readUtf8(p) {
  return fs.readFileSync(p, "utf8");
}

function failIfDiff(label, expected, actualPath) {
  const actual = fs.existsSync(actualPath) ? readUtf8(actualPath) : "";
  if (expected !== actual) {
    console.error(`${label}: out of date (run node scripts/sync-demo-content.mjs)`);
    if (check) process.exitCode = 1;
    return false;
  }
  return true;
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const releasesYaml = generateReleasesYaml();
  const docsYaml = generateDocsYaml();

  if (check) {
    failIfDiff("releases.yaml", releasesYaml, releasesPath);
    failIfDiff("docs.yaml", docsYaml, docsPath);
    const changelogVersions = parseChangelogReleases(readUtf8(changelogPath)).map((r) => r.title);
    for (const v of changelogVersions) {
      if (!releasesYaml.includes(v)) {
        console.error(`releases.yaml: missing ${v}`);
        process.exitCode = 1;
      }
    }
    if (process.exitCode) process.exit(process.exitCode);
    console.log(`sync-demo-content: ok (${changelogVersions.length} releases, docs current)`);
  } else {
    fs.writeFileSync(releasesPath, releasesYaml);
    fs.writeFileSync(docsPath, docsYaml);
    const n = parseChangelogReleases(readUtf8(changelogPath)).length;
    const d = buildDocsItems().length;
    console.log(`Wrote ${releasesPath} (${n} releases)`);
    console.log(`Wrote ${docsPath} (${d} docs)`);
  }
}
