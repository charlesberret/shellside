/**
 * REPL runner for the console engine.
 * DOM/cmds/intro stay injected via deps.
 */

import { executePipeline } from "./pipeline.js";
import { tokenizeSimple } from "./parse.js";

export type CommandMap = Record<string, (args: string[]) => unknown>;

export type ShellRunnerDeps = {
  isBusy: () => boolean;
  setBusy: (v: boolean) => void;
  /** e.g. win.classList busy */
  setBusyChrome?: (on: boolean) => void;
  /** returns new active epoch */
  bumpEpoch: () => number;
  abortedEpoch: (epoch: number) => boolean;
  sleep: (ms: number) => Promise<void>;
  out: (html: string, cls?: string) => void;
  promptHtml: () => string;
  esc: (s: string) => string;
  closeLess: () => void;
  clearCompletions: () => void;
  scrollToPrompt: () => void;
  pushHistory: (cmd: string) => void;
  log?: (e: { type: string; cmd: string; auto: boolean; [k: string]: unknown }) => void;
  getLogContext?: () => { cwd?: string; depth?: number };
  isAutoplaying?: () => boolean;
  prefersReducedMotion?: () => boolean;
  tryFriendlyBarePath?: (pathArg: string) => boolean;
  cmds: CommandMap | (() => CommandMap);
  setPipeStdin: (v: string | null) => void;
  beginCapture: () => void;
  endCapture: () => string;
  resetPipe: () => void;
};

export type RunOpts = {
  echo?: boolean;
  auto?: boolean;
  recordHistory?: boolean;
  pace?: boolean;
  delay?: number;
};

export function createRunner(deps: ShellRunnerDeps) {
  const resolveCmds = () =>
    typeof deps.cmds === "function" ? deps.cmds() : deps.cmds;

  async function run(raw: string, opts: RunOpts = {}): Promise<void> {
    while (deps.isBusy()) await deps.sleep(24);
    const epoch = deps.bumpEpoch();
    deps.setBusy(true);
    const autoplaying = Boolean(deps.isAutoplaying?.());
    if (!autoplaying) deps.setBusyChrome?.(true);
    try {
      deps.closeLess();
      deps.clearCompletions();
      const cmd = raw.trim();
      if (opts.echo !== false) {
        deps.out(
          `${deps.promptHtml()}<span class="cmdwrap"><span class="cmdtext">${deps.esc(cmd)}</span></span>`,
          "echo",
        );
      }
      if (!cmd) return;
      if (deps.abortedEpoch(epoch)) return;

      const isAuto = Boolean(autoplaying || opts.auto);

      try {
        deps.log?.({
          type: "cmd",
          cmd,
          auto: isAuto,
          ...(deps.getLogContext?.() || {}),
        });
      } catch {
        /* ignore */
      }

      const reduced = Boolean(deps.prefersReducedMotion?.());
      const pace = opts.pace !== false && !reduced;
      if (pace) await deps.sleep(opts.delay ?? 150);
      if (deps.abortedEpoch(epoch)) return;

      if (opts.recordHistory !== false && !isAuto) {
        deps.pushHistory(cmd);
      }

      const cmds = resolveCmds();

      if (cmd.includes("|")) {
        await executePipeline(cmd, {
          out: deps.out,
          esc: deps.esc,
          isAborted: () => deps.abortedEpoch(epoch),
          setPipeStdin: deps.setPipeStdin,
          beginCapture: deps.beginCapture,
          endCapture: deps.endCapture,
          resetPipe: deps.resetPipe,
          cmds,
        });
        return;
      }

      const [name, ...args] = tokenizeSimple(cmd);
      const fn = cmds[name.toLowerCase()];
      if (fn) {
        try {
          await fn.call(cmds, args);
        } catch (e) {
          deps.out("internal error: " + deps.esc(String(e)), "red");
        }
      } else if (args.length === 0 && deps.tryFriendlyBarePath?.(name)) {
        // bare path handled by host
      } else {
        deps.out(
          `zsh: command not found: ${deps.esc(name)}  <span class="muted">- try <span class="amber">help</span>, or a path like <span class="amber">resume.pdf</span> / <span class="amber">about.txt</span></span>`,
          "red",
        );
      }
    } finally {
      deps.setBusy(false);
      deps.setBusyChrome?.(false);
      deps.scrollToPrompt();
    }
  }

  return { run, executePipeline };
}

/**
 * Shallow-merge command tables (engine defaults + site extras).
 * Later maps win on key collision.
 */
export function registerCommands(...maps: CommandMap[]): CommandMap {
  return Object.assign({}, ...maps);
}
