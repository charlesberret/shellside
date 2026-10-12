/**
 * Normalize a Look field-style map and fold legacy path keys into roles.
 *
 * Filesystem load/save is `createFieldStyles` in `@shellside/look/fs`.
 * CSS, palette values, and role labels stay with the site.
 *
 * On-disk names follow the marquee `field-styles.yaml` header. They are
 * wider than the editor lists in `options.ts` (`LEADING_OPTIONS` is
 * normal|body; `CASE_OPTIONS` is none|upper|lower). This module accepts
 * both. `upper` and `lower` are stored as `uppercase` and `lowercase`.
 */
import { FONT_KEYS, SIZE_KEYS } from "./options.js";
import {
  pathToLookRole,
  type FieldStyle,
  type FieldStyleEntry,
  type FieldStyleMap,
} from "./roles.js";
import { WEIGHT_KEYS } from "./weights.js";

export type LookSkin = "portfolio" | "console";

/** Line-height names accepted in field-styles.yaml. */
export const FIELD_STYLE_LEADING_KEYS = [
  "tight",
  "snug",
  "normal",
  "body",
  "prose",
  "loose",
  "airy",
] as const;

/** Text-transform names accepted in field-styles.yaml. */
export const FIELD_STYLE_CASE_KEYS = [
  "none",
  "uppercase",
  "lowercase",
  "capitalize",
] as const;

const CASE_ALIAS: Record<string, (typeof FIELD_STYLE_CASE_KEYS)[number]> = {
  upper: "uppercase",
  lower: "lowercase",
};

export type NormalizeStyleOptions = {
  /** Palette token names. `#rgb` and `#rrggbb` are always accepted. */
  colorKeys?: readonly string[];
};

export function isLookSkin(raw: unknown): raw is LookSkin {
  return raw === "portfolio" || raw === "console";
}

/** Role ids and legacy path keys. Rejects quotes, slashes, and spaces. */
export function isSafeRoleKey(raw: string): boolean {
  return /^[a-zA-Z0-9_.:-]{1,200}$/.test(raw);
}

function styleIsEmpty(style: FieldStyle): boolean {
  return (
    !style.size &&
    !style.color &&
    !style.font &&
    !style.weight &&
    !style.leading &&
    !style.case
  );
}

/**
 * Palette token name, or a `#rgb` / `#rrggbb` tone expanded to `#rrggbb`.
 * Anything else is dropped so a style value cannot carry a payload.
 */
export function normalizeLookColor(
  raw: string,
  colorKeys: readonly string[] = [],
): string | null {
  const s = String(raw || "").trim();
  if (!s || s === "inherit") return null;
  if (colorKeys.includes(s)) return s;
  const m3 = s.match(/^#([0-9a-f]{3})$/i);
  if (m3) {
    const h = m3[1];
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
  }
  const m6 = s.match(/^#([0-9a-f]{6})$/i);
  if (m6) return `#${m6[1].toLowerCase()}`;
  return null;
}

function namedSlot(raw: unknown, allowed: readonly string[]): string | undefined {
  if (typeof raw !== "string" || !raw || raw === "inherit") return undefined;
  return allowed.includes(raw) ? raw : undefined;
}

export function normalizeStyle(
  raw: unknown,
  options: NormalizeStyleOptions = {},
): FieldStyle | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: FieldStyle = {};
  const size = namedSlot(o.size, SIZE_KEYS);
  const font = namedSlot(o.font, FONT_KEYS);
  const weight = namedSlot(o.weight, WEIGHT_KEYS);
  const leading = namedSlot(o.leading, FIELD_STYLE_LEADING_KEYS);
  if (size) out.size = size;
  if (font) out.font = font;
  if (weight) out.weight = weight;
  if (leading) out.leading = leading;
  if (typeof o.color === "string") {
    const color = normalizeLookColor(o.color, options.colorKeys ?? []);
    if (color) out.color = color;
  }
  if (typeof o.case === "string" && o.case && o.case !== "inherit") {
    const canon = CASE_ALIAS[o.case] ?? o.case;
    if ((FIELD_STYLE_CASE_KEYS as readonly string[]).includes(canon)) out.case = canon;
  }
  if (styleIsEmpty(out)) return null;
  return out;
}

/**
 * Dual-skin entry. A flat `{ size, color, … }` is portfolio only.
 * Nested `portfolio` wins over flat keys when both are present.
 */
export function normalizeEntry(
  raw: unknown,
  options: NormalizeStyleOptions = {},
): FieldStyleEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const portfolioNested = normalizeStyle(o.portfolio, options);
  const consoleNested = normalizeStyle(o.console, options);
  const flat = normalizeStyle(
    {
      size: o.size,
      color: o.color,
      font: o.font,
      weight: o.weight,
      leading: o.leading,
      case: o.case,
    },
    options,
  );
  const entry: FieldStyleEntry = {};
  if (portfolioNested) entry.portfolio = portfolioNested;
  else if (flat) entry.portfolio = flat;
  if (consoleNested) entry.console = consoleNested;
  if (!entry.portfolio && !entry.console) return null;
  return entry;
}

/** One skin. Console does not inherit portfolio. */
export function styleForSkin(
  entry: FieldStyleEntry | null | undefined,
  skin: LookSkin,
): FieldStyle | null {
  if (!entry) return null;
  if (skin === "console") return entry.console ?? null;
  return entry.portfolio ?? null;
}

/** `over` wins on each key. An empty result is null. */
export function mergeStyles(
  base: FieldStyle | null,
  over: FieldStyle | null,
): FieldStyle | null {
  if (!base && !over) return null;
  const out: FieldStyle = { ...(base ?? {}), ...(over ?? {}) };
  if (styleIsEmpty(out)) return null;
  return out;
}

/**
 * Normalize a parsed YAML root. Preferred shape is `{ roles: { … } }`.
 * Legacy path keys fold through `pathToLookRole`. Later keys win per skin.
 */
export function parseFieldStylesRoot(
  raw: unknown,
  options: NormalizeStyleOptions = {},
): FieldStyleMap {
  if (!raw || typeof raw !== "object") return {};
  const root = raw as Record<string, unknown>;
  const bag =
    root.roles && typeof root.roles === "object"
      ? (root.roles as Record<string, unknown>)
      : root;
  const out: FieldStyleMap = {};
  for (const [key, value] of Object.entries(bag)) {
    if (key === "roles") continue;
    if (!isSafeRoleKey(key)) continue;
    const entry = normalizeEntry(value, options);
    if (!entry) continue;
    const role = pathToLookRole(key);
    if (!isSafeRoleKey(role)) continue;
    const prev = out[role];
    if (!prev) {
      out[role] = entry;
      continue;
    }
    const portfolio = mergeStyles(prev.portfolio ?? null, entry.portfolio ?? null);
    const consoleStyle = mergeStyles(prev.console ?? null, entry.console ?? null);
    const merged: FieldStyleEntry = {};
    if (portfolio) merged.portfolio = portfolio;
    if (consoleStyle) merged.console = consoleStyle;
    if (merged.portfolio || merged.console) out[role] = merged;
    else delete out[role];
  }
  return out;
}
