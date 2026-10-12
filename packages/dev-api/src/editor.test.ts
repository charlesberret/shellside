import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { parseContentPath } from "@shellside/edit-protocol";
import { createContentEditor, type ContentEditor } from "./content-editor.js";
import { createDevContentHandler } from "./handler.js";

let root: string;
let editor: ContentEditor;

const WORK_MD = `---
title: Kettle
summary: A project.
tags:
  - one
  - two
visibility: published
links:
  - label: Repo
    href: https://example.com/repo
    description: Source.
order: 3
---

Kettle body text.
`;

const FILES = {
  work: { dir: "work" },
  writing: { file: "writing.yaml", header: "# writing\n" },
  records: { file: "records.yaml", header: "# records\n" },
  profile: { file: "profile.yaml", header: "# profile\n" },
  pageCopy: { file: "page-copy.yaml", header: "# copy\n" },
  archive: (which: string) => ({ file: `${which}.yaml`, header: `# ${which}\n` }),
};

const ALLOWLIST = {
  profile: ["name", "tagline", /^experience\.\d+\.role$/, "roles"],
  page: [/^(portfolio|nav)\./],
  archive: [/^\d+\.title$/, /^\d+\.items\.\d+$/],
  work: ["title", "summary", "tags", "body", "visibility", "links", /^links\.\d+/],
  writing: ["title", "year", "byline", "visibility", /^links\.(html|pdf)$/],
  record: ["title", "visibility", "links", /^links\.\d+/],
};

async function seed() {
  await fs.mkdir(path.join(root, "work"), { recursive: true });
  await fs.writeFile(path.join(root, "work", "kettle.md"), WORK_MD);
  await fs.writeFile(
    path.join(root, "writing.yaml"),
    yaml.dump([
      { id: "essay-one", title: "Essay", year: 2024, visibility: "published",
        byline: ["Ada Lovelace", "Grace Hopper"], links: { html: "https://x/e" } },
      { id: "secret", title: "Secret", visibility: "draft" },
    ]),
  );
  await fs.writeFile(
    path.join(root, "records.yaml"),
    yaml.dump([
      { id: "talk-one", title: "Talk", visibility: "published",
        links: [{ label: "Video", href: "https://v", description: "watch" }] },
    ]),
  );
  await fs.writeFile(
    path.join(root, "profile.yaml"),
    yaml.dump([{ name: "Charles", tagline: "Researcher", roles: ["Writer", "Researcher"],
      experience: [{ role: "Editor" }] }]),
  );
  await fs.writeFile(path.join(root, "page-copy.yaml"), yaml.dump({ portfolio: { hero: "Hi" }, nav: { p: "P" } }));
  await fs.writeFile(path.join(root, "cv.yaml"), yaml.dump([{ title: "Edu", items: ["PhD"] }]));
  await fs.writeFile(path.join(root, "resume.yaml"), yaml.dump([{ title: "Work", items: ["Job"] }]));
}

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "shellside-devapi-"));
  await seed();
  editor = createContentEditor({
    contentRoot: root,
    files: FILES,
    allowlist: ALLOWLIST,
    archiveKinds: ["cv", "resume"],
    profileListJoins: { roles: " · " },
    drafts: {
      work: (o, { id, order }) => ({
        frontmatter: { title: o.title, order, status: o.workStatus ?? "complete", visibility: "draft", links: [] },
        body: "Draft body.\n",
      }),
      writing: (o, { id }) => ({ id, title: o.title, type: o.writingType ?? "essay", visibility: "draft", links: {} }),
      record: (o, { id }) => ({ id, title: o.title, section: o.recordSection ?? "software", visibility: "draft",
        links: [{ label: "L", href: "/", description: "d" }] }),
    },
  });
});

describe("createContentEditor", () => {
  it("reads scalars across every kind", async () => {
    assert.equal(await editor.getValue(parseContentPath("profile:name")!), "Charles");
    assert.equal(await editor.getValue(parseContentPath("page:portfolio.hero")!), "Hi");
    assert.equal(await editor.getValue(parseContentPath("archive:cv:0.title")!), "Edu");
    assert.equal(await editor.getValue(parseContentPath("work:kettle:title")!), "Kettle");
    assert.equal(await editor.getValue(parseContentPath("work:kettle:body")!), "Kettle body text.");
    assert.equal(await editor.getValue(parseContentPath("work:kettle:tags")!), "one, two");
    assert.equal(await editor.getValue(parseContentPath("writing:essay-one:title")!), "Essay");
    assert.equal(await editor.getValue(parseContentPath("record:talk-one:title")!), "Talk");
  });

  it("rejects disallowed and unsafe refs", async () => {
    assert.equal(editor.isAllowed(parseContentPath("profile:secret")!), false);
    assert.equal(editor.isAllowed(parseContentPath("archive:cv:0.items.1")!), true);
    assert.equal(editor.isAllowed(parseContentPath("archive:other:0.title")!), false);
    await assert.rejects(editor.getValue(parseContentPath("archive:other:0.title")!), /bad archive kind/);
    await assert.rejects(editor.getEditPayload("writing:missing:title"), /not found|bad_path/);
  });

  it("joins and splits profile list fields, refusing accidental clears", async () => {
    const ref = parseContentPath("profile:roles")!;
    assert.equal(await editor.getValue(ref), "Writer · Researcher");
    await editor.setValue(ref, "Writer · Editor");
    const docs = yaml.load(await fs.readFile(path.join(root, "profile.yaml"), "utf8")) as any[];
    assert.deepEqual(docs[0].roles, ["Writer", "Editor"]);
    await assert.rejects(editor.setValue(ref, "   "), /refusing to clear/);
  });

  it("coerces visibility, writing year, and byline", async () => {
    await editor.setValue(parseContentPath("work:kettle:visibility")!, "draft");
    assert.match(await fs.readFile(path.join(root, "work", "kettle.md"), "utf8"), /visibility: draft/);
    await assert.rejects(editor.setValue(parseContentPath("work:kettle:visibility")!, "maybe"), /visibility must/);

    await editor.setValue(parseContentPath("writing:essay-one:year")!, "2026");
    let docs = yaml.load(await fs.readFile(path.join(root, "writing.yaml"), "utf8")) as any[];
    assert.equal(docs[0].year, 2026);
    await editor.setValue(parseContentPath("writing:essay-one:year")!, "");
    docs = yaml.load(await fs.readFile(path.join(root, "writing.yaml"), "utf8")) as any[];
    assert.equal(docs[0].year, null);
    await assert.rejects(editor.setValue(parseContentPath("writing:essay-one:year")!, "soon"), /4-digit/);

    await editor.setValue(parseContentPath("writing:essay-one:byline")!, "Ada Lovelace and Grace Hopper");
    docs = yaml.load(await fs.readFile(path.join(root, "writing.yaml"), "utf8")) as any[];
    assert.deepEqual(docs[0].byline, ["Ada Lovelace", "Grace Hopper"]);
  });

  it("writes keyed writing links and scalar fields", async () => {
    await editor.setValue(parseContentPath("writing:essay-one:links.pdf")!, "https://x/e.pdf");
    const docs = yaml.load(await fs.readFile(path.join(root, "writing.yaml"), "utf8")) as any[];
    assert.equal(docs[0].links.pdf, "https://x/e.pdf");
  });

  it("builds edit payloads for the desk", async () => {
    assert.deepEqual(await editor.getEditPayload("work:kettle:tags"),
      { editKind: "tags", value: "one, two", tags: ["one", "two"] });
    assert.equal((await editor.getEditPayload("work:kettle:links")).editKind, "links");
    const leaf = await editor.getEditPayload("work:kettle:links.0.href");
    assert.deepEqual(leaf, {
      editKind: "link", value: "https://example.com/repo",
      link: { label: "Repo", href: "https://example.com/repo", description: "Source.", kind: undefined },
      linkIndex: 0, linkBasePath: "work:kettle:links.0",
    });
    const wl = await editor.getEditPayload("writing:essay-one:links.html");
    assert.deepEqual(wl, { editKind: "writing-link", value: "https://x/e", key: "html", href: "https://x/e" });
  });

  it("mutates link arrays", async () => {
    await editor.setLinkAt("work", "kettle", 1, { label: "Docs", href: "https://d", description: "d" });
    let md = await fs.readFile(path.join(root, "work", "kettle.md"), "utf8");
    assert.match(md, /label: Docs/);
    const added = await editor.addLink("record", "talk-one", { label: "Slides", href: "https://s", description: "s" });
    assert.equal(added.index, 1);
    await assert.rejects(editor.removeLink("record", "talk-one", 5), /out of range/);
    await editor.removeLink("record", "talk-one", 1);
    await assert.rejects(editor.removeLink("record", "talk-one", 0), /at least one link/);
    await assert.rejects(editor.setLinkAt("work", "kettle", 0, { label: "x", href: "", description: "" }), /href required/);
  });

  it("creates drafts with unique ids and next order", async () => {
    const d1 = await editor.createDraft({ kind: "work", title: "New Thing" });
    assert.equal(d1.id, "new-thing");
    const d2 = await editor.createDraft({ kind: "work", title: "New Thing!" });
    assert.equal(d2.id, "new-thing-2");
    const md = await fs.readFile(path.join(root, "work", "new-thing.md"), "utf8");
    assert.match(md, /order: 4/);
    const w = await editor.createDraft({ kind: "writing", title: "Secret" });
    assert.equal(w.id, "secret-2");
    const r = await editor.createDraft({ kind: "record", title: "Note", recordSection: "teaching" });
    assert.equal(r.id, "note");
    await assert.rejects(editor.createDraft({ kind: "work", title: "" }), /title required/);
  });
});

describe("createDevContentHandler", () => {
  const makeHandler = (isDev: boolean, look = {}) =>
    createDevContentHandler({ isDev: () => isDev, editor, look });

  const req = (body?: unknown, host = "localhost:4321") =>
    new Request(`http://${host}/api/dev-content`, {
      method: "POST",
      headers: { "content-type": "application/json", host },
      body: body === undefined ? "not json" : JSON.stringify(body),
    });

  it("gates on DEV and loopback", async () => {
    const h = makeHandler(false);
    assert.equal((await h.GET({ url: new URL("http://x/?path=work:kettle:title"), request: req({}) })).status, 404);
    assert.equal((await h.POST({ request: req({}) })).status, 404);
    const live = makeHandler(true);
    const bad = new Request("http://example.com/api/dev-content", { method: "POST", headers: { host: "example.com" }, body: "{}" });
    assert.equal((await live.POST({ request: bad })).status, 403);
  });

  it("reads a field through GET", async () => {
    const h = makeHandler(true);
    const res = await h.GET({
      url: new URL("http://localhost/?path=work:kettle:title"),
      request: new Request("http://localhost/api/dev-content", { headers: { host: "localhost" } }),
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.deepEqual(body, {
      ok: true, path: "work:kettle:title", type: "string", skin: "portfolio",
      editKind: "text", value: "Kettle",
    });
    const bad = await h.GET({ url: new URL("http://localhost/?path=profile:secret"), request: new Request("http://localhost/api", { headers: { host: "localhost" } }) });
    assert.equal(bad.status, 400);
  });

  it("merges look path extras and meta", async () => {
    const h = makeHandler(true, {
      meta: async () => ({ sizes: ["inherit"], styles: {} }),
      pathExtras: async () => ({ lookRole: "item-title", style: { size: "lg" } }),
    });
    const meta = await h.GET({ url: new URL("http://localhost/?meta=1"), request: new Request("http://localhost/api", { headers: { host: "localhost" } }) });
    assert.deepEqual(await meta.json(), { ok: true, skin: "portfolio", sizes: ["inherit"], styles: {} });
    const res = await h.GET({ url: new URL("http://localhost/?path=work:kettle:title"), request: new Request("http://localhost/api", { headers: { host: "localhost" } }) });
    const body = await res.json();
    assert.equal(body.lookRole, "item-title");
    assert.equal(body.value, "Kettle");
  });

  it("writes scalars, tags, and links", async () => {
    const h = makeHandler(true);
    let res = await h.POST({ request: req({ path: "writing:essay-one:title", value: "New Title" }) });
    assert.equal(res.status, 200);
    const docs = yaml.load(await fs.readFile(path.join(root, "writing.yaml"), "utf8")) as any[];
    assert.equal(docs[0].title, "New Title");

    res = await h.POST({ request: req({ path: "work:kettle:tags", tags: ["a", "b"] }) });
    assert.equal((await res.json()).editKind, "tags");
    assert.match(await fs.readFile(path.join(root, "work", "kettle.md"), "utf8"), /- a/);

    res = await h.POST({ request: req({ path: "work:kettle:links", action: "add-link" }) });
    assert.equal((await res.json()).action, "add-link");

    res = await h.POST({ request: req({ path: "work:kettle:links.0", action: "remove-link" }) });
    assert.equal((await res.json()).action, "remove-link");
  });

  it("creates drafts and serves look history through the look surface", async () => {
    const h = makeHandler(true, {
      historyList: async () => ({ history: [{ id: "previous" }] }),
      historyRestore: async (id: string) => ({ restored: id }),
    });
    let res = await h.POST({ request: req({ action: "create-draft", draftKind: "record", draftTitle: "Card" }) });
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.editPath, "record:card:title");
    res = await h.POST({ request: req({ action: "look-history-restore", lookHistoryId: "2026-10-10" }) });
    assert.equal((await res.json()).restored, "2026-10-10");
    res = await h.GET({ url: new URL("http://localhost/?lookHistory=1"), request: new Request("http://localhost/api", { headers: { host: "localhost" } }) });
    assert.deepEqual((await res.json()).history, [{ id: "previous" }]);
  });

  it("errors on bad json, nothing to save, and long values", async () => {
    const h = makeHandler(true);
    assert.equal((await h.POST({ request: req() })).status, 400);
    assert.equal((await h.POST({ request: req({ path: "work:kettle:title" }) })).status, 400);
    assert.equal((await h.POST({ request: req({ path: "work:kettle:title", value: "x".repeat(20001) }) })).status, 400);
  });
});
