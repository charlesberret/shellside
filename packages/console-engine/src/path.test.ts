#!/usr/bin/env node
/**
 * Unit checks for console VFS path helpers (Phase M0).
 *
 *   node src/lib/console-engine/path.test.mjs
 */
import {
  DEFAULT_HOME,
  applyPathAliases,
  nodeAt,
  normalizeSegments,
  prettyPath,
  resolve,
  resolvePath,
} from "./path.js";

const HOME = DEFAULT_HOME;
let failures = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failures++;
  }
}

function assertEqual(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    console.error(`FAIL: ${msg}\n  expected: ${e}\n  actual:   ${a}`);
    failures++;
  }
}

const FS = {
  t: "d",
  children: {
    "~": {
      t: "d",
      children: {
        projects: {
          t: "d",
          children: {
            "alpha.txt": { t: "f", body: "a" },
          },
        },
        writing: {
          t: "d",
          children: {
            "post.md": { t: "f", body: "w" },
          },
        },
        "about.txt": { t: "f", body: "about" },
      },
    },
  },
};

// prettyPath
assertEqual(prettyPath([]), "/", "prettyPath root");
assertEqual(prettyPath(["~", "projects"]), "~/projects", "prettyPath join");

// normalizeSegments
assertEqual(normalizeSegments(["~", ".", "projects", "", "x"]), ["~", "projects", "x"], "normalize skips . and empty");
assertEqual(normalizeSegments(["~", "projects", "..", "writing"]), ["~", "writing"], "normalize ..");

// applyPathAliases
const SITE_ALIASES = { "~/work": "~/projects" };
assertEqual(applyPathAliases(["~", "work", "foo"], SITE_ALIASES), ["~", "projects", "foo"], "work → projects alias");

// resolve
assertEqual(resolve(["~", "projects"], HOME, undefined), ["~", "projects"], "resolve no arg → cwd");
assertEqual(resolve(["~", "projects"], HOME, "~"), ["~"], "resolve ~");
assertEqual(resolve(["~", "projects"], HOME, "/"), [], "resolve /");
assertEqual(resolve(["~", "projects"], HOME, "~/writing"), ["~", "writing"], "resolve ~/…");
assertEqual(resolve(["~", "projects"], HOME, "alpha.txt"), ["~", "projects", "alpha.txt"], "resolve relative");
assertEqual(resolve(["~", "projects"], HOME, ".."), ["~"], "resolve ..");
assertEqual(resolve(["~", "projects"], HOME, "~/work/alpha.txt", SITE_ALIASES), ["~", "projects", "alpha.txt"], "resolve ~/work alias");

// nodeAt
assert(nodeAt(FS, ["~"])?.t === "d", "nodeAt home dir");
assertEqual(nodeAt(FS, ["~", "projects", "alpha.txt"])?.t, "f", "nodeAt file");
assertEqual(nodeAt(FS, ["~", "nope"]), null, "nodeAt missing");

// resolvePath — home fallback for bare relative names
const cwdWriting = ["~", "writing"];
assertEqual(
  resolvePath(cwdWriting, HOME, FS, "projects/alpha.txt"),
  ["~", "projects", "alpha.txt"],
  "resolvePath falls back to ~/ for missing relative path",
);
assertEqual(
  resolvePath(cwdWriting, HOME, FS, "post.md"),
  ["~", "writing", "post.md"],
  "resolvePath keeps cwd hit",
);
assertEqual(
  resolvePath(cwdWriting, HOME, FS, "./post.md"),
  ["~", "writing", "post.md"],
  "resolvePath dot-relative skips home fallback",
);
assertEqual(
  resolvePath(cwdWriting, HOME, FS, "~/projects"),
  ["~", "projects"],
  "resolvePath explicit ~ path",
);

if (failures) {
  console.error(`\n${failures} assertion(s) failed.`);
  process.exit(1);
}

console.log("path.test.mjs: all checks passed.");
