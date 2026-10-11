import { defineConfig, passthroughImageService } from "astro/config";

/** Boring static host. Structural fidelity only — not a marquee skin. */
export default defineConfig({
  output: "static",
  image: { service: passthroughImageService() },
});
