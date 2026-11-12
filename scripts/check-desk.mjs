/**
 * Dev-mode smoke for the desk surfaces — the only coverage for routes
 * that exist solely under `astro dev` (/admin + /api/dev-content); the
 * production build can't see them by design.
 *
 * Boots the reference app's dev server on a free port, asserts /admin
 * serves and enumerates editable paths, exercises a read → write →
 * restore round trip on a real path, and checks the deny path.
 * Exits nonzero on any failure; restores the original value on the way
 * out whatever happens.
 */
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const failures = [];
const check = (name, ok, detail = "") => {
  if (ok) console.log(`  ok  ${name}`);
  else {
    console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
    failures.push(name);
  }
};

const freePort = () =>
  new Promise((resolve, reject) => {
    const s = net.createServer().listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
    s.on("error", reject);
  });

const waitReady = async (base, ms) => {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${base}/`, { signal: AbortSignal.timeout(2000) });
      if (r.status < 500) return true;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
};

const getJson = (url) => fetch(url).then((r) => r.json());
const postJson = (body) =>
  fetch(`${base}/api/dev-content`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const port = await freePort();
const base = `http://127.0.0.1:${port}`;
const dev = spawn(
  "npm",
  ["run", "dev", "-w", "@shellside/reference", "--", "--port", String(port), "--host", "127.0.0.1"],
  { cwd: root, detached: true, stdio: ["ignore", "pipe", "pipe"] },
);
let devLog = "";
dev.stdout.on("data", (d) => (devLog += d));
dev.stderr.on("data", (d) => (devLog += d));

const killDev = () => {
  try {
    process.kill(-dev.pid, "SIGTERM");
  } catch {
    dev.kill("SIGTERM");
  }
};
process.on("SIGINT", () => {
  killDev();
  process.exit(130);
});

try {
  check("dev server ready", await waitReady(base, 60_000), devLog.slice(-1500));
  if (failures.length) throw new Error("aborting — server never came up");

  // /admin serves and enumerates real editable paths
  const admin = await fetch(`${base}/admin`);
  check("GET /admin → 200", admin.status === 200, `status ${admin.status}`);
  const html = await admin.text();
  const paths = [...html.matchAll(/data-path="([^"]+)"/g)].map((m) => m[1]);
  check("/admin lists editable paths", paths.length > 0, `found ${paths.length}`);

  // find one whose payload is a plain string — write probes need strings
  let editPath;
  let original;
  for (const p of paths) {
    const j = await getJson(`${base}/api/dev-content?path=${encodeURIComponent(p)}`);
    if (j.ok && typeof j.value === "string" && j.value.length < 500) {
      editPath = p;
      original = j.value;
      break;
    }
  }
  check("string-valued editable path readable", Boolean(editPath), editPath ?? "none found");

  if (editPath) {
    const api = `${base}/api/dev-content?path=${encodeURIComponent(editPath)}`;
    const probe = `desk-smoke ${Date.now()}`;

    const write = await postJson({ path: editPath, value: probe });
    const writeJson = await write.json();
    check("POST write → ok", write.status === 200 && writeJson.ok === true, `${write.status} ${writeJson.error ?? ""}`);

    const reread = await getJson(api);
    check("value persisted", reread.value === probe, `got ${JSON.stringify(reread.value)}`);

    // restore — always, whatever the assertions recorded
    try {
      const restore = await postJson({ path: editPath, value: original });
      const restoreJson = await restore.json();
      check("restore original → ok", restore.status === 200 && restoreJson.ok === true, `${restore.status} ${restoreJson.error ?? ""}`);
      const final = await getJson(api);
      check("original restored", final.value === original, `got ${JSON.stringify(final.value)}`);
    } catch (e) {
      check("restore original → ok", false, String(e));
    }
  }

  const badGet = await fetch(`${base}/api/dev-content?path=bogus:x:y`);
  const badGetJson = await badGet.json();
  check("GET bogus path → 400 bad_path", badGet.status === 400 && badGetJson.error === "bad_path", `${badGet.status} ${badGetJson.error ?? ""}`);

  const badPost = await postJson({ path: "bogus:x:y", value: "x" });
  const badPostJson = await badPost.json();
  check("POST bogus path → 400 bad_path", badPost.status === 400 && badPostJson.error === "bad_path", `${badPost.status} ${badPostJson.error ?? ""}`);
} catch (e) {
  failures.push(String(e));
} finally {
  killDev();
}

if (failures.length) {
  console.error(`\ncheck-desk: FAILED (${failures.join(", ")})`);
  if (devLog) console.error(`--- dev server tail ---\n${devLog.slice(-3000)}`);
  process.exit(1);
}
console.log("\ncheck-desk: ok");
