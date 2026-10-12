/**
 * DEV-only content edit core over the filesystem — the machinery behind the
 * editorial desk's writes. Site supplies its collection file layout, field
 * allowlist, join separators, and draft shapes; the kit owns parsing,
 * coercion, YAML/Markdown I/O, and link/tag/draft mechanics.
 *
 * Node-only. Import from `@shellside/dev-api` — never from client code.
 */
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import {
  parseContentPath,
  type ContentKind,
  type ParsedContentPath,
} from "@shellside/edit-protocol";

export type { ParsedContentPath };

export type LinkRecord = {
  label: string;
  href: string;
  description: string;
  kind?: string;
};

export type EditPayload =
  | { editKind: "text"; value: string }
  | { editKind: "tags"; value: string; tags: string[] }
  | {
      editKind: "link";
      value: string;
      link: LinkRecord;
      linkIndex: number;
      linkBasePath: string;
    }
  | { editKind: "links"; value: string; links: LinkRecord[] }
  | { editKind: "writing-link"; value: string; key: string; href: string };

export type DraftKind = "work" | "writing" | "record";

export type CreateDraftOpts = {
  kind: DraftKind;
  title: string;
  workStatus?: "current" | "complete";
  writingType?: string;
  recordSection?: string;
};

export type CreateDraftResult = {
  kind: DraftKind;
  id: string;
  title: string;
  path: string;
  editPath: string;
};

/** A collection stored as one YAML list file addressed by row `id`. */
export type YamlListFile = {
  /** Absolute or contentRoot-relative path, e.g. `writing.yaml`. */
  file: string;
  /** Comment lines written at the top of the file. */
  header: string;
};

export type MarkdownCollectionDir = {
  /** contentRoot-relative directory of `*.md` files with YAML frontmatter. */
  dir: string;
};

export type YamlObjectFile = {
  /** e.g. `page-copy.yaml` — a YAML mapping addressed by field path. */
  file: string;
  header: string;
};

export type ArchiveResolver = (which: string) => YamlListFile | null;

export type EditorFiles = {
  work: MarkdownCollectionDir;
  writing: YamlListFile;
  records: YamlListFile;
  profile: YamlListFile;
  pageCopy: YamlObjectFile;
  archive?: ArchiveResolver;
};

/**
 * Deny-by-default per kind. `true` allows every well-formed field of the
 * kind (same as omitting the key).
 */
export type EditAllowlist = Partial<
  Record<ContentKind, true | readonly (RegExp | string)[]>
>;

export type DraftBuilders = {
  /** Build frontmatter + body for a new work file. */
  work?: (opts: CreateDraftOpts, ctx: { id: string; order: number }) => {
    frontmatter: Record<string, unknown>;
    body: string;
  };
  /** Build a new writing.yaml row. Throw to reject (e.g. bad type). */
  writing?: (opts: CreateDraftOpts, ctx: { id: string }) => Record<string, unknown>;
  /** Build a new records.yaml row. Throw to reject (e.g. bad section). */
  record?: (opts: CreateDraftOpts, ctx: { id: string }) => Record<string, unknown>;
};

export type ContentEditorOptions = {
  /** Content root directory (e.g. `<site>/src/content`). */
  contentRoot: string;
  files: EditorFiles;
  /** Deny-by-default field allowlist per kind. */
  allowlist: EditAllowlist;
  /**
   * Profile fields stored as string arrays but edited as joined text,
   * e.g. `{ funding: "; ", roles: " · ", formerly: ", " }`.
   */
  profileListJoins?: Record<string, string>;
  /** Writing-link keys for the keyed map form (default html/pdf/arxiv/doi). */
  writingLinkKeys?: readonly string[];
  /** Custom visibility coercion. Default accepts draft|published|public|"". */
  coerceVisibility?: (raw: string) => "draft" | "published";
  /** Custom writing-year coercion. Default: 4-digit year or empty→null. */
  coerceWritingYear?: (raw: string) => number | null;
  /**
   * Draft builders. Omit a kind to disable its create-draft. When a builder
   * returns `{ fieldOrder }` entries they are written verbatim.
   */
  drafts?: DraftBuilders;
  /** Optional: restrict archive sub-documents (e.g. `["cv","resume"]`). */
  archiveKinds?: readonly string[];
};

export type ContentEditor = {
  getValue(ref: ParsedContentPath): Promise<unknown>;
  setValue(ref: ParsedContentPath, value: string): Promise<{ path: string; value: string }>;
  getEditPayload(pathParam: string): Promise<EditPayload>;
  setTags(workId: string, tags: string[]): Promise<string[]>;
  setLinkAt(kind: "work" | "record", id: string, index: number, link: LinkRecord): Promise<LinkRecord>;
  addLink(kind: "work" | "record", id: string, link?: Partial<LinkRecord>): Promise<{ index: number; link: LinkRecord }>;
  removeLink(kind: "work" | "record", id: string, index: number): Promise<void>;
  createDraft(opts: CreateDraftOpts): Promise<CreateDraftResult>;
  isAllowed(ref: ParsedContentPath): boolean;
};

const DEFAULT_WRITING_LINK_KEYS = ["html", "pdf", "arxiv", "doi"] as const;

function defaultCoerceVisibility(raw: string): "draft" | "published" {
  const s = String(raw || "").trim().toLowerCase();
  if (s === "draft") return "draft";
  if (s === "published" || s === "public" || s === "") return "published";
  throw new Error('visibility must be "draft" or "published"');
}

function defaultCoerceWritingYear(raw: string): number | null {
  const t = String(raw).trim();
  if (t === "" || t === "-" || t.toLowerCase() === "null") return null;
  if (/^\d{4}$/.test(t)) return Number(t);
  throw new Error("year must be a 4-digit year, or empty to clear");
}

function getByPath(obj: unknown, field: string): unknown {
  const segs = field.split(".");
  let cur: any = obj;
  for (const s of segs) {
    if (cur == null) return undefined;
    cur = cur[s];
  }
  return cur;
}

function setByPath(obj: any, field: string, value: unknown): void {
  const segs = field.split(".");
  let cur = obj;
  for (let i = 0; i < segs.length - 1; i++) {
    const s = segs[i]!;
    if (cur[s] == null || typeof cur[s] !== "object") {
      cur[s] = /^\d+$/.test(segs[i + 1]!) ? [] : {};
    }
    cur = cur[s];
  }
  cur[segs[segs.length - 1]!] = value;
}

const dumpOpts: yaml.DumpOptions = {
  lineWidth: 100,
  noRefs: true,
  quotingType: '"',
  forceQuotes: false,
  sortKeys: false,
};

function slugifyId(title: string): string {
  const base = String(title || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return base || "untitled";
}

function normalizeLink(raw: any): LinkRecord {
  return {
    label: String(raw?.label ?? ""),
    href: String(raw?.href ?? ""),
    description: String(raw?.description ?? ""),
    kind: raw?.kind != null ? String(raw.kind) : undefined,
  };
}

function splitWorkMd(md: string): { fm: any; body: string } {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error("work file missing frontmatter");
  const fm = yaml.load(m[1]!);
  if (!fm || typeof fm !== "object") throw new Error("invalid work frontmatter");
  return { fm, body: m[2] ?? "" };
}

function joinWorkMd(fm: any, body: string): string {
  const dumped = yaml.dump(fm, dumpOpts).replace(/\s+$/, "\n");
  const b = body.replace(/^\n+/, "").replace(/\s+$/, "") + "\n";
  return `---\n${dumped}---\n\n${b}`;
}

export function createContentEditor(opts: ContentEditorOptions): ContentEditor {
  const root = opts.contentRoot;
  const joins = opts.profileListJoins ?? {};
  const writingLinkKeys = new Set(opts.writingLinkKeys ?? DEFAULT_WRITING_LINK_KEYS);
  const coerceVisibility = opts.coerceVisibility ?? defaultCoerceVisibility;
  const coerceWritingYear = opts.coerceWritingYear ?? defaultCoerceWritingYear;
  const drafts = opts.drafts ?? {};

  const abs = (rel: string) => (path.isAbsolute(rel) ? rel : path.join(root, rel));
  const workDir = abs(opts.files.work.dir);

  async function readYamlFile(filePath: string): Promise<unknown> {
    return yaml.load(await fs.readFile(filePath, "utf8"));
  }

  async function writeYamlFile(filePath: string, header: string, data: unknown) {
    await fs.writeFile(filePath, header + yaml.dump(data, dumpOpts), "utf8");
  }

  async function readList(spec: YamlListFile, name: string): Promise<any[]> {
    const docs = await readYamlFile(abs(spec.file));
    if (!Array.isArray(docs)) throw new Error(`${name} invalid`);
    return docs;
  }

  const writeList = (spec: YamlListFile, docs: any[]) =>
    writeYamlFile(abs(spec.file), spec.header, docs);

  async function readWorkMd(id: string): Promise<string> {
    return fs.readFile(path.join(workDir, `${id}.md`), "utf8");
  }

  async function writeWorkMd(id: string, content: string) {
    await fs.writeFile(path.join(workDir, `${id}.md`), content, "utf8");
  }

  function archiveSpec(which: string): YamlListFile {
    if (!opts.files.archive) throw new Error(`no archive collection: ${which}`);
    if (opts.archiveKinds && !opts.archiveKinds.includes(which)) {
      throw new Error(`bad archive kind: ${which}`);
    }
    const spec = opts.files.archive(which);
    if (!spec) throw new Error(`bad archive kind: ${which}`);
    return spec;
  }

  function splitReFor(sep: string): RegExp {
    if (sep.includes(";")) return /;\s*/;
    if (sep.includes("·")) return /\s*·\s*/;
    if (sep.includes(",")) return /,\s*/;
    return new RegExp(sep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  }

  function profileGet(docs: any[], field: string): unknown {
    if (field in joins) {
      const arr = docs[0][field];
      if (!Array.isArray(arr)) return "";
      return arr.join(joins[field]);
    }
    return getByPath(docs[0], field);
  }

  function profileSet(docs: any[], field: string, value: string): void {
    if (field in joins) {
      const sep = joins[field]!;
      const next = value
        .replace(/\.\s*$/, "")
        .split(splitReFor(sep))
        .map((s) => s.trim())
        .filter(Boolean);
      const prev = docs[0][field];
      // An empty save on a list field is usually a stale panel, not intent.
      if (Array.isArray(prev) && prev.length > 0 && next.length === 0 && !value.trim()) {
        throw new Error(`refusing to clear profile.${field} (empty save blocked)`);
      }
      docs[0][field] = next;
      return;
    }
    setByPath(docs[0], field, value);
  }

  function isAllowed(ref: ParsedContentPath): boolean {
    if (ref.kind === "archive" && opts.archiveKinds && !opts.archiveKinds.includes(ref.id)) {
      return false;
    }
    const rule = opts.allowlist[ref.kind];
    if (rule === undefined || rule === true) return true;
    return rule.some((r) => (typeof r === "string" ? r === ref.field : r.test(ref.field)));
  }

  async function getValue(ref: ParsedContentPath): Promise<unknown> {
    if (ref.kind === "profile") return profileGet(await readList(opts.files.profile, "profile"), ref.field);
    if (ref.kind === "page") {
      const raw = await readYamlFile(abs(opts.files.pageCopy.file));
      return getByPath(raw, ref.field);
    }
    if (ref.kind === "archive") {
      const spec = archiveSpec(ref.id);
      return getByPath(await readList(spec, ref.id), ref.field);
    }
    if (ref.kind === "work") {
      const { fm, body } = splitWorkMd(await readWorkMd(ref.id));
      if (ref.field === "body") return body.replace(/^\n+/, "").replace(/\s+$/, "");
      if (ref.field === "tags") return Array.isArray(fm.tags) ? fm.tags.join(", ") : "";
      return getByPath(fm, ref.field);
    }
    if (ref.kind === "record") {
      const docs = await readList(opts.files.records, "records");
      const entry = docs.find((d) => d.id === ref.id);
      if (!entry) throw new Error(`record id not found: ${ref.id}`);
      return getByPath(entry, ref.field);
    }
    const docs = await readList(opts.files.writing, "writing");
    const entry = docs.find((d) => d.id === ref.id);
    if (!entry) throw new Error(`writing id not found: ${ref.id}`);
    if (ref.field === "byline") {
      return Array.isArray(entry.byline) ? entry.byline.join(", ") : "";
    }
    return getByPath(entry, ref.field);
  }

  async function setValue(ref: ParsedContentPath, value: string): Promise<{ path: string; value: string }> {
    const v = String(value);

    if (ref.kind === "profile") {
      const docs = await readList(opts.files.profile, "profile");
      profileSet(docs, ref.field, v);
      await writeList(opts.files.profile, docs);
      return { path: `profile:${ref.field}`, value: v };
    }
    if (ref.kind === "page") {
      const docs = (await readYamlFile(abs(opts.files.pageCopy.file))) as Record<string, any>;
      if (!docs || typeof docs !== "object") throw new Error("page-copy invalid");
      setByPath(docs, ref.field, v);
      await writeYamlFile(abs(opts.files.pageCopy.file), opts.files.pageCopy.header, docs);
      return { path: `page:${ref.field}`, value: v };
    }
    if (ref.kind === "archive") {
      const spec = archiveSpec(ref.id);
      const docs = await readList(spec, ref.id);
      setByPath(docs, ref.field, v);
      await writeList(spec, docs);
      return { path: `archive:${ref.id}:${ref.field}`, value: v };
    }
    if (ref.kind === "work") {
      const md = await readWorkMd(ref.id);
      const { fm, body } = splitWorkMd(md);
      if (ref.field === "body") {
        await writeWorkMd(ref.id, joinWorkMd(fm, v));
        return { path: ref.raw, value: v };
      }
      if (ref.field === "tags") {
        fm.tags = v.split(",").map((s) => s.trim()).filter(Boolean);
        await writeWorkMd(ref.id, joinWorkMd(fm, body));
        return { path: ref.raw, value: v };
      }
      if (ref.field === "visibility") {
        const vis = coerceVisibility(v);
        fm.visibility = vis;
        await writeWorkMd(ref.id, joinWorkMd(fm, body));
        return { path: ref.raw, value: vis };
      }
      setByPath(fm, ref.field, v);
      await writeWorkMd(ref.id, joinWorkMd(fm, body));
      return { path: ref.raw, value: v };
    }
    if (ref.kind === "record") {
      const docs = await readList(opts.files.records, "records");
      const entry = docs.find((d) => d.id === ref.id);
      if (!entry) throw new Error(`record id not found: ${ref.id}`);
      if (ref.field === "visibility") {
        const vis = coerceVisibility(v);
        entry.visibility = vis;
        await writeList(opts.files.records, docs);
        return { path: ref.raw, value: vis };
      }
      setByPath(entry, ref.field, v);
      await writeList(opts.files.records, docs);
      return { path: ref.raw, value: v };
    }

    const docs = await readList(opts.files.writing, "writing");
    const entry = docs.find((d) => d.id === ref.id);
    if (!entry) throw new Error(`writing id not found: ${ref.id}`);
    if (ref.field === "year") {
      entry.year = coerceWritingYear(v);
      await writeList(opts.files.writing, docs);
      return { path: ref.raw, value: entry.year == null ? "" : String(entry.year) };
    }
    if (ref.field === "byline") {
      // The page joins two names with "and"; accept that rendered form.
      entry.byline = v
        .split(/\s*,\s*(?:and\s+)?|\s+and\s+/i)
        .map((s) => s.trim())
        .filter(Boolean);
      await writeList(opts.files.writing, docs);
      return { path: ref.raw, value: entry.byline.join(", ") };
    }
    if (ref.field === "visibility") {
      const vis = coerceVisibility(v);
      entry.visibility = vis;
      await writeList(opts.files.writing, docs);
      return { path: ref.raw, value: vis };
    }
    const linkKeyM = ref.field.match(/^links\.(\w+)$/);
    if (linkKeyM && writingLinkKeys.has(linkKeyM[1]!)) {
      if (!entry.links || typeof entry.links !== "object") entry.links = {};
      entry.links[linkKeyM[1]!] = v;
      await writeList(opts.files.writing, docs);
      return { path: ref.raw, value: v };
    }
    setByPath(entry, ref.field, v);
    await writeList(opts.files.writing, docs);
    return { path: ref.raw, value: v };
  }

  async function readLinksArray(kind: "work" | "record", id: string): Promise<LinkRecord[]> {
    if (kind === "work") {
      const { fm } = splitWorkMd(await readWorkMd(id));
      return Array.isArray(fm.links) ? fm.links.map(normalizeLink) : [];
    }
    const docs = await readList(opts.files.records, "records");
    const entry = docs.find((d) => d.id === id);
    if (!entry) throw new Error("record not found");
    return Array.isArray(entry.links) ? entry.links.map(normalizeLink) : [];
  }

  async function getEditPayload(pathParam: string): Promise<EditPayload> {
    const ref = parseContentPath(pathParam);
    if (!ref || !isAllowed(ref)) throw new Error("bad_path");
    const f = ref.field;

    if (f === "tags" && ref.kind === "work") {
      const { fm } = splitWorkMd(await readWorkMd(ref.id));
      const tags = Array.isArray(fm.tags) ? fm.tags.map(String) : [];
      return { editKind: "tags", value: tags.join(", "), tags };
    }

    if (f === "links" && (ref.kind === "work" || ref.kind === "record")) {
      const links = await readLinksArray(ref.kind, ref.id);
      return { editKind: "links", value: "", links };
    }

    const linkM = f.match(/^links\.(\d+)(?:\.(label|href|description|kind))?$/);
    if (linkM && (ref.kind === "work" || ref.kind === "record")) {
      const idx = Number(linkM[1]);
      const links = await readLinksArray(ref.kind, ref.id);
      const link = links[idx] || { label: "", href: "", description: "" };
      const segs = f.split(".");
      const leaf = segs.length >= 3 ? segs[2]! : "label";
      const value = String((link as any)[leaf] ?? link.label);
      return {
        editKind: "link",
        value,
        link,
        linkIndex: idx,
        linkBasePath: `${ref.kind}:${ref.id}:links.${idx}`,
      };
    }

    const wKey = f.match(/^links\.(\w+)$/);
    if (ref.kind === "writing" && wKey && writingLinkKeys.has(wKey[1]!)) {
      const docs = await readList(opts.files.writing, "writing");
      const entry = docs.find((d) => d.id === ref.id);
      if (!entry) throw new Error("writing not found");
      const href = String(entry.links?.[wKey[1]!] ?? "");
      return { editKind: "writing-link", value: href, key: wKey[1]!, href };
    }

    const value = await getValue(ref);
    return { editKind: "text", value: value == null ? "" : String(value) };
  }

  async function setTags(workId: string, tags: string[]): Promise<string[]> {
    const md = await readWorkMd(workId);
    const { fm, body } = splitWorkMd(md);
    fm.tags = tags.map((t) => String(t).trim()).filter(Boolean);
    await writeWorkMd(workId, joinWorkMd(fm, body));
    return fm.tags;
  }

  const PLACEHOLDER: LinkRecord = {
    label: "Link",
    href: "https://",
    description: "Open the linked resource.",
  };

  async function setLinkAt(kind: "work" | "record", id: string, index: number, link: LinkRecord): Promise<LinkRecord> {
    const clean: LinkRecord = {
      label: String(link.label || "").trim() || "Link",
      href: String(link.href || "").trim(),
      description: String(link.description || "").trim() || "Open the linked resource.",
    };
    if (link.kind) clean.kind = String(link.kind).trim();
    if (!clean.href) throw new Error("link href required");

    if (kind === "work") {
      const md = await readWorkMd(id);
      const { fm, body } = splitWorkMd(md);
      if (!Array.isArray(fm.links)) fm.links = [];
      while (fm.links.length <= index) fm.links.push({ ...PLACEHOLDER });
      fm.links[index] = clean;
      await writeWorkMd(id, joinWorkMd(fm, body));
      return clean;
    }
    const docs = await readList(opts.files.records, "records");
    const entry = docs.find((d) => d.id === id);
    if (!entry) throw new Error("record not found");
    if (!Array.isArray(entry.links)) entry.links = [];
    while (entry.links.length <= index) entry.links.push({ ...PLACEHOLDER });
    entry.links[index] = clean;
    await writeList(opts.files.records, docs);
    return clean;
  }

  async function addLink(kind: "work" | "record", id: string, link?: Partial<LinkRecord>): Promise<{ index: number; link: LinkRecord }> {
    const clean: LinkRecord = {
      label: String(link?.label || "New link").trim(),
      href: String(link?.href || "https://example.com").trim(),
      description: String(link?.description || "Describe what this link opens.").trim(),
    };
    if (kind === "work") {
      const md = await readWorkMd(id);
      const { fm, body } = splitWorkMd(md);
      if (!Array.isArray(fm.links)) fm.links = [];
      fm.links.push(clean);
      await writeWorkMd(id, joinWorkMd(fm, body));
      return { index: fm.links.length - 1, link: clean };
    }
    const docs = await readList(opts.files.records, "records");
    const entry = docs.find((d) => d.id === id);
    if (!entry) throw new Error("record not found");
    if (!Array.isArray(entry.links)) entry.links = [];
    entry.links.push(clean);
    await writeList(opts.files.records, docs);
    return { index: entry.links.length - 1, link: clean };
  }

  async function removeLink(kind: "work" | "record", id: string, index: number): Promise<void> {
    if (kind === "work") {
      const md = await readWorkMd(id);
      const { fm, body } = splitWorkMd(md);
      if (!Array.isArray(fm.links) || index < 0 || index >= fm.links.length) {
        throw new Error("link index out of range");
      }
      fm.links.splice(index, 1);
      await writeWorkMd(id, joinWorkMd(fm, body));
      return;
    }
    const docs = await readList(opts.files.records, "records");
    const entry = docs.find((d) => d.id === id);
    if (!entry || !Array.isArray(entry.links)) throw new Error("record/links missing");
    if (index < 0 || index >= entry.links.length) throw new Error("link index out of range");
    if (entry.links.length <= 1) throw new Error("records need at least one link");
    entry.links.splice(index, 1);
    await writeList(opts.files.records, docs);
  }

  async function workIdExists(id: string): Promise<boolean> {
    try {
      await fs.access(path.join(workDir, `${id}.md`));
      return true;
    } catch {
      return false;
    }
  }

  async function uniqueWorkId(title: string): Promise<string> {
    const base = slugifyId(title);
    if (!(await workIdExists(base))) return base;
    for (let i = 2; i < 100; i++) {
      const id = `${base}-${i}`;
      if (!(await workIdExists(id))) return id;
    }
    throw new Error("could not allocate unique work id");
  }

  function uniqueYamlId(docs: { id?: string }[], title: string): string {
    const base = slugifyId(title);
    const taken = new Set(docs.map((d) => String(d.id || "")));
    if (!taken.has(base)) return base;
    for (let i = 2; i < 100; i++) {
      const id = `${base}-${i}`;
      if (!taken.has(id)) return id;
    }
    throw new Error("could not allocate unique id");
  }

  async function nextWorkOrder(): Promise<number> {
    let max = 0;
    try {
      const files = await fs.readdir(workDir);
      for (const f of files) {
        if (!f.endsWith(".md")) continue;
        try {
          const { fm } = splitWorkMd(await fs.readFile(path.join(workDir, f), "utf8"));
          const o = Number(fm.order);
          if (Number.isFinite(o) && o > max) max = o;
        } catch {
          /* skip */
        }
      }
    } catch {
      /* empty */
    }
    return max + 1;
  }

  async function createDraft(d: CreateDraftOpts): Promise<CreateDraftResult> {
    const title = String(d.title || "").trim();
    if (!title || title.length > 200) throw new Error("title required (max 200)");

    if (d.kind === "work") {
      if (!drafts.work) throw new Error("work drafts not configured");
      const id = await uniqueWorkId(title);
      const order = await nextWorkOrder();
      const made = drafts.work(d, { id, order });
      await writeWorkMd(id, joinWorkMd(made.frontmatter, made.body));
      return {
        kind: "work",
        id,
        title,
        path: path.relative(process.cwd(), path.join(workDir, `${id}.md`)),
        editPath: `work:${id}:title`,
      };
    }

    if (d.kind === "writing") {
      if (!drafts.writing) throw new Error("writing drafts not configured");
      const docs = await readList(opts.files.writing, "writing");
      const id = uniqueYamlId(docs, title);
      docs.push(drafts.writing(d, { id }));
      await writeList(opts.files.writing, docs);
      return {
        kind: "writing",
        id,
        title,
        path: path.relative(process.cwd(), abs(opts.files.writing.file)),
        editPath: `writing:${id}:title`,
      };
    }

    if (d.kind === "record") {
      if (!drafts.record) throw new Error("record drafts not configured");
      const docs = await readList(opts.files.records, "records");
      const id = uniqueYamlId(docs, title);
      docs.push(drafts.record(d, { id }));
      await writeList(opts.files.records, docs);
      return {
        kind: "record",
        id,
        title,
        path: path.relative(process.cwd(), abs(opts.files.records.file)),
        editPath: `record:${id}:title`,
      };
    }

    throw new Error("unknown draft kind");
  }

  return {
    getValue,
    setValue,
    getEditPayload,
    setTags,
    setLinkAt,
    addLink,
    removeLink,
    createDraft,
    isAllowed,
  };
}
