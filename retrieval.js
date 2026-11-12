// LearnLink retrieval: chunk the faculty modules, then rank passages with BM25 (keywords)
// and dense embeddings (meaning), and fuse the two rankings with Reciprocal Rank Fusion.
// No dependencies. Embeddings come from Ollama; if they are unavailable, BM25 still works.
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");

/* ---------- text -> tokens ---------- */
const STOP = new Set("a an the of to in on for and or is are was were be been what which who how why when does do did it its this that these those with as by at from can you i me my we our your about into than then so if not no between use used using explain define difference tell give should would could there their they them have has had important importance mean means meaning please help know want like thing things example examples simple simply".split(" "));
const stem = (w) => {
  if (w.length <= 4) return w;
  if (w.endsWith("ies")) return w.slice(0, -3) + "y";
  const m = w.replace(/(ing|ed|es|s|ly)$/, "");
  return m.length >= 3 ? m : w;
};
const tokenize = (t) => (t.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => !STOP.has(w)).map(stem);

/* ---------- markdown -> chunks ---------- */
// One chunk = one paragraph. A bullet list is glued to the paragraph above it so definitions
// stay next to their introduction. Long paragraphs are split on sentence boundaries.
function chunkMarkdown(md) {
  const clean = (s) => s.replace(/\*\*|`/g, "").replace(/^[-*]\s+/gm, "• ").trim();
  const blocks = md.replace(/\r/g, "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  let title = "";
  const out = [];
  for (let b of blocks) {
    if (/^#{1,3}\s/.test(b)) {
      const lines = b.split("\n");
      title = lines[0].replace(/^#+\s*/, "").trim();
      b = lines.slice(1).join("\n").trim();
      if (!b) continue;
    }
    const isList = /^[-*]\s/.test(b);
    const text = clean(b);
    if (isList && out.length && out[out.length - 1].text.length + text.length < 1400) {
      out[out.length - 1].text += "\n" + text;
      continue;
    }
    if (text.length <= 900) { out.push({ module: title, text }); continue; }
    let cur = "";
    for (const s of text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [text]) {
      if ((cur + s).length > 600 && cur) { out.push({ module: title, text: cur.trim() }); cur = ""; }
      cur += s;
    }
    if (cur.trim()) out.push({ module: title, text: cur.trim() });
  }
  return out;
}

/* ---------- load the knowledge base from modules/<course>/*.md ---------- */
function loadKB(dir) {
  let courses = {};
  try { courses = JSON.parse(fs.readFileSync(path.join(dir, "courses.json"), "utf8")); } catch {}
  const chunks = [];
  for (const id of fs.readdirSync(dir).sort()) {
    const cdir = path.join(dir, id);
    if (!fs.statSync(cdir).isDirectory()) continue;
    const meta = courses[id] || { name: id, college: "" };
    for (const f of fs.readdirSync(cdir).filter((x) => x.endsWith(".md")).sort()) {
      chunkMarkdown(fs.readFileSync(path.join(cdir, f), "utf8")).forEach((c, i) => {
        // The module title is part of the searchable text, so "risk management" finds Module 3.
        const tk = tokenize(c.module + " " + c.text);
        const tf = {}; tk.forEach((t) => (tf[t] = (tf[t] || 0) + 1));
        chunks.push({ id: `${id}/${f}#${i}`, courseId: id, course: meta.name, college: meta.college, module: c.module, text: c.text, len: tk.length, tf, vec: null });
      });
    }
  }
  const df = {};
  chunks.forEach((c) => Object.keys(c.tf).forEach((t) => (df[t] = (df[t] || 0) + 1)));
  const avg = chunks.reduce((s, c) => s + c.len, 0) / Math.max(1, chunks.length);
  return { chunks, df, N: chunks.length, avg, courses, dense: false };
}

/* ---------- BM25 ---------- */
// score(q, d) = sum over query terms t of idf(t) * f(t,d)*(k1+1) / (f(t,d) + k1*(1 - b + b*|d|/avg))
function bm25(kb, qTokens, pool) {
  const k1 = 1.5, b = 0.75;
  const idf = (n) => Math.log(1 + (kb.N - n + 0.5) / (n + 0.5));
  const best = qTokens.reduce((s, t) => s + idf(kb.df[t] || 0) * (k1 + 1), 0) || 1; // best possible score, for 0..1 scaling
  const res = [];
  for (const c of pool) {
    let s = 0;
    for (const t of qTokens) {
      const f = c.tf[t];
      if (f) s += (idf(kb.df[t]) * f * (k1 + 1)) / (f + k1 * (1 - b + (b * c.len) / kb.avg));
    }
    if (s > 0) res.push({ c, score: Math.min(1, s / best), raw: s });
  }
  return res.sort((a, b) => b.score - a.score);
}

/* ---------- dense embeddings (Ollama) ---------- */
const cosine = (a, b) => { let d = 0, na = 0, nb = 0; for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; } return d / (Math.sqrt(na * nb) || 1); };
const prefixes = (model) => (/nomic/i.test(model) ? { doc: "search_document: ", query: "search_query: " } : { doc: "", query: "" });

async function embedTexts(host, model, texts) {
  const r = await fetch(`${host}/api/embed`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model, input: texts }), signal: AbortSignal.timeout(60000) });
  const j = await r.json();
  if (!r.ok || !Array.isArray(j.embeddings)) throw new Error((j && j.error) || "embed_failed");
  return j.embeddings;
}

// Embed every chunk once; reuse vectors from .cache/embeddings.json when the text has not changed.
async function embedKB(kb, host, model, cacheFile) {
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(cacheFile, "utf8")); } catch {}
  const p = prefixes(model), key = (c) => crypto.createHash("sha1").update(model + "|" + c.module + "|" + c.text).digest("hex");
  const todo = kb.chunks.filter((c) => !(c.vec = cache[key(c)] || null));
  for (let i = 0; i < todo.length; i += 32) {
    const batch = todo.slice(i, i + 32);
    const vecs = await embedTexts(host, model, batch.map((c) => p.doc + c.module + ". " + c.text));
    batch.forEach((c, j) => (c.vec = vecs[j]));
  }
  if (todo.length) {
    const out = {}; kb.chunks.forEach((c) => (out[key(c)] = c.vec));
    try { fs.mkdirSync(path.dirname(cacheFile), { recursive: true }); fs.writeFileSync(cacheFile, JSON.stringify(out)); } catch {}
  }
  kb.dense = true;
  return todo.length;
}

/* ---------- hybrid search ---------- */
// level 1 (loose) .. 5 (strict) moves both relevance gates; a passage must clear at least one gate.
const RAW_MIN = 1.5;
const GATES = { bm25: [0.10, 0.15, 0.20, 0.28, 0.36], dense: [0.50, 0.55, 0.60, 0.65, 0.70] };

async function search(kb, question, o) {
  const { scope, allowed, topK = 3, level = 3, embed } = o || {};
  // allowed (array of course ids) hides courses linked to a Classroom class the student is not on
  const ok = allowed ? new Set(allowed) : null;
  const pool = kb.chunks.filter((c) => (!scope || c.course === scope || c.courseId === scope) && (!ok || ok.has(c.courseId)));
  const qt = [...new Set(tokenize(question))];
  const lv = Math.min(5, Math.max(1, +level || 3)) - 1;

  // Two gates: relative (how much of the query matched) and absolute (a single common word like "important" must not pass).
  const kw = bm25(kb, qt, pool).filter((h) => h.score >= GATES.bm25[lv] && h.raw >= RAW_MIN);
  let dn = [], retrieval = "bm25";
  if (kb.dense && embed) {
    try {
      const qv = (await embed(question))[0];
      dn = pool.filter((c) => c.vec).map((c) => ({ c, score: cosine(qv, c.vec) })).sort((a, b) => b.score - a.score).filter((h) => h.score >= GATES.dense[lv]);
      retrieval = "hybrid";
    } catch { /* embedding service down: fall back to keywords only */ }
  }

  // Reciprocal Rank Fusion: each list votes 1/(60 + rank); passages ranked well by both lists win.
  const fused = new Map();
  [kw, dn].forEach((list) => list.slice(0, 10).forEach((h, rank) => {
    const e = fused.get(h.c) || { c: h.c, rrf: 0, bm25: 0, dense: 0 };
    e.rrf += 1 / (60 + rank + 1);
    if (list === kw) e.bm25 = h.score; else e.dense = h.score;
    fused.set(h.c, e);
  }));
  const hits = [...fused.values()].sort((a, b) => b.rrf - a.rrf).slice(0, topK);
  return { hits, retrieval, queryTokens: qt };
}

module.exports = { loadKB, embedKB, embedTexts, prefixes, search, chunkMarkdown, tokenize, bm25, cosine };
