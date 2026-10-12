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
  // Profile list rows — one style for all indices (skills.0 == skills.1, …)
  "profile-skills-heading",
  "profile-skills-detail",
  "profile-experience-years",
  "profile-experience-org",
  "profile-experience-role",
  "profile-experience-note",
  "profile-education-year",
  "profile-education-degree",
  "profile-education-where",
  "profile-now-intro",
  "profile-now-title",
  "profile-now-detail",
  "profile-selected-blurb",
] as const;

export type LookRoleId = (typeof LOOK_ROLE_IDS)[number];

export function isLookRoleId(id: string): id is LookRoleId {
  return (LOOK_ROLE_IDS as readonly string[]).includes(id);
}

export type FieldStyle = {
  size?: string;
  color?: string;
  font?: string;
  weight?: string;
  leading?: string;
  case?: string;
};

/**
 * Skin isolation (marquee fix 2026-09-12).
 * Portfolio Look tokens paint the console skin only for these keys — signals
 * that do not change the shell's type scale. Everything else stays
 * portfolio-only; the console owns its own size/font/weight/leading
 * (including the pagehead site name — no per-role size exception).
 */
export const CROSS_SKIN_STYLE_KEYS = ["color", "case"] as const;
export const PORTFOLIO_ONLY_STYLE_KEYS = [
  "size",
  "font",
  "weight",
  "leading",
] as const;

/** Project a portfolio FieldStyle down to what may paint the console skin. */
export function crossSkinStyle(style: FieldStyle | undefined): FieldStyle {
  const out: FieldStyle = {};
  if (!style) return out;
  for (const k of CROSS_SKIN_STYLE_KEYS) {
    if (style[k]) out[k] = style[k];
  }
  return out;
}

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
  if (p === "profile:shortBio") return "page-sub";
  if (p === "profile:longBio") return "item-body";
  if (/^profile:skills\.\d+\.heading$/i.test(p)) return "profile-skills-heading";
  if (/^profile:skills\.\d+\.detail$/i.test(p)) return "profile-skills-detail";
  if (/^profile:experience\.\d+\.years$/i.test(p)) return "profile-experience-years";
  if (/^profile:experience\.\d+\.org$/i.test(p)) return "profile-experience-org";
  if (/^profile:experience\.\d+\.role$/i.test(p)) return "profile-experience-role";
  if (/^profile:experience\.\d+\.note$/i.test(p)) return "profile-experience-note";
  if (/^profile:education\.\d+\.year$/i.test(p)) return "profile-education-year";
  if (/^profile:education\.\d+\.degree$/i.test(p)) return "profile-education-degree";
  if (/^profile:education\.\d+\.where$/i.test(p)) return "profile-education-where";
  if (p === "profile:now.intro") return "profile-now-intro";
  if (/^profile:now\.projects\.\d+\.title$/i.test(p)) return "profile-now-title";
  if (/^profile:now\.projects\.\d+\.detail$/i.test(p)) return "profile-now-detail";
  if (/^profile:selectedProjects\.\d+\.blurb$/i.test(p)) return "profile-selected-blurb";

  if (p.startsWith("page:nav.")) return "nav-label";
  if (p.startsWith("page:contact.")) return "contact-copy";
  if (p.endsWith(".backlink")) return "caption";
  if (p === "page:portfolio.heroKicker") return "page-kicker";

  if (p.startsWith("page:")) {
    if (p.endsWith(".kicker")) return "page-kicker";
    if (p.endsWith(".title")) return "page-title";
    if (p.endsWith(".sub")) return "page-sub";
    if (
      /\.section/i.test(p) ||
      /section[A-Z]/.test(p) ||
      p.includes("group")
    ) {
      return "section-heading";
    }
    if (/plaintext|completeIndex|readOnSite|fullRecord/i.test(p)) return "caption";
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
    /^writing:[^:]+:(venue|role|award|year|byline|coauthors)$/i.test(p) ||
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
