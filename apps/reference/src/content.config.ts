import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const link = z
  .object({
    label: z.string().optional(),
    href: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough();

/** Loose on purpose: a marquee export may carry extra keys. */
const entrySchema = z
  .object({
    title: z.string().optional(),
    summary: z.string().optional(),
    visibility: z.string().optional(),
    status: z.string().optional(),
    kind: z.string().optional(),
    org: z.string().optional(),
    dates: z.string().optional(),
    date: z.string().optional(),
    venue: z.string().optional(),
    role: z.string().optional(),
    type: z.string().optional(),
    year: z.union([z.string(), z.number()]).optional(),
    note: z.string().optional(),
    tags: z.union([z.array(z.string()), z.string()]).optional(),
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
