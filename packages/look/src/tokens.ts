/**
 * Design-token contract: a YAML-editable {sizes, colors, fonts} map where
 * every value must be a safe CSS fragment. Site owns the actual values
 * (palette, type scale, font stacks) and the CSS they emit.
 *
 * Pure module — safe for client code. fs I/O is `design-tokens-fs.ts`,
 * exposed at `@shellside/look/fs`.
 */

export type DesignTokens = {
  sizes: Record<string, string>;
  colors: Record<string, string>;
  fonts: Record<string, string>;
};

/** Allowed key names per section — the site's token slot lists. */
export type TokenKeys = {
  sizes: readonly string[];
  colors: readonly string[];
  fonts: readonly string[];
};

export type DesignTokensPartial = {
  sizes?: Record<string, string | undefined>;
  colors?: Record<string, string | undefined>;
  fonts?: Record<string, string | undefined>;
};

/** Safe CSS value: length, clamp(), hex, rgb(), hsl(), or simple keywords. */
export function isSafeCssValue(raw: string): boolean {
  const s = String(raw || "").trim();
  if (!s || s.length > 120) return false;
  if (/[;{}]|\/\*|\*\//.test(s)) return false;
  if (/^(inherit|initial|unset|currentColor)$/i.test(s)) return true;
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return true;
  if (/^rgba?\(/i.test(s) || /^hsla?\(/i.test(s)) return true;
  if (/^clamp\(/i.test(s)) return true;
  if (/^-?[\d.]+(px|rem|em|%|vw|vh|ch|ex)?(\s+[+\-*/]\s+-?[\d.]+(px|rem|em|%|vw|vh)?)?$/.test(s))
    return true;
  if (/^var\(--[a-zA-Z0-9-]+(?:,\s*[^)]+)?\)$/.test(s)) return true;
  if (/^calc\(/i.test(s)) return true;
  return false;
}

/** Font stacks: quoted names, commas, generic families — no braces/semicolons. */
export function isSafeFontStack(raw: string): boolean {
  const s = String(raw || "").trim();
  if (!s || s.length > 220) return false;
  if (/[;{}]|\/\*|\*\//.test(s)) return false;
  if (!/^[\w\s"'.,\-()+\\]+$/i.test(s)) return false;
  return true;
}

/** Merge a parsed YAML root onto the site's defaults; only known keys, only safe values. */
export function mergeTokens(
  raw: unknown,
  defaults: DesignTokens,
  keys: TokenKeys,
): DesignTokens {
  const base: DesignTokens = {
    sizes: { ...defaults.sizes },
    colors: { ...defaults.colors },
    fonts: { ...defaults.fonts },
  };
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<Record<keyof DesignTokens, Record<string, unknown>>>;
  const apply = (
    section: keyof DesignTokens,
    safe: (v: string) => boolean,
  ) => {
    const src = r[section];
    if (!src || typeof src !== "object") return;
    for (const k of keys[section]) {
      const v = src[k];
      if (typeof v === "string" && safe(v)) base[section][k] = v.trim();
    }
  };
  apply("sizes", isSafeCssValue);
  apply("colors", isSafeCssValue);
  apply("fonts", isSafeFontStack);
  return base;
}

/**
 * Validate a partial update against the site's key lists.
 * Throws on an unsafe value; unknown keys are ignored. Returns a cleaned
 * partial ready to merge.
 */
export function validateTokenUpdate(
  partial: DesignTokensPartial,
  keys: TokenKeys,
): DesignTokensPartial {
  const out: DesignTokensPartial = {};
  const clean = (
    section: keyof DesignTokens,
    safe: (v: string) => boolean,
  ) => {
    const src = partial[section];
    if (!src) return;
    const acc: Record<string, string> = {};
    for (const k of keys[section]) {
      const v = src[k];
      if (typeof v !== "string") continue;
      if (!safe(v)) throw new Error(`unsafe ${section} value for ${k}`);
      acc[k] = v.trim();
    }
    (out as Record<string, Record<string, string>>)[section] = acc;
  };
  clean("sizes", isSafeCssValue);
  clean("colors", isSafeCssValue);
  clean("fonts", isSafeFontStack);
  return out;
}

// ── Palette presets (named snapshots of colors + optional sizes) ────────

export type PalettePreset = {
  name: string;
  note?: string;
  savedAt?: string;
  colors: Record<string, string>;
  /** Optional; when omitted, load keeps current sizes. */
  sizes?: Record<string, string>;
};

export type PalettePresetMap = Record<string, Omit<PalettePreset, "name">>;

export function isSafePresetName(raw: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9 _./-]{0,48}$/.test(raw.trim());
}

/** Colors for a preset: defaults + any known, safe overrides. Null when none apply. */
export function normalizePresetColors(
  raw: unknown,
  defaults: Record<string, string>,
  colorKeys: readonly string[],
): Record<string, string> | null {
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Record<string, unknown>;
  const out = { ...defaults };
  let any = false;
  for (const k of colorKeys) {
    const v = src[k];
    if (typeof v === "string" && isSafeCssValue(v)) {
      out[k] = v.trim();
      any = true;
    }
  }
  return any ? out : null;
}

export function normalizePresetSizes(
  raw: unknown,
  defaults: Record<string, string>,
  sizeKeys: readonly string[],
): Record<string, string> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const src = raw as Record<string, unknown>;
  const out = { ...defaults };
  let any = false;
  for (const k of sizeKeys) {
    const v = src[k];
    if (typeof v === "string" && isSafeCssValue(v)) {
      out[k] = v.trim();
      any = true;
    }
  }
  return any ? out : undefined;
}
