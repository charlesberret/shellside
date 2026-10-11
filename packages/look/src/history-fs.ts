/**
 * Look history over the filesystem, with injected roots.
 *
 * Snapshots `<contentRoot>/field-styles.yaml` before each write:
 *   <historyDir>/previous.yaml   — state before the last write
 *   <historyDir>/YYYY-MM-DD.yaml — state before the first write of that day
 *
 * Rollback restores a full Look map (not a single role). Node-only: import
 * from `@shellside/look/fs`, never from client code.
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import {
  LOOK_HISTORY_RETAIN_DAYS,
  isSafeLookSnapshotId,
  localDateISO,
  type LookSnapshotMeta,
} from "./history.js";

export type LookHistoryOptions = {
  /** Directory holding `field-styles.yaml`. */
  contentRoot: string;
  /** Snapshot directory. Default: `<contentRoot>/../../.look-history/field-styles`. */
  historyDir?: string;
  /** Daily snapshots older than this are pruned. */
  retainDays?: number;
  /** Clock, for tests. */
  now?: () => Date;
};

export type LookHistory = {
  fieldStylesPath: string;
  historyDir: string;
  snapshotBeforeWrite(): Promise<void>;
  list(): Promise<LookSnapshotMeta[]>;
  restore(id: string): Promise<{ id: string; bytes: number }>;
};

const DAILY = /^\d{4}-\d{2}-\d{2}\.yaml$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function sha256(text: string): string {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

async function readOrNull(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return null;
  }
}

export function createLookHistory(options: LookHistoryOptions): LookHistory {
  const fieldStylesPath = path.join(options.contentRoot, "field-styles.yaml");
  const historyDir =
    options.historyDir ??
    path.join(options.contentRoot, "..", "..", ".look-history", "field-styles");
  const retainDays = options.retainDays ?? LOOK_HISTORY_RETAIN_DAYS;
  const now = options.now ?? (() => new Date());

  async function prune(): Promise<void> {
    const cutoff = now().getTime() - retainDays * DAY_MS;
    for (const name of await fs.readdir(historyDir).catch(() => [] as string[])) {
      if (!DAILY.test(name)) continue;
      const full = path.join(historyDir, name);
      const st = await fs.stat(full).catch(() => null);
      if (st && st.mtimeMs < cutoff) await fs.unlink(full).catch(() => {});
    }
  }

  async function snapshotBeforeWrite(): Promise<void> {
    const current = await readOrNull(fieldStylesPath);
    if (current == null) return;
    await fs.mkdir(historyDir, { recursive: true });

    const dailyPath = path.join(historyDir, `${localDateISO(now())}.yaml`);
    if ((await readOrNull(dailyPath)) == null) await fs.writeFile(dailyPath, current, "utf8");

    const prevPath = path.join(historyDir, "previous.yaml");
    const prev = await readOrNull(prevPath);
    if (prev == null || sha256(prev) !== sha256(current)) {
      await fs.writeFile(prevPath, current, "utf8");
    }
    await prune();
  }

  async function list(): Promise<LookSnapshotMeta[]> {
    const out: LookSnapshotMeta[] = [];
    for (const name of await fs.readdir(historyDir).catch(() => [] as string[])) {
      if (name !== "previous.yaml" && !DAILY.test(name)) continue;
      const id = name.replace(/\.yaml$/, "");
      if (!isSafeLookSnapshotId(id)) continue;
      const st = await fs.stat(path.join(historyDir, name)).catch(() => null);
      if (!st) continue;
      out.push({
        id,
        label: id === "previous" ? "Previous (before last Look save)" : `Daily · ${id}`,
        mtime: st.mtime.toISOString(),
        bytes: st.size,
      });
    }
    return out.sort((a, b) =>
      a.id === "previous" ? -1 : b.id === "previous" ? 1 : b.id.localeCompare(a.id),
    );
  }

  /** Snapshots the live map first, so a restore is itself undoable via `previous`. */
  async function restore(id: string): Promise<{ id: string; bytes: number }> {
    if (!isSafeLookSnapshotId(id)) throw new Error("bad snapshot id");
    const body = await readOrNull(path.join(historyDir, `${id}.yaml`));
    if (body == null) throw new Error("snapshot not found");
    if (!body.trim()) throw new Error("snapshot empty");
    await snapshotBeforeWrite();
    await fs.writeFile(fieldStylesPath, body, "utf8");
    return { id, bytes: Buffer.byteLength(body, "utf8") };
  }

  return { fieldStylesPath, historyDir, snapshotBeforeWrite, list, restore };
}
