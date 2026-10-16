/**
 * Pure shell parsing helpers for the console engine.
 * No DOM / VFS / command table dependencies.
 */

/**
 * Parse clustered short flags (`-la`, `-alh`) into a set of letters.
 * Ignores bare `-`, long `--…`, and non-flag args.
 */
export function parseShortFlags(args: string[]): Set<string> {
  const flags = new Set<string>();
  for (const a of args) {
    if (!a.startsWith("-") || a === "-" || a.startsWith("--")) continue;
    for (const ch of a.slice(1)) flags.add(ch);
  }
  return flags;
}

/**
 * Parse leading short flags against an allow-list; supports clustered `-inr`.
 * Unknown short clusters and long options fall through to `rest`.
 */
export function parseFlags(
  args: string[],
  allowed: string[],
): { flags: Record<string, boolean>; rest: string[] } {
  const flags: Record<string, boolean> = {};
  for (const k of allowed) flags[k] = false;
  const rest: string[] = [];
  for (const a of args) {
    if (a === "--") {
      rest.push(...args.slice(args.indexOf(a) + 1));
      break;
    }
    if (a.startsWith("-") && a.length > 1 && !a.startsWith("--")) {
      const body = a.slice(1);
      if ([...body].every((c) => allowed.includes(c))) {
        for (const c of body) flags[c] = true;
        continue;
      }
    }
    if (a.startsWith("--")) {
      rest.push(a);
      continue;
    }
    rest.push(a);
  }
  return { flags, rest };
}

/**
 * Split a command line on `|` into trimmed non-empty stage strings.
 * Caller decides whether length < 2 is a parse error.
 */
export function splitPipelineStages(cmd: string): string[] {
  return cmd.split("|").map((s) => s.trim()).filter(Boolean);
}

/** Whitespace tokenize one pipeline stage or simple command fragment. */
export function tokenizeSimple(stage: string): string[] {
  return stage.split(/\s+/).filter(Boolean);
}
