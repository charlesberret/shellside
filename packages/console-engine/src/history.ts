/**
 * Command history for the console engine — a ring with draft preservation.
 * Up recalls older entries, Down walks forward and restores the in-progress line.
 */

export type History = {
  push: (cmd: string) => void;
  /** Older entry relative to cursor; null at the start. */
  back: (current: string) => string | null;
  /** Newer entry; returns the saved draft when stepping past the newest. */
  forward: () => string | null;
  /** Back to "typing" state (after a run or programmatic clear). */
  reset: () => void;
  size: () => number;
};

export function createHistory(limit = 200): History {
  const entries: string[] = [];
  let cursor = -1; // -1 = not navigating
  let draft = "";

  return {
    push(cmd) {
      const t = cmd.trim();
      if (!t) return;
      if (entries[entries.length - 1] !== t) entries.push(t);
      if (entries.length > limit) entries.shift();
      cursor = -1;
      draft = "";
    },
    back(current) {
      if (!entries.length) return null;
      if (cursor === -1) {
        draft = current;
        cursor = entries.length - 1;
      } else if (cursor > 0) {
        cursor--;
      } else {
        return null;
      }
      return entries[cursor];
    },
    forward() {
      if (cursor === -1) return null;
      if (cursor < entries.length - 1) {
        cursor++;
        return entries[cursor];
      }
      cursor = -1;
      return draft;
    },
    reset() {
      cursor = -1;
    },
    size: () => entries.length,
  };
}
