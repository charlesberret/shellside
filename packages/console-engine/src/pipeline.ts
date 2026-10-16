/**
 * Pipeline execution for the console engine.
 * Owns the stage loop only — capture/stdin state stays with the host via callbacks
 * so existing command closures over `pipeStdin` / capture-aware `out` keep working.
 */

import { splitPipelineStages, tokenizeSimple } from "./parse.js";

export type PipelineHost = {
  out: (html: string, cls?: string) => void;
  esc: (s: string) => string;
  isAborted?: () => boolean;
  setPipeStdin: (v: string | null) => void;
  beginCapture: () => void;
  endCapture: () => string;
  resetPipe: () => void;
  cmds: Record<string, (args: string[]) => unknown>;
};

/**
 * Run `cmd` as a `|`-separated pipeline against `cmds`.
 * Intermediate stages capture plain text via beginCapture/endCapture;
 * the last stage paints normally (capture off).
 */
export async function executePipeline(cmd: string, host: PipelineHost): Promise<void> {
  const {
    out,
    esc,
    isAborted = () => false,
    setPipeStdin,
    beginCapture,
    endCapture,
    resetPipe,
    cmds,
  } = host;

  const stages = splitPipelineStages(cmd);
  if (stages.length < 2) {
    out("zsh: parse error near `|`", "red");
    return;
  }

  let stdin: string | null = null;
  try {
    for (let i = 0; i < stages.length; i++) {
      if (isAborted()) return;
      const stage = stages[i];
      const [name, ...args] = tokenizeSimple(stage);
      const fn = cmds[name.toLowerCase()];
      if (!fn) {
        out(
          `zsh: command not found: ${esc(name)}  <span class="muted">- try <span class="amber">help</span></span>`,
          "red",
        );
        return;
      }
      const isLast = i === stages.length - 1;
      setPipeStdin(stdin);
      if (!isLast) beginCapture();
      try {
        await fn.call(cmds, args);
      } finally {
        if (!isLast) {
          stdin = endCapture();
        }
        setPipeStdin(null);
      }
    }
  } catch (e) {
    resetPipe();
    out("internal error: " + esc(String(e)), "red");
  }
}
