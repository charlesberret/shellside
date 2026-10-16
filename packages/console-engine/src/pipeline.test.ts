import assert from "node:assert/strict";
import { executePipeline } from "./pipeline.js";
import { createRunner, registerCommands } from "./runner.js";

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function makePipeHost() {
  let captureMode = false;
  /** @type {string[]} */
  let chunks = [];
  let pipeStdin = null;
  /** @type {string[]} */
  const painted = [];

  const out = (html, cls) => {
    if (captureMode) {
      chunks.push(String(html ?? "").replace(/<[^>]+>/g, ""));
      return;
    }
    painted.push(cls ? `[${cls}]${html}` : html);
  };

  return {
    painted,
    getStdin: () => pipeStdin,
    host: {
      out,
      esc,
      isAborted: () => false,
      setPipeStdin: (v) => {
        pipeStdin = v;
      },
      beginCapture: () => {
        captureMode = true;
        chunks = [];
      },
      endCapture: () => {
        const text = chunks.join("\n");
        captureMode = false;
        chunks = [];
        return text;
      },
      resetPipe: () => {
        captureMode = false;
        chunks = [];
        pipeStdin = null;
      },
      cmds: {},
    },
  };
}

{
  const { painted, host, getStdin } = makePipeHost();
  host.cmds = {
    echo(args) {
      host.out(esc(args.join(" ")));
    },
    upper() {
      const src = getStdin() || "";
      host.out(esc(src.toUpperCase()));
    },
  };
  await executePipeline("echo hello world | upper", host);
  assert.equal(painted.length, 1);
  assert.match(painted[0], /HELLO WORLD/);
  console.log("ok: pipeline echo|upper");
}

{
  const { painted, host } = makePipeHost();
  host.cmds = { echo(args) { host.out(esc(args.join(" "))); } };
  await executePipeline("echo alone |", host);
  // "echo alone |" → stages ["echo alone"] after filter → length < 2 → parse error
  assert.ok(painted.some((p) => p.includes("parse error")));
  console.log("ok: pipeline parse error");
}

{
  const { painted, host } = makePipeHost();
  host.cmds = { echo(args) { host.out(esc(args.join(" "))); } };
  await executePipeline("echo hi | missing", host);
  assert.ok(painted.some((p) => p.includes("command not found")));
  console.log("ok: pipeline unknown command");
}

{
  let busy = false;
  let epoch = 0;
  /** @type {string[]} */
  const lines = [];
  /** @type {string[]} */
  const hist = [];
  let pipeStdin = null;
  let captureMode = false;
  /** @type {string[]} */
  let chunks = [];

  const out = (html, cls) => {
    if (captureMode) {
      chunks.push(String(html ?? "").replace(/<[^>]+>/g, ""));
      return;
    }
    lines.push(cls ? `[${cls}]${html}` : html);
  };

  const cmds = {
    pwd() {
      out("~");
    },
    echo(args) {
      out(esc(args.join(" ")));
    },
  };

  const { run } = createRunner({
    isBusy: () => busy,
    setBusy: (v) => {
      busy = v;
    },
    bumpEpoch: () => {
      epoch += 1;
      return epoch;
    },
    abortedEpoch: (e) => e !== epoch,
    sleep: async () => {},
    out,
    promptHtml: () => '<span class="prompt">%</span>',
    esc,
    closeLess: () => {},
    clearCompletions: () => {},
    scrollToPrompt: () => {},
    pushHistory: (cmd) => {
      hist.push(cmd);
    },
    isAutoplaying: () => false,
    prefersReducedMotion: () => true,
    cmds,
    setPipeStdin: (v) => {
      pipeStdin = v;
    },
    beginCapture: () => {
      captureMode = true;
      chunks = [];
    },
    endCapture: () => {
      const t = chunks.join("\n");
      captureMode = false;
      chunks = [];
      return t;
    },
    resetPipe: () => {
      captureMode = false;
      pipeStdin = null;
      chunks = [];
    },
  });

  await run("pwd", { delay: 0 });
  assert.ok(lines.some((l) => l.includes("[echo]")));
  assert.ok(lines.some((l) => l === "~" || l.endsWith("~")));
  assert.deepEqual(hist, ["pwd"]);

  await run("whoami", { auto: true, delay: 0 });
  assert.ok(lines.some((l) => l.includes("command not found")));
  assert.deepEqual(hist, ["pwd"]); // auto must not pollute

  const merged = registerCommands({ a() {} }, { b() {} });
  assert.ok(typeof merged.a === "function" && typeof merged.b === "function");
  console.log("ok: createRunner history isolation + registerCommands");
}

console.log("pipeline.test.mjs: all checks passed.");
