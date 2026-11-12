/**
 * /api/dev-content — DEV-only desk route. Injected by the
 * host only in `astro dev` when `surfaces.devDesk` + `edit.*` are set;
 * a production build never loads this file or the modules behind it.
 * The handler re-gates on `import.meta.env.DEV` + loopback.
 */
import type { APIRoute } from "astro";
import { handler } from "virtual:shellsite/dev-desk";

export const prerender = false;

export const GET: APIRoute = ({ url, request }) => handler.GET({ url, request });
export const POST: APIRoute = ({ request }) => handler.POST({ request });
