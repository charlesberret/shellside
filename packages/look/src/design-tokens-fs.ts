/**
 * Load and save `design-tokens.yaml` and `palette-presets.yaml` under an
 * injected content root. Node-only — import from `@shellside/look/fs`.
 *
 * A missing or unparseable tokens file falls back to the site's defaults
 * (a Look read must never break the page). Writes are strict: every value
 * is validated before the file is replaced, and `beforeWrite` lets the
 * site snapshot history first.
 */
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import {
  isSafePresetName,
  mergeTokens,
  normalizePresetColors,
  normalizePresetSizes,
  validateTokenUpdate,
  type DesignTokens,
  type DesignTokensPartial,
  type PalettePreset,
  type PalettePresetMap,
  type TokenKeys,
} from "./tokens.js";

export class DesignTokensError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DesignTokensError";
  }
}

const DESIGN_TOKENS_HEADER =
  "# Editable type scale, palette, and font stacks for live-edit (Tokens tab).\n" +
  "# Field Look picks size/color/font *names*; this file holds concrete CSS.\n\n";

const PRESETS_HEADER =
  "# Named palette (and optional type-scale) snapshots for live-edit.\n" +
  "# Load applies colors (+ sizes if stored) into design-tokens.yaml.\n\n";

export type DesignTokensOptions = {
  /** Directory that holds `design-tokens.yaml`. */
  contentRoot: string;
  fileName?: string;
  /** Site token values used when the file is missing or a key absent. */
  defaults: DesignTokens;
  /** Allowed key names per section. */
  keys: TokenKeys;
  /** Comment written above the YAML. */
  header?: string;
  /** Called before the file is replaced; failures are ignored. */
  beforeWrite?: () => Promise<void>;
};

export type DesignTokensStore = {
  filePath: string;
  load(): Promise<DesignTokens>;
  set(partial: DesignTokensPartial): Promise<DesignTokens>;
};

export function createDesignTokens(
  options: DesignTokensOptions,
): DesignTokensStore {
  const filePath = path.join(
    options.contentRoot,
    options.fileName ?? "design-tokens.yaml",
  );
  const header = options.header ?? DESIGN_TOKENS_HEADER;

  async function load(): Promise<DesignTokens> {
    try {
      const raw = yaml.load(await fs.readFile(filePath, "utf8"));
      return mergeTokens(raw, options.defaults, options.keys);
    } catch {
      return {
        sizes: { ...options.defaults.sizes },
        colors: { ...options.defaults.colors },
        fonts: { ...options.defaults.fonts },
      };
    }
  }

  async function set(partial: DesignTokensPartial): Promise<DesignTokens> {
    const current = await load();
    const next: DesignTokens = {
      sizes: { ...current.sizes },
      colors: { ...current.colors },
      fonts: { ...current.fonts },
    };
    let cleaned: DesignTokensPartial;
    try {
      cleaned = validateTokenUpdate(partial, options.keys);
    } catch (err) {
      throw new DesignTokensError(
        err instanceof Error ? err.message : String(err),
      );
    }
    for (const section of ["sizes", "colors", "fonts"] as const) {
      for (const [k, v] of Object.entries(cleaned[section] ?? {})) {
        if (typeof v === "string") next[section][k] = v;
      }
    }
    if (options.beforeWrite) {
      try {
        await options.beforeWrite();
      } catch {
        /* history is best-effort; never block token saves */
      }
    }
    await fs.writeFile(
      filePath,
      header +
        yaml.dump(next, {
          lineWidth: 100,
          noRefs: true,
          sortKeys: false,
          quotingType: '"',
          forceQuotes: true,
        }),
      "utf8",
    );
    return next;
  }

  return { filePath, load, set };
}

// ── Palette presets ─────────────────────────────────────────────────────

export type PalettePresetsOptions = {
  /** Directory that holds the presets file. */
  contentRoot: string;
  fileName?: string;
  /** Defaults used to fill a preset's missing keys on read. */
  defaults: DesignTokens;
  keys: Pick<TokenKeys, "colors" | "sizes">;
  /** Built-in preset names are reserved (cannot be saved over or deleted). */
  builtinPresets?: () => PalettePreset[];
  header?: string;
};

export type PalettePresetsStore = {
  filePath: string;
  /** On-disk map only (no builtins). */
  read(): Promise<PalettePresetMap>;
  /** Builtins-not-overridden first, then named presets, name-sorted. */
  list(): Promise<PalettePreset[]>;
  get(name: string): Promise<PalettePreset | null>;
  save(
    name: string,
    opts?: {
      note?: string;
      tokens?: DesignTokens;
      includeSizes?: boolean;
    },
  ): Promise<PalettePreset>;
  remove(name: string): Promise<boolean>;
};

export function createPalettePresets(
  options: PalettePresetsOptions,
): PalettePresetsStore {
  const filePath = path.join(
    options.contentRoot,
    options.fileName ?? "palette-presets.yaml",
  );
  const header = options.header ?? PRESETS_HEADER;
  const builtins = options.builtinPresets ?? (() => []);
  const reserved = new Set(builtins().map((b) => b.name));

  async function read(): Promise<PalettePresetMap> {
    let raw: unknown;
    try {
      raw = yaml.load(await fs.readFile(filePath, "utf8"));
    } catch {
      return {};
    }
    if (!raw || typeof raw !== "object") return {};
    const root = raw as { presets?: Record<string, unknown> };
    const bag =
      root.presets && typeof root.presets === "object" ? root.presets : raw;
    const out: PalettePresetMap = {};
    for (const [name, val] of Object.entries(bag as Record<string, unknown>)) {
      if (!isSafePresetName(name)) continue;
      if (!val || typeof val !== "object") continue;
      const o = val as Record<string, unknown>;
      const colors = normalizePresetColors(
        o.colors ?? o,
        options.defaults.colors,
        options.keys.colors,
      );
      if (!colors) continue;
      out[name.trim()] = {
        colors,
        sizes: normalizePresetSizes(
          o.sizes,
          options.defaults.sizes,
          options.keys.sizes,
        ),
        note: typeof o.note === "string" ? o.note.slice(0, 200) : undefined,
        savedAt: typeof o.savedAt === "string" ? o.savedAt : undefined,
      };
    }
    return out;
  }

  async function write(map: PalettePresetMap): Promise<void> {
    const body =
      Object.keys(map).length === 0
        ? "presets: {}\n"
        : yaml.dump(
            { presets: map },
            {
              lineWidth: 100,
              noRefs: true,
              sortKeys: true,
              quotingType: '"',
              forceQuotes: true,
            },
          );
    await fs.writeFile(filePath, header + body, "utf8");
  }

  async function list(): Promise<PalettePreset[]> {
    const map = await read();
    const named = Object.entries(map)
      .map(([name, p]) => ({ name, ...p }))
      .sort((a, b) => a.name.localeCompare(b.name));
    const free = builtins().filter((b) => !map[b.name]);
    return [...free, ...named];
  }

  async function get(name: string): Promise<PalettePreset | null> {
    const key = String(name || "").trim();
    if (!key) return null;
    const map = await read();
    if (map[key]) return { name: key, ...map[key] };
    return builtins().find((b) => b.name === key) ?? null;
  }

  async function save(
    name: string,
    opts?: {
      note?: string;
      tokens?: DesignTokens;
      includeSizes?: boolean;
    },
  ): Promise<PalettePreset> {
    const key = String(name || "").trim();
    if (!isSafePresetName(key)) throw new DesignTokensError("bad palette name");
    if (reserved.has(key))
      throw new DesignTokensError(`cannot overwrite built-in “${key}”`);
    const tokens = opts?.tokens;
    if (!tokens) throw new DesignTokensError("save needs explicit tokens");
    const map = await read();
    const entry: Omit<PalettePreset, "name"> = {
      colors: { ...tokens.colors },
      savedAt: new Date().toISOString(),
      note: opts?.note?.slice(0, 200),
    };
    if (opts?.includeSizes !== false) entry.sizes = { ...tokens.sizes };
    map[key] = entry;
    await write(map);
    return { name: key, ...entry };
  }

  async function remove(name: string): Promise<boolean> {
    const key = String(name || "").trim();
    if (!isSafePresetName(key)) throw new DesignTokensError("bad palette name");
    if (reserved.has(key))
      throw new DesignTokensError(`cannot delete built-in “${key}”`);
    const map = await read();
    if (!map[key]) return false;
    delete map[key];
    await write(map);
    return true;
  }

  return { filePath, read, list, get, save, remove };
}
