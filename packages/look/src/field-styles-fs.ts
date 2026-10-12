/**
 * Load and save `field-styles.yaml` under an injected content root.
 *
 * Node-only. Import from `@shellside/look/fs`, never from client code.
 * A missing file is an empty map. A file that exists but does not parse
 * throws, so a later save cannot replace it with an empty map.
 */
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";
import {
  isSafeRoleKey,
  normalizeStyle,
  parseFieldStylesRoot,
  styleForSkin,
  type LookSkin,
  type NormalizeStyleOptions,
} from "./field-styles.js";
import {
  pathToLookRole,
  type FieldStyle,
  type FieldStyleEntry,
  type FieldStyleMap,
} from "./roles.js";

export const FIELD_STYLES_HEADER =
  "# Look by semantic role. Editing one title updates every title of that role.\n" +
  "# Values are token names, or #rgb / #rrggbb. Concrete CSS stays in the site token map.\n" +
  "# weight: thin|extralight|light|regular|medium|semibold|bold|extrabold|black\n" +
  "# leading: tight|snug|normal|body|prose|loose|airy\n" +
  "# case: none|uppercase|lowercase|capitalize\n" +
  "# portfolio and console do not inherit from each other. Shape:\n" +
  "#   roles:\n" +
  "#     item-title:\n" +
  "#       portfolio: { size: lg, weight: semibold, leading: prose }\n\n";

export class FieldStylesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FieldStylesError";
  }
}

export type FieldStylesOptions = {
  /** Directory that holds `field-styles.yaml`. */
  contentRoot: string;
  /** Palette token names. Hex colors are always accepted. */
  colorKeys?: readonly string[];
  /**
   * Called after the current file is read and before it is replaced.
   * A throw is ignored so a snapshot failure does not block the save.
   */
  beforeWrite?: () => Promise<void>;
};

export type FieldStylesStore = {
  filePath: string;
  load(): Promise<FieldStyleMap>;
  styleForPath(pathKey: string, skin?: LookSkin): Promise<FieldStyle | null>;
  styleForRole(role: string, skin?: LookSkin): Promise<FieldStyle | null>;
  setRoleStyle(
    role: string,
    style: FieldStyle | null,
    skin?: LookSkin,
  ): Promise<FieldStyle | null>;
  setPathStyle(
    pathKey: string,
    style: FieldStyle | null,
    skin?: LookSkin,
  ): Promise<FieldStyle | null>;
};

function errnoCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code?: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}

export function createFieldStyles(options: FieldStylesOptions): FieldStylesStore {
  const filePath = path.join(options.contentRoot, "field-styles.yaml");
  const norm: NormalizeStyleOptions = { colorKeys: options.colorKeys ?? [] };

  async function readRaw(): Promise<string | null> {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch (err) {
      if (errnoCode(err) === "ENOENT") return null;
      throw err;
    }
  }

  async function load(): Promise<FieldStyleMap> {
    const text = await readRaw();
    if (text == null || text.trim() === "") return {};
    let parsed: unknown;
    try {
      parsed = yaml.load(text);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new FieldStylesError(`field-styles.yaml did not parse: ${detail}`);
    }
    return parseFieldStylesRoot(parsed, norm);
  }

  async function write(map: FieldStyleMap): Promise<void> {
    const serializable: Record<string, FieldStyleEntry> = {};
    for (const [key, entry] of Object.entries(map)) {
      if (!isSafeRoleKey(key)) continue;
      const row: FieldStyleEntry = {};
      if (entry.portfolio) row.portfolio = entry.portfolio;
      if (entry.console) row.console = entry.console;
      if (row.portfolio || row.console) serializable[key] = row;
    }
    const body =
      Object.keys(serializable).length === 0
        ? "roles: {}\n"
        : yaml.dump(
            { roles: serializable },
            {
              lineWidth: 100,
              noRefs: true,
              sortKeys: true,
              quotingType: '"',
              forceQuotes: true,
            },
          );
    if (options.beforeWrite) {
      try {
        await options.beforeWrite();
      } catch {
        /* snapshot failure must not block the save */
      }
    }
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, FIELD_STYLES_HEADER + body, "utf8");
  }

  async function setRoleStyle(
    roleArg: string,
    style: FieldStyle | null,
    skin: LookSkin = "portfolio",
  ): Promise<FieldStyle | null> {
    const role = pathToLookRole(roleArg);
    if (!isSafeRoleKey(role)) throw new FieldStylesError("bad look role");
    const map = await load();
    const existing: FieldStyleEntry = { ...(map[role] || {}) };
    const next = normalizeStyle(style, norm);
    if (skin === "console") {
      if (next) existing.console = next;
      else delete existing.console;
    } else if (next) existing.portfolio = next;
    else delete existing.portfolio;
    if (!existing.portfolio && !existing.console) delete map[role];
    else map[role] = existing;
    await write(map);
    return next;
  }

  return {
    filePath,
    load,
    async styleForPath(pathKey: string, skin: LookSkin = "portfolio") {
      const map = await load();
      return styleForSkin(map[pathToLookRole(pathKey)], skin);
    },
    async styleForRole(role: string, skin: LookSkin = "portfolio") {
      const map = await load();
      return styleForSkin(map[role], skin);
    },
    setRoleStyle,
    setPathStyle(pathKey, style, skin) {
      return setRoleStyle(pathKey, style, skin);
    },
  };
}
