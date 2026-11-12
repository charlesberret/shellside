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
     * Dev desk mount — DEV only, never production. When set, the host
     * injects `/api/dev-content` built from `edit.*`. Without
     * `edit` the flag is inert; without the flag `edit` mounts nothing.
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
    /**
     * Optional per-dir overrides for the console VFS. By default the
     * console projects the content tree itself (dirs → dirs, entries →
     * `.txt` files); a spec replaces the tree dir of the same name —
     * use it for renames, `groupBySection`, a different `urlPrefix`,
     * or a collection not under `src/content`.
     */
    collections?: ConsoleCollectionSpec[];
    /** Extra home files from config (e.g. readme.txt). */
    homeFiles?: Record<string, string>;
    /** `help <name>` topics — sites register lore/command docs here. */
    helpTopics?: Record<string, { short?: string; long?: string } | string>;
  };
  /**
   * Dev-desk edit surface — what the DEV-only desk may write
   * (docs/LIVE_EDIT.md). All values are plain data or module paths; the
   * modules are imported by the host only in `astro dev` — production
   * builds never touch them.
   */
  edit?: {
    /**
     * Content root the desk writes under, site-relative.
     * Default `"src/content"`.
     */
    contentRoot?: string;
    /**
     * Plain-data file layout, contentRoot-relative — converted to
     * `EditorFiles` by the host with generated headers. Kinds with no
     * entry are not editable (`isAllowed` → false, writes 400).
     *
     *   work     — directory of per-entry `*.md` (frontmatter + body)
     *   writing  — top-level yaml *list* file, rows keyed by `id`
     *   records  — top-level yaml list file, rows keyed by `id`
     *   profile  — top-level yaml list file; row 0 is the singleton
     *   pageCopy — yaml *mapping* file (page:* paths)
     */
    files?: {
      work?: string;
      writing?: string;
      records?: string;
      profile?: string;
      pageCopy?: string;
    };
    /**
     * Site-relative module exporting the write policy. Expected exports
     * (all optional; types live in `@shellside/dev-api`):
     *
     *   allowlist?: EditAllowlist   — restricts only the kinds it lists;
     *                                 may contain RegExp. A kind present
     *                                 in `files` but absent here is fully
     *                                 writable — list it to restrict.
     *   files?: Partial<EditorFiles> — full form (headers, `archive`
     *                                 resolver); merged over `edit.files`
     *   drafts?: DraftBuilders
     *   profileListJoins?: Record<string, string>
     *   writingLinkKeys?: readonly string[]
     *   archiveKinds?: readonly string[]
     *   coerceVisibility? / coerceWritingYear? — field coercions
     *   editor?: ContentEditor | (() => ContentEditor) — escape hatch:
     *                                 a prebuilt editor skips assembly
     */
    policy?: string;
    /**
     * Site-relative module exporting the look half — `DevLookHandlers`
     * or `() => DevLookHandlers`: `meta`, `pathExtras`, `writeExtras`,
     * `setStyle`, `setTokens`, `palette`, `historyList`/`historyRestore`.
     * Omit for a content-only desk.
     */
    look?: string;
    /**
     * When false (default), the host refuses to mount the dev desk in
     * `astro dev` unless Astro's `server.host` is loopback-only. Set
     * `true` only if you accept exposing the write API on every address
     * the dev server binds to (`server.host: true` and the like).
     */
    allowNonLoopback?: boolean;
  };
};

export function defineShellsiteConfig(config: ShellsiteConfig): ShellsiteConfig {
  return config;
}
