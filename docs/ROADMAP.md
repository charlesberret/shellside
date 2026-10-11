# Shellside roadmap — scaffold → release

**Audience:** humans and agents working this kit and the marquee consumer.  
**Marquee:** `~/cloud/git-projects/charlesberret.net` (first and primary consumer).  
**Status today:** private monorepo scaffold; packages are mostly **contracts + pure helpers**; full dual-surface runtime still lives in the marquee.

This document defines **what release means**, the **feature set**, phased delivery, and a **sync protocol** so framework work tracks marquee refinements instead of forking them.

---

## 1. North star

Shellside is a **filesystem-first dual-surface site kit**:

| Surface | Role |
|---------|------|
| **Portfolio (readable)** | Conventional web UI — projects, writing, about, etc. |
| **Console (terminal)** | Same content graph as a VFS + CLI (`ls`, `cat`, …) |
| **Plaintext / llms.txt** | Same graph again for agents and plain readers |
| **Admin desk (DEV only)** | Live-edit against real preview; writes YAML/MD on disk |

**Not** a hosted CMS, multi-tenant SaaS, or theme marketplace.  
**Yes** a portable stack of **contracts, filters, path grammar, look roles, and (later) injectable runtimes** so the next dual-surface site does not re-invent charlesberret.net line by line.

Periodic product question (also in `PRODUCT_NOTES.md`):

> What would it take for Shellside to be noticed, appreciated, and used — without sidelining the portfolio?

---

## 2. What “release” means

Shellside has three nested release bars. Ship when the bar is met; do not wait for the next bar.

| Bar | Name | Definition of done |
|-----|------|--------------------|
| **R0** | **Internal kit + content portability (smoke)** | **Both** directions of proof: (A) marquee depends on shellside for stable pure contracts; (B) scripted export of marquee **content** loads into a shellside-hosted app and a **production build** renders the public graph correctly (structural fidelity, not visual twin). Docs + `npm run check` green. |
| **R1** | **Private release + full content portability** | Dual-surface reference app (portfolio + console + leak audit) on packages only; marquee content export (or large public subset) is the acceptance fixture; marquee has deleted local duplicates for promoted code; boring chrome is fine. |
| **R2** | **Publishable kit** | Packages versioned and installable without monorepo path hacks (`file:../shellside`); create-site path documented; optional public GitHub/npm later |

**Default goal for this roadmap:** **R1**. R2 is optional and gated on “second real site or deliberate open.”

Private is fine through R1. Opening the name/repo is a product decision, not a technical prerequisite.

### 2.1 Content portability (acceptance fixture)

Treat marquee **content** as the hard acceptance fixture for “the kit is real”—not only unit tests and package imports.

#### Two proofs (both required for a solid R0+)

| Proof | Direction | Question it answers |
|-------|-----------|---------------------|
| **A. Marquee consumes shellside** | kit → marquee | Is the kit source of truth for contracts? |
| **B. Shellside hosts marquee content** | marquee content → kit app | Can the kit stand alone as a dual-surface host? |

- **A alone** → clean packages, no product demo.  
- **B alone** → demo app while marquee still forks parsers.  
- **A + B** → internal kit that actually loads real content.

#### Scope of “export”

**In scope (content + schema assumptions the kit claims to understand):**

- `src/content/**` collections: work, writing, records, profile, page-copy (as needed for lists/detail)
- Public visibility / lifecycle fields the kit filters on
- Scripted sync into `apps/reference` or `fixtures/marquee-content` (not a permanent full-repo mirror)

**Out of scope (stay marquee-local forever for this gate):**

- Console personality, easter eggs, monome, CRT lore  
- Palettes, type stacks, field-styles *taste*, admin chrome  
- Enigma / private archive paths, reading rights, contact backend, deploy runners  
- Pixel parity with charlesberret.net  

Export may be **redacted** (strip private-only paths) while still representing the real public graph.

#### What “renders correctly in production” means

**Production** = `astro build` (or equivalent) **prod mode** + public-output / leak checks—not necessarily a public domain deploy.

| Correct | Incorrect (fails the gate) |
|---------|----------------------------|
| Published items appear on portfolio (and console when in scope) | Drafts appear in prod HTML/JS/txt |
| Titles, summaries, links match source for public items | Site-specific secrets or Enigma paths in dist |
| Portfolio list, console `ls`/`cat`, and plaintext agree on the **same public set** | Visual twin of marquee required |
| Boring shellside chrome is fine | Full marquee site clone required |

#### R0 vs R1 depth for proof B

| Bar | Content fixture | Surfaces | Leak audit |
|-----|-----------------|----------|------------|
| **R0** | Scripted export (or large subset) loads; at least **portfolio** (and plaintext if easy) builds in prod | Single-surface OK if dual not ready; prefer portfolio + one listing/txt | Basic: no drafts in dist; no private path strings from redaction list |
| **R1** | Full public export (or complete public subset policy) is the default fixture | **Portfolio + console** over same graph | Kit leak-audit script green on reference dist |

R0 is **not** “full charlesberret.net lives inside shellside.” It is **content-in, structure-out, prod-safe**.

---

## 3. Current state (honest inventory)

### Already in shellside

| Package | Maturity | Marquee consumption |
|---------|----------|---------------------|
| `@shellside/content-model` | Real: visibility filters + tests | **Yes** (`public-content.ts`) |
| `@shellside/look` | Pure roles, weights, size/font slots, `crossSkinStyle` tests | Not yet (switch doc'd; local `look-roles.ts` remains until thin-wrap) |
| `@shellside/edit-protocol` | Path parse, field kinds, allowlist, content file builder + tests | Not yet (local `content-edit.ts` parse remains until switch) |
| `@shellside/dev-api` | Contract types + loopback helper only | No (full handler in `api/dev-content.ts`) |
| `apps/reference` | Astro portfolio + plaintext over toy or exported content; leak audit | — |
| Docs | Architecture, visibility, live-edit contract, extraction map | Linked from marquee live-edit docs |

### Still marquee-only (high signal)

Rough scale (order of magnitude):

| Area | Marquee home | Promote? |
|------|--------------|----------|
| Content edit + DEV API | `content-edit.ts`, `api/dev-content.ts` | Yes — with injected `contentRoot` + host policy |
| Look I/O + history fs | `field-styles.ts`, `look-history.ts`, `look-roles.ts` | Yes — pure map/role first; fs behind options |
| Live-edit client | `live-edit.js` (~3.5k) | Later — mount/host adapters |
| Admin shell | `admin-app.js`, preview bridge, `/admin` | Later — chrome is taste-heavy |
| Console VFS + personality | `console.astro` (~6k) | **Contracts only** — VFS schema, not easter eggs |
| Public leak guards | `check-public-output.mjs`, content checks | Yes — as kit checklist + optional scripts |
| Taste / deploy / Enigma / monome | site-local | **Never** (see extraction map) |

### Design pillars (invariants — do not break in any phase)

1. Content once → many surfaces  
2. `visibility` ≠ lifecycle/`status`  
3. Look is **role-scoped**  
4. Admin/write API is **DEV-only** (no production write surface)  
5. Site owns taste; kit owns structure  
6. Prefer **contracts over copies** when promoting  
7. **Content portability** — marquee public content can load into a kit app without forking filters  

---

## 4. Feature set (target product)

Grouped by layer. **Must** items are R1; **Should** may land in R1 or early R2; **Could** is post-R1.

### 4.1 Content model (`@shellside/content-model`)

| Feature | Priority | Notes |
|---------|----------|-------|
| `visibility` draft/published + `isPublicItem` / `filterByVisibility` / `partitionDrafts` | **Must** | Done |
| Context helpers: admin preview flag pattern documented | **Must** | Marquee has `contentContextFromUrl`; kit documents pattern; optional pure helper if site-agnostic |
| Writing dual-read: legacy `status: draft` + `visibility` | **Should** | Marquee `isWritingPublic`; promote only the generic dual-read rule |
| Collection filter helpers (work / writing / records) | **Should** | Thin wrappers over visibility + site status maps |
| Schema fragments / Zod (or equivalent) for shared fields | **Could** | Keep site-specific enums in site |
| Multi-locale visibility | **Could** | Out of scope until needed |

### 4.2 Edit protocol (`@shellside/edit-protocol`)

| Feature | Priority | Notes |
|---------|----------|-------|
| Path grammar parse (`work:id:field`, profile/page two-segment) | **Must** | Stub exists; must match marquee 1:1 then marquee deletes duplicate |
| Well-formed / allowlist hooks | **Must** | Sites tighten further |
| Link leaf parse; tags path conventions | **Must** | Align with live-edit field kinds |
| Entity → filesystem resolution (contentRoot-relative) | **Should** | Pure path builder; no fs |
| Extensible kind registry (beyond work/writing/record/profile/page/archive) | **Could** | For non-portfolio kits |

### 4.3 Look (`@shellside/look`)

| Feature | Priority | Notes |
|---------|----------|-------|
| Canonical role ids + default `pathToLookRole` | **Must** | Expand until marquee can re-export |
| Weight/size/font option lists | **Must** | WEIGHT_* present; size/font option lists next |
| FieldStyle / dual-skin map types (`portfolio` \| `console`) | **Must** | Types exist |
| Look history contract (ids, retain days, safe snapshot ids) | **Must** | Partial |
| Look history **fs implementation** behind `contentRoot` / `historyDir` | **Should** | THREADS item; remove hard-coded cwd |
| Token name resolution helpers (size → CSS) | **Should** | Site supplies token maps |
| Per-skin isolation rules (portfolio tokens ≠ console skin) | **Should** | Capture as invariants + tests from marquee fixes |

### 4.4 DEV API (`@shellside/dev-api`)

| Feature | Priority | Notes |
|---------|----------|-------|
| Action + request/response types | **Must** | Partial in `contract.ts` |
| `isLoopbackHost` / DEV gate helpers | **Must** | Partial |
| **Factory**: `createDevContentHandler({ contentRoot, isDev, hostPolicy, allowlist })` | **Should** | Moves bulk of `dev-content.ts` + `content-edit` write path |
| Look history list/restore actions | **Should** | With look package |
| Auth plug-in interface (beyond loopback) | **Could** | Explicit non-goal for R1 |
| Production-safe no-op export for accidental imports | **Should** | Fail closed |

### 4.5 Dual surfaces (new packages or app layer)

| Feature | Priority | Package / home |
|---------|----------|----------------|
| **VFS projection contract** — node tree from collections (paths, file text builders hooks) | **Must** (R1) | `@shellside/console-vfs` (new) or `content-model` sibling — **no** personality, poems, CTF |
| Command registry shape (`ls`, `cat`, `help`, `cd`, …) | **Should** | Kit provides defaults; site adds verbs |
| Portfolio list/filter patterns (current/selected/complete) | **Should** | Document + small helpers; section chrome stays site |
| Plaintext / llms.txt emission helpers | **Should** | Same public filter; templates site-owned |
| Visibility **leak audit** script (build output + console island) | **Must** | Port spirit of marquee `check-public-output` + console draft audit |
| CRT/theme CSS | Stay site | Never kit-core |

### 4.6 Editorial desk

| Feature | Priority | Notes |
|---------|----------|-------|
| Live-edit contract doc (field kinds, role Look, rollback) | **Must** | `LIVE_EDIT.md` — keep in sync with marquee `LIVE_EDIT_MODE.md` |
| Preview bridge protocol (postMessage events typed) | **Should** | Extract message schema before full JS |
| Live-edit client package | **Could** (R1 late / R2) | Large; mount host + admin bridge adapters required |
| Admin shell chrome package | **Could** | Taste-heavy; optional template in reference app |
| Drafts in-section + draft badge chrome | **Must** (behavior) | Documented; site implements UI |

### 4.7 Reference app (`apps/reference`)

| Feature | Priority | Notes |
|---------|----------|-------|
| Package import smoke (`npm run check`) | **Must** | Partially via monorepo check |
| Minimal Astro app that can **load exported marquee content** | **Must** (R0) | Content portability host — §2.1 |
| Portfolio list/detail over real public graph | **Must** (R0) | Structural render, boring chrome |
| Console surface over same collection (boring VFS) | **Must** (R1) | Dual-surface proof |
| DEV desk stub (or full handler via dev-api factory) | **Should** | Even read-only admin notes page counts early |
| Toy sample content (draft + published) for offline CI without marquee checkout | **Must** | Fallback when export path unavailable |
| Scripted `export-marquee-content` (sibling path or env) | **Must** (R0) | Redact private paths; document flags |
| README “build your site” + “run with marquee content” | **Must** | Agent + human onboarding |

### 4.8 Tooling & quality

| Feature | Priority | Notes |
|---------|----------|-------|
| `npm run check` = build + unit tests + reference smoke | **Must** | Exists |
| `npm run build` on reference with fixture or exported content | **Must** (R0) | Prod mode |
| Leak audit on reference dist | **Must** (R0 basic / R1 full) | Drafts, redaction list |
| CI on push (private GH) | **Should** | Toy fixtures in CI; marquee export optional job if sibling present |
| Promotion checklist automation (no charlesberret strings in **packages**) | **Should** | Fixtures may hold real titles; packages must stay generic |
| Versioning / changelog per package | **Should** for R2 | Semver even while private |
| Create-site script / template | **Could** | R2 |

### 4.9 Explicit non-goals (through R1)

- Multi-tenant hosting  
- Remote multi-user auth / production write API  
- WYSIWYG block editor / database content  
- Cloning marquee console personality, monome, Enigma archive, deploy runners  
- Theme marketplace  
- Competing with Sanity/WordPress on features  
- **Pixel / brand parity** with charlesberret.net inside shellside  
- Treating shellside as a second deploy of the marquee site  

---

## 5. Phased delivery

Each phase has **exit criteria**. Prefer small promotions that marquee can absorb without a deploy crisis.

### Phase 0 — Stabilize the contract spine *(now → short)*

**Goal:** Shellside is the source of truth for pure helpers marquee already needs (**proof A** spine).

| Work | Detail |
|------|--------|
| Parity pass: edit-protocol | Diff marquee `parseContentPath` vs package; tests for every live path kind (links, tags, visibility, page, profile) |
| Parity pass: look roles | Expand `pathToLookRole` + role list until marquee can thin-wrap package |
| Marquee switch | Import `@shellside/edit-protocol` + `@shellside/look` for pure parts; delete duplicates only after green build |
| Docs | Keep `EXTRACTION_MAP` and this roadmap current after each promotion |
| Visibility leak checklist | Formalize marquee audit into `docs/VISIBILITY.md` leak checklist (already listed); track pass/fail in THREADS |

**Exit:** Marquee depends on content-model **and** edit-protocol **and** look (pure); `npm run check` green both repos. (Not yet full R0—needs Phase 0b content path.)

### Phase 0b — Content portability smoke *(R0 gate for proof B)*

**Goal:** Marquee public content loads into a shellside app and survives a **production build**.

| Work | Detail |
|------|--------|
| Export script | e.g. `scripts/export-marquee-content.mjs` — copy/sync content root; redact private paths; default source `../charlesberret.net/src/content` or `MARQUEE_ROOT` |
| Reference host | Minimal Astro routes: index/portfolio list (+ detail if cheap); uses `@shellside/content-model` filters |
| Toy fixture | Small draft+published set committed for CI without marquee present |
| Prod build + basic leak audit | `astro build`; assert drafts absent from dist; redaction list clean |
| Document | README: how to export and build; what “correct” means (§2.1) |

**Exit:** `npm run build` (reference + exported or fixture content) green; public graph structurally correct. Combined with Phase 0 → **R0 declared.**

### Phase 1 — Injectable runtime cores *(strengthens R0; not required to *declare* R0 if 0+0b pass)*

**Goal:** File-touching logic is package-owned with **injected roots**, not hard-coded paths.

| Work | Detail |
|------|--------|
| Look history fs | `createLookHistory({ contentRoot, historyDir, retainDays })` |
| Field-styles map I/O helpers | Load/save/merge role map; site supplies token resolution |
| DEV API factory | Host policy + DEV gate + allowlist + content write via edit-protocol |
| content-edit promote | Promote path resolve + write pure core; site keeps collection-specific YAML shapes if needed |
| Tests | Unit tests with temp dirs; no network |

**Exit:** Marquee `dev-content` / look-history are thin adapters; shellside owns testable cores.  
**Note:** R0 can be declared after **0 + 0b** even if Phase 1 is still open; Phase 1 should not block content portability.

### Phase 2 — Dual-surface kit + full content portability *(R1)*

**Goal:** A stranger (or future you) can run a second dual-surface site from shellside alone, **using marquee content as the acceptance fixture**.

| Work | Detail |
|------|--------|
| `@shellside/console-vfs` (or equivalent) | Build tree from filtered collections; `cat`/`ls` data only |
| Reference Astro app | Portfolio + console over **exported marquee content**; toy fixture remains for CI |
| Plaintext helper | Optional `toPlaintextListing(items)` — same public set as portfolio/console |
| Leak audit script in kit | Runnable against reference build; marquee may wrap with site-specific rules (Enigma paths stay site) |
| Admin preview context | Document + share pure URL flag helper if still duplicated |
| Export policy | Document which paths are always redacted; keep in sync with marquee private surfaces |

**Exit:** Portfolio + console + leak audit green on marquee public export. **R1 declared (private release).**

### Phase 3 — Editorial desk portability *(R1 late / R2 early)*

**Goal:** Live-edit is not a 3.5k one-off forever.

| Work | Detail |
|------|--------|
| Typed preview-bridge protocol | Shared event names/payloads |
| Extract live-edit in slices | Field open → save → Look auto-save → link/tag ops |
| Reference admin stub | Minimal dock or documented “bring your own admin chrome” |
| Marquee keeps personality chrome | Nav, monome, debug HUD stay site |

**Exit:** New site can mount live-edit against kit DEV API with site-owned admin layout.

### Phase 4 — Publishable packaging *(R2, optional)*

| Work | Detail |
|------|--------|
| Drop `file:../shellside` | workspace publish, private npm, or git+semver tags |
| Changelog + migration notes | Especially visibility + path grammar |
| Create-site / template | Clone reference → rename → content root |
| Decision: public vs private forever | Product, not engineering |

---

## 6. Sync protocol with charlesberret.net

Marquee moves weekly (live-edit, console, Look isolation, content). Shellside must **track**, not freeze.

### 6.1 Direction of travel

```
Marquee (prove)     ──extract stable──►  Shellside (own)
Shellside (fix)     ──import + delete──►  Marquee (thin)
Marquee content     ──export script───►  Reference / fixtures (proof B)
Reference (host)    ◄── packages only ──  Shellside
```

- **Never** dump experiments into marquee production. Prototype in `apps/reference` or packages.  
- **Never** promote taste (palette, type stacks, easter eggs, deploy).  
- **Never** treat shellside as a second marquee deploy (content fixture ≠ site clone).  
- **Always** promote after a marquee fix that reveals a missing invariant (e.g. portfolio Look tokens leaking into console skin → kit test + docs).  
- **After marquee content shape changes** (schemas, new collections, visibility rules): re-run export + reference prod build; fix kit or export redaction list.

### 6.2 Cadence

| Rhythm | Action |
|--------|--------|
| After any marquee fix in look / visibility / edit / console VFS | Ask: “Is this a contract?” If yes, open THREADS item or promote same week |
| After marquee content model or public-filter changes | Re-export + reference prod build / leak audit |
| Weekly (or when switching repos) | Skim marquee `git log` for `fix:`, `content-edit`, `look-`, `visibility`, `console` |
| Before marquee deploy | Marquee build green; if shellside packages changed, marquee `npm i` / lockfile refreshed |
| After each shellside promotion | Update `EXTRACTION_MAP.md`, this roadmap’s inventory table, marquee live-edit doc link if needed |

### 6.3 Promotion checklist (gate)

From `EXTRACTION_MAP.md` — mandatory:

1. No hard-coded project titles or charlesberret paths in **packages** (fixtures/export output may hold real titles)  
2. Unit tests for pure functions  
3. Marquee imports package and deletes local duplicate  
4. Docs updated in **both** repos  
5. `npm run check` green on shellside; marquee build green  
6. If the change touches filters/surfaces: reference **prod build** still passes leak audit (toy fixture minimum; marquee export when available)

### 6.4 Conflict rule

If marquee behavior and shellside contract diverge:

1. **Marquee is source of truth for product behavior** until the contract is updated.  
2. Update shellside + tests first, then re-point marquee.  
3. Do not leave two competing parsers/role maps.  
4. Content export failures → fix kit host or redaction policy; do not “fix” by copying marquee page chrome into shellside.

### 6.5 Dependency hygiene (marquee)

Today: `"@shellside/content-model": "file:../shellside/packages/content-model"`.

Through R1 this is fine. When promoting multiple packages, either:

- depend on each `file:../shellside/packages/…`, or  
- add a root workspace export / single `@shellside/kit` meta package later  

Avoid nesting marquee *inside* shellside workspaces (keeps deploy and ownership clear).

### 6.6 Export hygiene

| Do | Don’t |
|----|--------|
| Scripted, repeatable export | Hand-copy content into shellside as the long-term workflow |
| Redact private paths | Commit Enigma / private-only material |
| Prefer gitignored generated export + committed toy fixture | Commit full marquee tree into shellside forever |
| Compare public item sets (marquee public vs reference dist) when debugging | Require CSS/brand match |

---

## 7. Suggested package map at R1

```
packages/
  content-model/     # visibility + list context (exists)
  edit-protocol/     # path grammar (exists → parity)
  look/              # roles, weights, history fs factory (exists → expand)
  dev-api/           # handler factory + types (exists → implement)
  console-vfs/       # NEW: VFS projection from filtered content
apps/
  reference/         # dual-surface host + content portability target
fixtures/            # optional: toy content; generated marquee export (often gitignored)
scripts/
  export-marquee-content.mjs   # NEW (Phase 0b)
  check-public-output.mjs      # NEW (leak audit for reference dist)
docs/
  ARCHITECTURE.md
  VISIBILITY.md
  LIVE_EDIT.md
  EXTRACTION_MAP.md
  PRODUCT_NOTES.md
  ROADMAP.md         # this file
```

Optional later: `live-edit-protocol` (message types only), `create-shellside` CLI.

---

## 8. Milestone checklist (copy into issues / THREADS)

### R0 — Internal kit + content portability (smoke)

**Proof A — contracts**

- [x] edit-protocol parity (package). Marquee delete of local parse still open — `docs/MARQUEE_SWITCH.md`  
- [x] look pure parity (package). Marquee thin-wrap still open  
- [ ] Visibility leak checklist last passed on marquee  
- [x] CI: `npm run check` on shellside  

**Proof B — content → kit prod build**

- [x] `scripts/export-marquee-content` with redaction list  
- [x] Reference app loads exported content when present, else the toy (`MARQUEE_ROOT` / `REFERENCE_CONTENT`)  
- [x] Committed toy fixture for CI without marquee checkout  
- [x] Reference **prod** build on the fixture (`npm run check`)  
- [x] Reference prod build green on marquee export (local; needs the marquee checkout) — 2026-10-11: 10 work, 42 writing, 51 records; `writing.yaml` / `records.yaml` / `profile.yaml` load through `file()`, leak audit reads them  
- [x] Basic leak audit: no drafts in dist; redaction list clean  
- [x] README: export + build + “what correct means”  

**Phase 1 (strengthens R0; may trail declaration)**

- [ ] look-history factory with `contentRoot`  
- [ ] DEV API factory used by marquee (or documented adapter path)  

### R1 — Private release + full content portability

- [ ] Reference Astro app: **portfolio + console** over marquee public export  
- [ ] console-vfs (or equivalent) package with tests  
- [ ] Kit leak audit script green on reference dist (export + fixture)  
- [ ] Portfolio / console / plaintext agree on same public item set  
- [ ] README walkthrough: “from zero to dual-surface” + “with marquee content”  
- [ ] EXTRACTION_MAP: no open “promote soon” items that block dual-surface  
- [ ] PRODUCT_NOTES: positioning paragraph stable enough to quote  

### R2 — Publishable (optional)

- [ ] Semver tags / changelog  
- [ ] Install without sibling `file:` path  
- [ ] Create-site path  
- [ ] Public/private decision recorded  

---

## 9. Risk register

| Risk | Mitigation |
|------|------------|
| Kit becomes “clone of charlesberret.net” | Extraction map “stay site-local”; reference chrome deliberately boring; export is content-only |
| Content export becomes a second marquee | Redaction list; no deploy runners; structural fidelity only (§2.1) |
| Draft leaks via console / txt / llms | Leak audit as R0/R1 gate; same `isPublicItem` everywhere |
| Write API ships to production | DEV gate + loopback; build-time strip; fail-closed helpers |
| Divergent path parsers | Single package; marquee deletes local |
| Marquee velocity leaves kit stale | Sync protocol §6; re-export after content-model changes |
| Scope creep (CMS, auth, multi-tenant) | Non-goals §4.9; park in PRODUCT_NOTES |
| Huge live-edit extract blocks R1 | R1 does **not** require full live-edit package — dual surfaces + content portability suffice |
| CI depends on marquee checkout | Toy fixture committed; marquee export is local/optional job |

---

## 10. Immediate next actions (ordered)

1. **Marquee switch** — import `@shellside/edit-protocol` and `@shellside/look`; delete local parse and role map (`docs/MARQUEE_SWITCH.md`).  
2. **Re-export** marquee content and confirm the reference prod build + leak audit on that tree.  
3. **Look history factory** (`contentRoot`) — closes the Phase 1 THREADS item.  
4. Then: console-vfs + dual-surface on export (**R1**); DEV API factory and larger content-edit promote as capacity allows.

---

## 11. Success criteria (narratives)

### R0 narrative

You can:

1. Point shellside at marquee content via the export script (or `MARQUEE_ROOT`).  
2. Run a **production build** of the reference host and see the **public** work/writing/records graph render with boring chrome.  
3. Confirm drafts and redacted private paths are **absent** from dist.  
4. Confirm marquee still builds while importing shellside pure contracts (no parallel visibility/parse/role maps for promoted pieces).  
5. Run CI on shellside with the **toy fixture** alone.

When that is true, Shellside is an **internal kit with proven content portability**—not yet a full dual-surface private release.

### R1 narrative

You can:

1. Clone shellside, `npm i && npm run check`, run `apps/reference` (fixture or export).  
2. See the **same** public project as a portfolio card and as `cat projects/foo.md` in the console.  
3. Mark an item `visibility: draft` and confirm it vanishes from public surfaces and remains in admin/DEV context.  
4. Re-export from marquee after content edits and still get a green prod build + leak audit.  
5. Point marquee at the same packages without maintaining parallel parsers/role maps.  
6. Onboard an agent from `AGENTS.md` + `docs/*` without reading the entire marquee tree.

When that is true, Shellside is **released** as a private dual-surface framework — and charlesberret.net remains the craft marquee, not the only place the architecture exists.
