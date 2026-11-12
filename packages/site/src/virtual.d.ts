declare module "virtual:shellsite/config" {
  import type { ShellsiteConfig } from "./config.js";
  const config: ShellsiteConfig;
  export default config;
}
declare module "virtual:shellsite/dev-desk" {
  import type { DevApiHandler } from "@shellside/dev-api";
  export const handler: DevApiHandler;
}
declare module "astro:content" {
  export function getCollection(name: string): Promise<{ id: string; data?: Record<string, unknown>; body?: string }[]>;
}
interface ImportMeta { env: { BASE_URL: string } }
