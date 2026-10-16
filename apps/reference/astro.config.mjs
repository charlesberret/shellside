import { defineConfig, passthroughImageService } from "astro/config";
import { shellsite } from "@shellside/site";
import siteConfig from "./site.config.ts";

/** Boring static host. Structural fidelity only — not a marquee skin. */
export default defineConfig({
  output: "static",
  image: { service: passthroughImageService() },
  integrations: [shellsite(siteConfig)],
});
