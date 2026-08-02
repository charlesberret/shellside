/**
 * Canonical Look role ids (semantic, site-wide).
 * Path → role mapping is site-extendable; these are the kit defaults.
 */
export const LOOK_ROLE_IDS = [
  "site-name",
  "hero-tagline",
  "page-kicker",
  "page-title",
  "page-sub",
  "section-heading",
  "item-title",
  "item-meta",
  "item-summary",
  "item-note",
  "item-body",
  "link-label",
  "link-desc",
  "link-href",
  "caption",
  "nav-label",
  "contact-copy",
] as const;

export type LookRoleId = (typeof LOOK_ROLE_IDS)[number];

export type FieldStyle = {
  size?: string;
  color?: string;
  font?: string;
  weight?: string;
};

export type FieldStyleEntry = {
  portfolio?: FieldStyle;
  console?: FieldStyle;
};

/** role id → skins */
export type FieldStyleMap = Record<string, FieldStyleEntry>;

/**
 * Default path → role mapping (subset). Sites may wrap/extend.
 * Keep in sync with marquee `look-roles.ts` when promoting.
 */
export function pathToLookRole(pathKey: string): string {
  const p = String(pathKey || "");
  if (!p) return p;

  if (p === "profile:name") return "site-name";
  if (p === "profile:tagline") return "hero-tagline";
  if (p.startsWith("page:nav.")) return "nav-label";
  if (p.startsWith("page:contact.")) return "contact-copy";
  if (p.endsWith(".backlink")) return "caption";

  if (p.startsWith("page:")) {
    if (p.endsWith(".kicker")) return "page-kicker";
    if (p.endsWith(".title")) return "page-title";
    if (p.endsWith(".sub")) return "page-sub";
    if (/\.section/i.test(p) || /section[A-Z]/.test(p)) return "section-heading";
  }

  if (/:links\.\d+\.label$/i.test(p)) return "link-label";
  if (/:links\.\d+\.description$/i.test(p)) return "link-desc";
  if (/:links\.\d+\.href$/i.test(p)) return "link-href";

  if (/^(work|writing|record):[^:]+:title$/i.test(p)) return "item-title";
  if (/^writing:[^:]+:note$/i.test(p)) return "item-note";
  if (/^work:[^:]+:body$/i.test(p)) return "item-body";
  if (/^work:[^:]+:tags$/i.test(p)) return "caption";

  if (
    /^work:[^:]+:(kind|org|dates)$/i.test(p) ||
    /^writing:[^:]+:(venue|role|award|year|coauthors)$/i.test(p) ||
    /^record:[^:]+:(type|venue|role|date)$/i.test(p)
  ) {
    return "item-meta";
  }

  if (
    /^(work|writing|record):[^:]+:summary$/i.test(p) ||
    /^writing:[^:]+:(subtitle|description)$/i.test(p)
  ) {
    return "item-summary";
  }

  return p;
}
