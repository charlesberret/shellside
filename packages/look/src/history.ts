/**
 * Look history contract. The fs implementation is `createLookHistory` in `@shellside/look/fs`.
 *
 * Layout (gitignored at site root):
 *   .look-history/field-styles/previous.yaml
 *   .look-history/field-styles/YYYY-MM-DD.yaml
 */

export type LookSnapshotMeta = {
  id: string;
  label: string;
  mtime: string;
  bytes: number;
};

export const LOOK_HISTORY_RETAIN_DAYS = 30;

export function isSafeLookSnapshotId(id: string): boolean {
  return id === "previous" || /^\d{4}-\d{2}-\d{2}$/.test(id);
}

export function localDateISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
