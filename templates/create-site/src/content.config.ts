import fs from "node:fs";
import yaml from "js-yaml";
import { defineCollection, z } from "astro:content";
import { file, glob } from "astro/loaders";

const contentRoot = "./src/content";

const link = z
  .object({ label: z.string().optional(), href: z.string().optional(), description: z.string().optional() })
  .passthrough();

const yamlScalar = z
  .union([z.string(), z.number(), z.date()])
  .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v)));

/** Loose on purpose: a site may carry extra keys. */
const entrySchema = z
  .object({
    title: z.string().optional(),
    summary: z.string().optional(),
    visibility: z.string().optional(),
    status: z.string().optional(),
    kind: z.string().optional(),
    org: z.string().optional(),
    dates: yamlScalar.optional(),
    date: yamlScalar.optional(),
    venue: z.string().optional(),
    role: z.string().optional(),
    type: z.string().optional(),
    year: yamlScalar.optional(),
    note: z.string().optional(),
    tags: z.union([z.array(z.string()), z.string()]).optional(),
    links: z
      .union([
        z.array(link),
        z.record(z.string()).transform((map) =>
          Object.entries(map).map(([label, href]) => ({ label, href })),
        ),
      ])
      .optional(),
  })
  .passthrough();

/**
 * Filesystem-IA (docs/decisions/2026-10-17-filesystem-ia.md):
 * every non-hidden top-level dir of content files is a collection —
 * the tree IS the collection map.
 */
const rootEntries = fs.readdirSync(contentRoot, { withFileTypes: true });

export const collections = Object.fromEntries([
  // dirs → markdown-glob collections
  ...rootEntries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((d) => [
      d.name,
      defineCollection({
        loader: glob({ pattern: "**/*.{md,mdx,markdown}", base: `${contentRoot}/${d.name}` }),
        schema: entrySchema,
      }),
    ]),
  // root *.yaml lists → file collections; {title, items} or bare array
  ...rootEntries
    .filter((e) => e.isFile() && /\.ya?ml$/i.test(e.name) && !e.name.startsWith("."))
    .map((e) => [
      e.name.replace(/\.[^.]+$/, ""),
      defineCollection({
        loader: file(`${contentRoot}/${e.name}`, {
          parser: (raw) => {
            const parsed = yaml.load(raw) as unknown;
            const items = Array.isArray(parsed)
              ? parsed
              : (parsed as { items?: unknown[] })?.items ?? [];
            return items.map((row: Record<string, unknown>, i: number) => ({
              id: row.id ?? row.slug ?? String(row.title ?? i).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              ...row,
            }));
          },
        }),
        schema: entrySchema.extend({ id: z.string().optional() }).passthrough(),
      }),
    ]),
]);
