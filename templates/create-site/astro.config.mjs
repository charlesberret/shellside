import { defineConfig, passthroughImageService } from "astro/config";
import { shellsite } from "@shellside/site";
import siteConfig from "./site.config.ts";

export default defineConfig({
  output: "static",
  image: { service: passthroughImageService() },
  integrations: [shellsite(siteConfig)],
});
