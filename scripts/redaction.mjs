/**
 * Private paths stripped from a marquee content export and forbidden in dist.
 * Path names, not public words (a project may mention "enigma" in copy).
 */

/** Directory names anywhere under the content root. */
export const REDACTION_DIR_NAMES = [
  "archive",
  "enigma",
  "private",
  "reading-rights",
  "secrets",
];

/** Substrings that must not survive in exported files or in dist. */
export const REDACTION_NEEDLES = [
  "src/content/archive/",
  "reading-rights/",
  "enigma-archive/",
];

export function isRedactedRelativePath(relPosix) {
  const parts = String(relPosix).split("/").filter(Boolean);
  if (parts.some((part) => part === ".env" || part.startsWith(".env."))) return true;
  return parts.some((part) => REDACTION_DIR_NAMES.includes(part));
}

export function redactionNeedleIn(text) {
  return REDACTION_NEEDLES.find((needle) => text.includes(needle)) ?? null;
}
