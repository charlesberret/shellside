/**
 * Keep a Changelog structure gate for CHANGELOG.md:
 * - each ### heading appears at most once per ## section
 * - semver release sections have a [version]: url reference at the file bottom
 * - list items must live under a ### subsection (intro prose only above headings)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SECTION_HEADING = /^## \[(.+?)\]/;
const SUBSECTION_HEADING = /^### (.+)$/;
const VERSION = /^\d+\.\d+\.\d+$/;
const LINK_REF = /^\[(\d+\.\d+\.\d+)\]:\s+\S+/;

/**
 * @param {string} text
 * @param {{ file?: string }} [opts]
 * @returns {string[]}
 */
export function lintChangelog(text, { file = "CHANGELOG.md" } = {}) {
  const errors = [];
  const lines = text.split(/\r?\n/);

  let section = null;
  const subsectionsSeen = new Set();
  let inSubsection = false;
  const versions = new Set();

  const enterSection = (title, lineNo) => {
    section = { title, lineNo };
    subsectionsSeen.clear();
    inSubsection = false;
    if (title !== "Unreleased" && VERSION.test(title)) {
      versions.add(title);
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;

    const sectionMatch = line.match(SECTION_HEADING);
    if (sectionMatch) {
      enterSection(sectionMatch[1], lineNo);
      continue;
    }

    if (!section) continue;

    const subMatch = line.match(SUBSECTION_HEADING);
    if (subMatch) {
      const name = subMatch[1];
      if (subsectionsSeen.has(name)) {
        errors.push(
          `${file}:${lineNo}: duplicate ### ${name} in section [${section.title}]`,
        );
      }
      subsectionsSeen.add(name);
      inSubsection = true;
      continue;
    }

    if (line.startsWith("- ") && !inSubsection) {
      errors.push(
        `${file}:${lineNo}: list entry without a ### heading in section [${section.title}]`,
      );
    }
  }

  const linkRefs = new Set();
  for (const line of lines) {
    const m = line.match(LINK_REF);
    if (m) linkRefs.add(m[1]);
  }

  for (const version of versions) {
    if (!linkRefs.has(version)) {
      errors.push(`${file}: missing link reference for [${version}]`);
    }
  }

  return errors;
}

/**
 * @param {string} [changelogPath]
 * @returns {string[]}
 */
export function checkChangelogFile(changelogPath = path.join(root, "CHANGELOG.md")) {
  const text = fs.readFileSync(changelogPath, "utf8");
  const rel = path.relative(root, changelogPath) || "CHANGELOG.md";
  return lintChangelog(text, { file: rel });
}

const isMain =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const target = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : path.join(root, "CHANGELOG.md");
  const errors = checkChangelogFile(target);
  if (errors.length) {
    console.error("check-changelog: FAILED");
    for (const err of errors) console.error(`  ${err}`);
    process.exit(1);
  }
  console.log("check-changelog: ok");
}
