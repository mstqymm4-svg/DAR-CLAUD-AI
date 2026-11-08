// Downloads every file hosted on Base44 (base44.app / media.base44.com) that the
// code or data references, saves it into public/migrated/, and rewrites the
// references to local paths. Run it from a machine with normal internet access:
//   node scripts/migrate-assets.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";
import { createHash } from "node:crypto";

const URL_RE = /https:\/\/(?:base44\.app|media\.base44\.com)\/[^\s"'<>)\\]+/g;
const ROOTS = ["src", "public", "index.html", "data-export"];
const OUT = "public/migrated";

function walk(p, acc = []) {
  const s = statSync(p);
  if (s.isDirectory()) {
    if (p === OUT) return acc;
    for (const f of readdirSync(p)) walk(join(p, f), acc);
  } else if (/\.(jsx?|tsx?|json|html|css)$/.test(p)) acc.push(p);
  return acc;
}

const files = ROOTS.flatMap((r) => { try { return walk(r); } catch { return []; } });
const urls = new Map();
for (const f of files) for (const u of readFileSync(f, "utf8").match(URL_RE) || []) urls.set(u, null);
mkdirSync(OUT, { recursive: true });

for (const u of urls.keys()) {
  const ext = extname(new URL(u).pathname) || ".bin";
  const name = createHash("sha1").update(u).digest("hex").slice(0, 10) + "_" + basename(new URL(u).pathname).slice(0, 40);
  try {
    const r = await fetch(u);
    if (!r.ok) throw new Error(r.status);
    writeFileSync(join(OUT, name), Buffer.from(await r.arrayBuffer()));
    urls.set(u, `/migrated/${name}`);
    console.log("✓", u);
  } catch (e) { console.warn("✗", u, String(e)); }
}

for (const f of files) {
  let t = readFileSync(f, "utf8"), changed = false;
  for (const [u, local] of urls) if (local && t.includes(u)) { t = t.split(u).join(local); changed = true; }
  if (changed) writeFileSync(f, t);
}
console.log(`Done: ${[...urls.values()].filter(Boolean).length}/${urls.size} files migrated.`);
