/**
 * Site-instance contract (docs/decisions/2026-10-16-site-instance-contract.md).
 * Plain data — no imports — so a scaffold can generate it verbatim.
 */

export type CollectionShape =
  /** per-entry markdown dir: `<name>/*.md` */
  | "entries-md"
  /** single yaml list: `<name>.yaml` */
  | "list-yaml"
  /** single yaml data file (not an Astro collection): `<name>.yaml` */
  | "data-yaml";

export type ConsoleCollectionSpec = {
  /** VFS directory under ~ (e.g. "projects"). */
  dir: string;
  /** Collection name in the site's content.config. */
  collection: string;
  /** File extension inside the dir (default "txt"). */
  ext?: string;
  /** Group files into `dir/<section>/<slug>` using entry.data[sectionField]. */
  groupBySection?: boolean;
  /** Field on entry.data used for the section name (default "type"). */
  sectionField?: string;
  /** Page URL prefix for the entry (e.g. "/projects"); emits `url` on nodes. */
  urlPrefix?: string;
};

export type ShellsiteConfig = {
  identity: {
    name: string;
    host?: string;
    tagline?: string;
  };
  /** Astro collection names the site declares and their shapes. */
  collections: Record<string, CollectionShape>;
  /** data-yaml files the host should read directly (cv.yaml etc.). */
  dataFiles?: Record<string, string>;
  surfaces: {
    portfolio?: boolean;
    console?: boolean;
    plaintext?: boolean;
    llmsTxt?: boolean;
    /**
     * Dev desk mount — DEV only, never production.
     * PLANNED (LAB-1519, deferred): injecting the write API needs the site's
     * edit surface (allowlist module, look writers) wired through `edit.*`;
     * until then the desk is site-mounted, as in the marquee's
     * `src/pages/api/dev-content.ts`.
     */
    devDesk?: boolean;
  };
  nav?: { key: string; label: string; href: string; editPath?: string }[];
  theme?: {
    /** Site-owned stylesheets to import. */
    styles?: string[];
    /** Module providing site console lore: extra VFS nodes + commands. */
    consoleLore?: string;
  };
  console?: {
    /** Collection-backed dirs projected into the console VFS. */
    collections?: ConsoleCollectionSpec[];
    /** Extra home files from config (e.g. readme.txt). */
    homeFiles?: Record<string, string>;
    /** `help <name>` topics — sites register lore/command docs here. */
    helpTopics?: Record<string, { short?: string; long?: string } | string>;
  };
  edit?: {
    /** Path to the site's allowlist module. */
    allowlist?: string;
    contentRoot?: string;
  };
};

export function defineShellsiteConfig(config: ShellsiteConfig): ShellsiteConfig {
  return config;
}
