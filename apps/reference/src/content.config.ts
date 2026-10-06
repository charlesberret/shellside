import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

/**
 * YAML leaves bare years as numbers and `YYYY-MM-DD` as Date objects.
 * Both become displayable text.
 */
const textish = z.preprocess((value) => {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (value == null) return undefined;
  return value;
}, z.union([z.string(), z.number()]).optional());

const link = z
  .object({
    label: textish,
    href: textish,
    description: textish,
  })
  .passthrough();

/** Loose on purpose: a marquee export may carry extra keys. */
const entrySchema = z
  .object({
    title: textish,
    summary: textish,
    visibility: z.string().optional(),
    status: z.string().optional(),
    kind: textish,
    org: textish,
    dates: textish,
    date: textish,
    venue: textish,
    role: textish,
    type: textish,
    year: textish,
    note: textish,
    tags: z.union([z.array(z.union([z.string(), z.number()])), z.string()]).optional(),
    links: z.array(link).optional(),
  })
  .passthrough();

function markdownCollection(base: string) {
  return defineCollection({
    loader: glob({ pattern: "**/*.md", base }),
    schema: entrySchema,
  });
}

const profile = defineCollection({
  loader: glob({ pattern: "*.{yaml,yml}", base: "./src/content/profile" }),
  schema: z
    .object({
      name: z.string().optional(),
      tagline: z.string().optional(),
      shortBio: z.string().optional(),
    })
    .passthrough(),
});

const pageCopy = defineCollection({
  loader: glob({ pattern: "*.{yaml,yml}", base: "./src/content/page-copy" }),
  schema: z
    .object({
      title: z.string().optional(),
      kicker: z.string().optional(),
      sub: z.string().optional(),
    })
    .passthrough(),
});

export const collections = {
  work: markdownCollection("./src/content/work"),
  writing: markdownCollection("./src/content/writing"),
  records: markdownCollection("./src/content/records"),
  profile,
  pageCopy,
};
