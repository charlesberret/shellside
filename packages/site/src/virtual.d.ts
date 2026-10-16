declare module "virtual:shellsite/config" {
  import type { ShellsiteConfig } from "./config.js";
  const config: ShellsiteConfig;
  export default config;
}
declare module "astro:content" {
  export function getCollection(name: string): Promise<{ id: string; data?: Record<string, unknown>; body?: string }[]>;
}
