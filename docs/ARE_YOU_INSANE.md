# Are you insane? This is a really bad idea.

`/console` prints `guest@<host> ~ $` and accepts `ls`, `cd`, `cat`, `grep`, `find`, and pipes. That prompt is painted by the page. The program behind it reads a copy of the public content that the build already embedded in the HTML. It does not open a shell on the server.

The editorial desk does write to the server. It is an HTTP API in the dev process, it has no accounts, and a passing `Host` header is the whole of its network check. Running that process where other people can open the port gives them the content files.

| Who | Where they are | What they can do |
|-----|----------------|------------------|
| A visitor of `/console` | Their browser, on the JSON tree baked into the page | Read and filter the public tree. The server's files stay as they were. |
| A client that can open the dev port while `isDev()` is true and `Host` says `localhost` | The dev server process, as the user who started it | Rewrite content fields, create drafts, edit links, and call the site's look writers. |
| A production build whose `isDev()` compiled to false | The route, if the server build still contains it | Receive HTTP 404 `{ "error": "dev_only" }`. |

## The public console

The build serializes the public VFS into `/console`, on a hidden `#vfs-data` element (`packages/site/pages/console.astro`). `@shellside/console-engine` runs each line in that browser. `createRunner` takes the first token, looks it up in the command table the page registered, and calls that function. The packaged page registers `createFsCommands`, `createFilterCommands`, plus `clear`, `help`, and `history`. A token with no entry prints `command not found`.

`cd`, `ls`, `cat`, `grep`, and `find` resolve through `nodeAt` on that tree. The runner passes the line to those functions as arguments. It does not spawn a process.

A visitor can read every node in the tree, filter the text, recall lines in the tab, and open a `bin` node's URL in a new tab. The same text is on the portfolio pages and in `list.txt`. A node in the tree is published, because the tree is in the page source.

The reference app and the demo build with `output: "static"`. Their `/console` is a file. It has nowhere to send a command.

Command output is HTML. `out()` assigns `innerHTML` (`packages/console-engine/src/io.ts`). The packaged page escapes file text before building that HTML, and `grep` runs `plainText` on a node marked `html` before matching. A site command that passes a file body to `out()` unescaped runs that body as markup for every visitor of `/console`. `grep` compiles the visitor's pattern with `new RegExp` in their tab. A pattern that backtracks hard hangs that tab, and only that tab.

## The desk

`createDevContentHandler` (`packages/dev-api`) is the write API. The marquee mounts it at `src/pages/api/dev-content.ts`. A POST body is JSON. The handler can:

- rewrite a field (`createContentEditor.setValue`)
- set tags, add a link, remove a link, or replace a link
- create a draft file or YAML row (`action: "create-draft"`)
- call the site's `setTokens`, `palette`, and `setStyle`
- list and restore look history, which overwrites `field-styles.yaml` with a snapshot

Those writes run in the dev server process, as the user who started it, on the paths the site passed in (`contentRoot`, the collection files, `field-styles.yaml`). The next build publishes whatever those files contain. When the allowlist includes `visibility`, the editor stores `draft` or `published` and nothing else.

The reference app and `templates/create-site` do not mount this handler. The marquee does.

## What the gates actually check

Every GET and POST goes through `gated` in `packages/dev-api/src/handler.ts`.

1. `isDev()` must return true. The site supplies the function. The marquee supplies `() => import.meta.env.DEV === true`. A false result is HTTP 404 `{ "error": "dev_only" }`. Astro replaces `import.meta.env.DEV` when it builds, so that function is constantly false in a production build. The route can still be in the program. The marquee sets `prerender = false` on `dev-content.ts`, and `astro.config.mjs` uses the Node adapter, so a server deploy of that build still has the route. It answers 404 while the flag stays false.
2. `hostOk` defaults to `isLoopbackHost` (`packages/dev-api/src/contract.ts`). The `Host` header must match `localhost` or `127.0.0.1`, with an optional port. `[::1]` does not match. The function reads `request.headers.get("host")`. It does not read the socket's peer address.

There is no session, no password, and no CSRF token.

The marquee dev server sets `server.host: true` (`~/cloud/git-projects/charlesberret.net/astro.config.mjs`), so `astro dev` listens on every interface, on port 4321. A client that can open that port and send `Host: localhost` passes `isLoopbackHost`. Vite 6.4, which this repo's Astro 5.16 hosts use, also checks `Host` against `allowedHosts`, and localhost is allowed. The peer address is still unchecked.

CORS is a browser rule, and it is a different one. Vite 6.4 defaults `server.cors.origin` to localhost, `127.0.0.1`, `[::1]`, and any `*.localhost` origin (see `defaultAllowedOrigins` in the installed `vite` package, `dist/node/constants.js`). A page at `https://example.com` cannot finish a JSON POST to the desk. A page served from `http://localhost:<port>` or `http://<name>.localhost:<port>` can. `curl` and any other non-browser client ignore CORS.

Copying the marquee's `server.host: true` onto a host that mounts the handler exposes the desk on every interface that process listens on.

## What the path grammar holds

`parseContentPath` (`packages/edit-protocol/src/paths.ts`) accepts `kind:id:field` up to 200 characters. An id must match `[a-z0-9][a-z0-9._-]*`. A field must be dotted identifiers (`title`, `links.0.href`). A slash, a space, or an id of `..` fails the parse, and the handler returns 400. Work files are `<work dir>/<id>.md` with that id. YAML lists are rewritten with `yaml.dump`, so a value is a datum in the document.

`isAllowedEditPath` with no policy returns true for every path that parses. The allowlist is an argument to `createContentEditor`. A wide list is permission to edit every field on it, including bodies and link `href`. `href` is stored as a string. The template that prints it decides whether that string is a URL.

Scalar `value` is rejected past 20,000 characters (`maxValueLength`). That is a size cap.

Look restore accepts the id `previous` or `YYYY-MM-DD` (`isSafeLookSnapshotId`) and writes that snapshot onto `field-styles.yaml`. `setTokens` and `palette` are functions the site injected. They run after the same two gates, and they write what those functions write.

## Drafts

The portfolio, the console, `list.txt`, and `llms.txt` are supposed to read one public set (`isPublicItem`, `includeDrafts: false`). The console tree is built from that set and copied into the HTML. A draft the portfolio drops and the console keeps is in the page source of a public URL. `leakAudit` (`packages/site/src/leak-audit.ts`) fails a build when a hidden route, a `SHELLSIDE_*_SENTINEL` from a draft, or a configured redaction needle appears in `dist`, which includes `/console`. The audit runs when you run it (`npm run check`). It does not watch a server you left up.

## If you run one

- Mount `createDevContentHandler` only where `import.meta.env.DEV` is the real dev flag, and pass that flag as `isDev`.
- Leave the dev server on loopback. `server.host: true` listens on every interface, and the desk's host check will not notice.
- Build the VFS from `isPublicItem`. Run `leakAudit` on `dist`.
- Pass a real allowlist. An omitted policy allows every well-formed path.
- Escape anything a console command sends to `out()`.
- Remote editors with accounts are a non-goal (`docs/ARCHITECTURE.md`). A password taped onto the `Host` check is a different product. This one is a desk for the machine you are sitting at.
