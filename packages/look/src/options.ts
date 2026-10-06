/**
 * Editor option lists for Look.
 * Names match marquee token *slots* (`--le-size-*`, font slots).
 * CSS lengths, typeface stacks, and palettes stay site-local.
 */

export const SIZE_KEYS = [
  "2xs",
  "xs",
  "sm",
  "base",
  "md",
  "lg",
  "xl",
  "2xl",
  "3xl",
] as const;

export type SizeKey = (typeof SIZE_KEYS)[number];

export const SIZE_OPTIONS = ["inherit", ...SIZE_KEYS] as const;

/** Font slots. Not typeface names. */
export const FONT_KEYS = ["sans", "mono", "prose", "display"] as const;

export type FontKey = (typeof FONT_KEYS)[number];

export const FONT_OPTIONS = ["inherit", ...FONT_KEYS] as const;

export const LEADING_KEYS = ["normal", "body"] as const;

export type LeadingKey = (typeof LEADING_KEYS)[number];

export const LEADING_OPTIONS = ["inherit", ...LEADING_KEYS] as const;

export const CASE_KEYS = ["none", "upper", "lower"] as const;

export type CaseKey = (typeof CASE_KEYS)[number];

export const CASE_OPTIONS = ["inherit", ...CASE_KEYS] as const;
