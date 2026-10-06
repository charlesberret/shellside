import type { ContentKind } from "./paths.js";
import { parseContentPath } from "./paths.js";

/**
 * Sites tighten the structural grammar. Omit a field to allow every
 * well-formed path of that dimension.
 */
export type EditPathPolicy = {
  kinds?: readonly ContentKind[];
  /** Tested against the field segment (`title`, `links.0.href`, `projects.kicker`). */
  fields?: readonly RegExp[];
};

export function isAllowedEditPath(raw: string, policy?: EditPathPolicy): boolean {
  const parsed = parseContentPath(raw);
  if (!parsed) return false;
  if (!policy) return true;
  if (policy.kinds && !policy.kinds.includes(parsed.kind)) return false;
  if (policy.fields && !policy.fields.some((re) => re.test(parsed.field))) return false;
  return true;
}
