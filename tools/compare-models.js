// Compare language models on LearnLink's real pipeline (same retrieval, same prompts as server.js).
//
//   node tools/compare-models.js qwen3.5:4b gemma3:4b llama3.1:8b-instruct-q4_K_M
//
// For each model it starts a private copy of server.js on port 3199 (copied to a temp folder, so the real
// logs/queries.jsonl is not touched; no login, no PHP, no Classroom sync), asks the questions below one at a time,
// then unloads the model. Results: logs/model-compare/<date>.md (readable) and .json (raw).
"use strict";
const fs = require("fs"), path = require("path"), os = require("os"), { spawn } = require("child_process");

const ROOT = path.join(__dirname, "..");
const PORT = 3199, BASE = `http://127.0.0.1:${PORT}`;
const MODELS = process.argv.slice(2);
if (!MODELS.length) { console.log("Usage: node tools/compare-models.js <model> [model ...]"); process.exit(1); }

// expect: "cite" = should answer from the modules with [n] citations; "refuse" = not in the modules, must not invent;
// "general" = clearly outside the courses (a labeled general answer is fine); "chat" = small talk.
const QUESTIONS = [
  { q: "what's the difference between ethics and morality?", expect: "cite", topic: "GE Ethics" },
  { q: "explain utilitarianism vs deontology", expect: "cite", topic: "GE Ethics" },
  { q: "what is algorithmic bias and why should developers care?", expect: "cite", topic: "GE Ethics" },
  { q: "how is popular culture different from folk culture?", expect: "cite", topic: "GE PPC" },
  { q: "ano ang teleserye at OPM?", expect: "cite", topic: "GE PPC (Filipino)" },
  { q: "what is the CIA triad", expect: "cite", topic: "Information Assurance" },
  { q: "how do you compute risk and what can a company do about it?", expect: "cite", topic: "Information Assurance" },
  { q: "difference between hashing and encryption", expect: "cite", topic: "Information Assurance" },
  { q: "why does that matter for integrity?", expect: "cite", topic: "Follow-up (uses the chat so far)",
    history: [
      { role: "user", content: "difference between hashing and encryption" },
      { role: "assistant", content: "Encryption turns plaintext into ciphertext with a key, and it can be reversed with the key [1]. Hashing is one-way: it gives data a fixed-length fingerprint [1]." }
    ] },
  { q: "kailan dapat gamitin ang flexbox vs grid?", expect: "cite", topic: "Prof Elec 2 (Taglish)" },
  { q: "what's the difference between reliability and validity", expect: "cite", topic: "Research Methods" },
  { q: "mean median mode pls explain with an example", expect: "cite", topic: "Research Methods" },
  { q: "what does Kant's categorical imperative say about lying?", expect: "cite", topic: "Partly covered (no lying in the module)" },
  { q: "what is SQL injection and how do I prevent it?", expect: "refuse", topic: "Not in modules (sounds like IA)" },
  { q: "how do i cook adobo", expect: "general", topic: "Off-topic" },
  { q: "who won the 2022 FIFA World Cup?", expect: "general", topic: "Off-topic" },
  { q: "hi kumusta ka", expect: "chat", topic: "Small talk" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const env = (() => { const o = {}; try { fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/).forEach((l) => { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/); if (m) o[m[1]] = m[2].replace(/\s+#.*$/, "").trim().replace(/^["']|["']$/g, ""); }); } catch {} return o; })();
const OLLAMA = (env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/$/, "");

// A private copy of the server: its own logs/ folder, the same modules and embeddings cache.
function makeCopy() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "learnlink-compare-"));
  for (const f of ["server.js", "retrieval.js", "prompts.js", ".env"]) if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(d, f));
  fs.cpSync(path.join(ROOT, "modules"), path.join(d, "modules"), { recursive: true });
  if (fs.existsSync(path.join(ROOT, ".cache"))) fs.cpSync(path.join(ROOT, ".cache"), path.join(d, ".cache"), { recursive: true });
  fs.mkdirSync(path.join(d, "public"), { recursive: true });
  return d;
}

async function json(url, body) {
  const r = await fetch(url, body ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {});
  return r.json();
}

async function runModel(dir, model) {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: dir, stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: String(PORT), HOST: "127.0.0.1", MODEL: model, REQUIRE_LOGIN: "false", RATE_PER_MIN: "100000",
      PHP_API: "http://127.0.0.1:9/api", RELOAD_KEY: "compare-test-only", KEEP_ALIVE: "10m" },
  });
  let log = "";
  child.stdout.on("data", (b) => (log += b)); child.stderr.on("data", (b) => (log += b));
  try {
    let st = null;
    for (let i = 0; i < 240; i++) {                       // wait for the server, the model load and the embeddings
      try { st = await json(`${BASE}/api/status`); if (st.modelInstalled && st.embed !== "starting" && /Model loaded/.test(log)) break; } catch {}
      await sleep(500);
    }
    if (!st || !st.modelInstalled) throw new Error("server or model not ready:\n" + log);
    const loadS = (log.match(/Model loaded in ([\d.]+) s/) || [])[1];
    await json(`${BASE}/api/ai`, { q: "what is a value in ethics?" });   // warm-up, not counted
    let vram = null;
    try { const ps = await json(`${OLLAMA}/api/ps`); const m = (ps.models || []).find((x) => x.name === model || x.model === model); if (m) vram = { size: m.size, gpu: m.size_vram }; } catch {}
    const answers = [];
    for (const [i, t] of QUESTIONS.entries()) {
      const out = await json(`${BASE}/api/ai`, { q: t.q, history: t.history || [] });
      answers.push({ ...t, ...out, check: check(t, out) });
      process.stdout.write(`  ${String(i + 1).padStart(2)}. ${answers[i].check.ok ? "ok  " : "MISS"} ${(out.timings ? (out.timings.generateMs / 1000).toFixed(1) + " s" : out.error)}  ${t.q}\n`);
    }
    return { model, retrieval: st.embed === "ready" ? "hybrid" : "keyword", loadS: loadS ? +loadS : null, vram, answers };
  } finally {
    child.kill();
    try { await json(`${OLLAMA}/api/generate`, { model, keep_alive: 0 }); } catch {}   // free the GPU for the next model
    await sleep(1500);
  }
}

// Automatic checks. They only catch the obvious; read the answers for quality.
const NOT_FOUND = /couldn.t find that in your course modules/i;
function check(t, out) {
  if (out.error) return { ok: false, why: "error: " + out.error };
  const text = out.text || "", cited = /\[\d+\]/.test(text), nf = NOT_FOUND.test(text);
  if (t.expect === "cite") return cited && !nf ? { ok: true } : { ok: false, why: nf ? "said not found" : out.mode !== "grounded" ? "no module passages found (" + out.mode + ")" : "no [n] citation" };
  if (t.expect === "refuse") return out.mode !== "grounded" || nf ? { ok: true } : { ok: false, why: "answered from unrelated passages instead of saying not found" };
  if (t.expect === "general") return out.mode === "general" || nf ? { ok: true } : { ok: false, why: "mode " + out.mode + (cited ? ", cited modules" : "") };
  return out.mode === "chat" ? { ok: true } : { ok: false, why: "mode " + out.mode };
}

async function unloadAll() {
  try { const ps = await json(`${OLLAMA}/api/ps`); for (const m of ps.models || []) await json(`${OLLAMA}/api/generate`, { model: m.name, keep_alive: 0 }); } catch {}
  await sleep(1000);
}

const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const s1 = (ms) => (ms / 1000).toFixed(1) + " s";
const gb = (b) => (b / 1e9).toFixed(1) + " GB";

function report(results) {
  const L = [`# Model comparison, ${new Date().toLocaleString()}`, "",
    `${QUESTIONS.length} questions per model, asked one at a time on this PC, through LearnLink's real retrieval and prompts. ` +
    `Settings from .env: NUM_CTX ${env.NUM_CTX || 4096}, TEMPERATURE ${env.TEMPERATURE || 0.5}, NUM_PREDICT ${env.NUM_PREDICT || 300}.`, "",
    "| Model | Retrieval | Load time | Size in GPU | First word (avg) | Full answer (avg / slowest) | Auto checks passed |",
    "|---|---|---|---|---|---|---|"];
  for (const r of results) {
    const t = r.answers.filter((a) => a.timings && a.mode !== "none").map((a) => a.timings);
    L.push(`| \`${r.model}\` | ${r.retrieval} | ${r.loadS ? r.loadS + " s" : "?"} | ${r.vram ? gb(r.vram.gpu) + (r.vram.gpu < r.vram.size ? " of " + gb(r.vram.size) + " (part on CPU)" : "") : "?"} | ` +
      `${s1(avg(t.map((x) => x.firstTokenMs)))} | ${s1(avg(t.map((x) => x.generateMs)))} / ${s1(Math.max(...t.map((x) => x.generateMs)))} | ` +
      `${r.answers.filter((a) => a.check.ok).length} / ${r.answers.length} |`);
  }
  L.push("", "Auto checks: module questions must cite [n]; \"not in modules\" must not be answered from unrelated passages; off-topic gets a labeled general answer; small talk stays small talk. Read the answers below for quality.", "");
  QUESTIONS.forEach((t, i) => {
    L.push(`## ${i + 1}. ${t.q}`, "", `*${t.topic}. Expected: ${{ cite: "answer from the modules with citations", refuse: "say it is not in the modules", general: "labeled general answer", chat: "short friendly reply" }[t.expect]}.*`, "");
    for (const r of results) {
      const a = r.answers[i];
      L.push(`**${r.model}**: ${a.check.ok ? "ok" : "MISS (" + a.check.why + ")"}, ${a.timings ? s1(a.timings.generateMs) : "-"}, mode ${a.mode || "-"}`, "",
        "> " + String(a.text || a.error || "").trim().replace(/\n+/g, "\n> "), "");
    }
  });
  return L.join("\n");
}

(async () => {
  try { const r = await fetch(`${OLLAMA}/api/tags`); if (!r.ok) throw 0; } catch { console.log(`Ollama is not running at ${OLLAMA}. Start it first.`); process.exit(1); }
  try { await fetch(`${BASE}/api/status`); console.log(`Port ${PORT} is already in use. Stop whatever runs there first.`); process.exit(1); } catch {}
  const dir = makeCopy(), results = [];
  // Build the search index (embeddings) once, before any model is loaded. Doing it while a model loads can time out on
  // a 6 GB GPU, and then that model would get keyword-only search: an unfair comparison.
  try {
    const R = require(path.join(ROOT, "retrieval.js")), em = env.EMBED_MODEL || "nomic-embed-text";
    await unloadAll();
    const kb = R.loadKB(path.join(dir, "modules"));
    const n = await R.embedKB(kb, OLLAMA, em, path.join(dir, ".cache", "embeddings.json"));
    console.log(`Search index ready (${em}, ${n} passages embedded now, ${kb.N} in total): every model gets hybrid search.`);
    await unloadAll();
  } catch (e) { console.log(`Embeddings unavailable (${e.message}): every model gets keyword-only search.`); }
  try {
    for (const m of MODELS) {
      console.log(`\n${m}`);
      try { results.push(await runModel(dir, m)); }
      catch (e) { console.log("  skipped: " + e.message.split("\n")[0]); }
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  if (!results.length) process.exit(1);
  const out = path.join(ROOT, "logs", "model-compare"), stamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, stamp + ".json"), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(out, stamp + ".md"), report(results));
  console.log("\n" + report(results).split("\n").slice(0, 6 + results.length).join("\n"));
  console.log(`\nFull report: logs/model-compare/${stamp}.md`);
})();
