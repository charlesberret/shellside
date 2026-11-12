/**
 * Demo write policy for the dev desk (`site.config` → `edit.policy`).
 *
 * `packages/*.md` is the `work` kind; `docs.yaml`/`releases.yaml` are
 * `{title, items}` maps bound to the `writing`/`record` list-file slots.
 * `cv.yaml`/`resume.yaml` stay undeclared — not editable here.
 */
import type { EditAllowlist } from "@shellside/dev-api";

export const allowlist: EditAllowlist = {
  work: [
    "title",
    "summary",
    "kind",
    "visibility",
    "body",
    "links",
    /^links\.\d+\.(label|href|description|kind)$/,
  ],
  writing: ["title", "kind", "summary", "url", "visibility"],
  record: ["title", "type", "date", "summary", "url", "visibility"],
};
