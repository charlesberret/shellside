import { defineConfig, passthroughImageService } from "astro/config";
import { shellsite } from "@shellside/site";
import siteConfig from "./site.config.ts";

export default defineConfig({
  output: "static",
  site: "https://charlesberret.github.io",
  base: "/shellside",
  image: { service: passthroughImageService() },
  integrations: [shellsite(siteConfig)],
});
