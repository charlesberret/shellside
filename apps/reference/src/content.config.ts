import fs from "node:fs";
import { defineCollection, z } from "astro:content";
import { file, glob } from "astro/loaders";

const contentRoot = "./src/content";

/** Marquee shape: `<name>.yaml` list at the content root. Toy shape: `<name>/*.md`. */
function loaderFor(name: string, pattern: string) {
  const single = `${contentRoot}/${name}.yaml`;
  return fs.existsSync(single) ? file(single) : glob({ pattern, base: `${contentRoot}/${name}` });
}

const link = z
  .object({
    label: z.string().optional(),
    href: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough();

const yamlScalar = z
  .union([z.string(), z.number(), z.date()])
  .transform((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : String(v)));

/** Loose on purpose: a marquee export may carry extra keys. */
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

function entryCollection(name: string) {
  return defineCollection({
    loader: loaderFor(name, "**/*.md"),
    schema: entrySchema,
  });
}

const profile = defineCollection({
  loader: loaderFor("profile", "*.{yaml,yml}"),
  schema: z
    .object({
      name: z.string().optional(),
      tagline: z.string().optional(),
      shortBio: z.string().optional(),
    })
    .passthrough(),
});

const pageCopy = defineCollection({
  loader: loaderFor("page-copy", "*.{yaml,yml}"),
  schema: z
    .object({
      title: z.string().optional(),
      kicker: z.string().optional(),
      sub: z.string().optional(),
    })
    .passthrough(),
});

export const collections = {
  work: entryCollection("work"),
  writing: entryCollection("writing"),
  records: entryCollection("records"),
  profile,
  pageCopy,
};
