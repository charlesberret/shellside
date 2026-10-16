#!/usr/bin/env node
/**
 * Unit checks for console parse helpers (Phase M1.0).
 *
 *   node src/lib/console-engine/parse.test.mjs
 */
import {
  parseFlags,
  parseShortFlags,
  splitPipelineStages,
  tokenizeSimple,
} from "./parse.js";

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

function assertSetEqual(actual, expectedArr, msg) {
  const a = [...actual].sort().join(",");
  const e = [...expectedArr].sort().join(",");
  if (a !== e) {
    console.error(`FAIL: ${msg}\n  expected: ${e}\n  actual:   ${a}`);
    failures++;
  }
}

// parseShortFlags
assertSetEqual(parseShortFlags([]), [], "empty args");
assertSetEqual(parseShortFlags(["-l"]), ["l"], "single -l");
assertSetEqual(parseShortFlags(["-la"]), ["a", "l"], "clustered -la");
assertSetEqual(parseShortFlags(["-alh", "projects"]), ["a", "h", "l"], "cluster + path");
assertSetEqual(parseShortFlags(["--long", "-"]), [], "ignores --long and bare -");
assertSetEqual(parseShortFlags(["file.txt", "-r"]), ["r"], "flag after path still collected");

// parseFlags
{
  const { flags, rest } = parseFlags(["-in", "pat", "f.txt"], ["i", "n", "r", "R"]);
  assert(flags.i && flags.n && !flags.r, "parseFlags -in sets i,n");
  assertEqual(rest, ["pat", "f.txt"], "parseFlags rest");
}
{
  const { flags, rest } = parseFlags(["-xyz", "a"], ["i", "n"]);
  assert(!flags.i && !flags.n, "unknown cluster not applied");
  assertEqual(rest, ["-xyz", "a"], "unknown cluster goes to rest");
}
{
  const { flags, rest } = parseFlags(["-i", "--", "-n", "x"], ["i", "n"]);
  assert(flags.i && !flags.n, "parseFlags -- stops flag parse");
  assertEqual(rest, ["-n", "x"], "after -- all positional");
}
{
  const { rest } = parseFlags(["--verbose", "x"], ["v"]);
  assertEqual(rest, ["--verbose", "x"], "long opts to rest");
}

// splitPipelineStages
assertEqual(splitPipelineStages("cat a | grep x"), ["cat a", "grep x"], "two stages");
assertEqual(
  splitPipelineStages("  cat f  |  grep x  | head -n 5 "),
  ["cat f", "grep x", "head -n 5"],
  "trim stages",
);
assertEqual(splitPipelineStages("echo hi |"), ["echo hi"], "trailing pipe drops empty");
assertEqual(splitPipelineStages("|"), [], "bare pipe → empty stages");

// tokenizeSimple
assertEqual(tokenizeSimple("head -n 5"), ["head", "-n", "5"], "tokenize stage");
assertEqual(tokenizeSimple("  ls   -la  "), ["ls", "-la"], "collapse whitespace");

if (failures) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log("ok: console-engine/parse");
