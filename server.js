// LearnLink server: serves the pages, retrieves passages from the faculty modules, and asks a
// LOCAL language model (Ollama) to write the answer. No cloud API, no dependencies. Needs Node 18+.
"use strict";
const http = require("http"), fs = require("fs"), path = require("path"), zlib = require("zlib");
const R = require("./retrieval");
const { PERSONA, GROUNDED, GENERAL_RULES, CHAT_RULES } = require("./prompts");   // the prompt texts

// Tiny .env loader, so you don't need any package for it. A "# comment" after a value is ignored (same as api/_env.php).
try {
  fs.readFileSync(path.join(__dirname, ".env"), "utf8").split(/\r?\n/).forEach((l) => {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/\s+#.*$/, "").trim().replace(/^["']|["']$/g, "");
  });
} catch {}

const E = process.env;
const PORT = +E.PORT || 3000;
const HOST = E.HOST || "0.0.0.0";                         // 0.0.0.0 = reachable from the campus LAN
const OLLAMA = (E.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/$/, "");
const MODEL = E.MODEL || "gemma3:4b";
const EMBED_MODEL = E.EMBED_MODEL || "nomic-embed-text";
const NUM_CTX = +E.NUM_CTX || 4096;                        // keep small: the KV cache shares 6 GB of VRAM with the weights
const TEMPERATURE = E.TEMPERATURE !== undefined ? +E.TEMPERATURE : 0.5;
const MAX_CONCURRENT = +E.MAX_CONCURRENT || 1;             // generations running at once on the GPU
const NUM_PREDICT = +E.NUM_PREDICT || 300;                  // longest answer in tokens; the prompt asks for about 5 sentences at most
// How long Ollama keeps the model in GPU memory after the last question. Loading it again takes several seconds,
// so keep it long on the campus server. "-1" = keep it loaded for as long as Ollama runs.
const KEEP_ALIVE = /^-?\d+$/.test(E.KEEP_ALIVE || "") ? +E.KEEP_ALIVE : E.KEEP_ALIVE || "4h";
const RATE_PER_MIN = +E.RATE_PER_MIN || 30;
const ALLOW_GENERAL = E.ALLOW_GENERAL !== "false";         // answers outside the modules (always labeled)
const PHP_API = (E.PHP_API || "http://127.0.0.1/learnlink/api").replace(/\/$/, "");   // Laragon (Apache + PHP + MySQL): accounts, courses, uploads, chats, feedback
const RELOAD_KEY = E.RELOAD_KEY || "";                      // PHP shows this key to ask for a reload after teachers change materials
const REQUIRE_LOGIN = E.REQUIRE_LOGIN !== "false";          // AI answers only for logged-in users
const PUB = path.join(__dirname, "public");
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json", ".woff2": "font/woff2", ".jpg": "image/jpeg", ".webp": "image/webp" };

/* ---------- which prompt ---------- */
// Greetings and small talk get CHAT_RULES and no module search. Up to three greeting words in a row, each optionally
// followed by a filler word ("hi kumusta ka", "hello po good morning", "thanks po"). "hi what is X" is a real question.
const GREET = "hi+|hello+|hey+|yo|sup|kumusta|kamusta|musta|good (morning|afternoon|evening)|thanks?( you)?( so much)?|ty|salamat|ok(ay)?|nice|cool|lol|haha+|hmm+|bye|goodbye|how are you.{0,15}|what'?s up";
const SMALLTALK = new RegExp(`^((${GREET})( (ka|po|there|everyone|guys|lang|naman|din|ulit|again))*[\\s!.?,]*){1,3}$`, "i");

/* ---------- knowledge base ---------- */
// modules/ is rebuilt from the database by PHP whenever a teacher uploads, hides or deletes something, then PHP calls /api/reload.
const embed = (q) => R.embedTexts(OLLAMA, EMBED_MODEL, [R.prefixes(EMBED_MODEL).query + q]);
let kb, embedState = "starting", embedJob = Promise.resolve();
function buildKB() {
  const k = R.loadKB(path.join(__dirname, "modules"));
  kb = k; embedState = "starting";                              // keyword search works at once; embeddings join in when ready
  embedJob = (async () => {
    try {
      const n = await R.embedKB(k, OLLAMA, EMBED_MODEL, path.join(__dirname, ".cache", "embeddings.json"));
      if (kb === k) embedState = "ready";
      console.log(`Embeddings ready (${EMBED_MODEL}, ${n} new of ${k.N} passages). Retrieval: hybrid`);
    } catch (e) {
      if (kb === k) embedState = "off";
      console.log(`Embeddings unavailable (${e.message}). Retrieval: keyword (BM25) only. Fix: ollama pull ${EMBED_MODEL}`);
    }
  })();
}
buildKB();

/* ---------- Ollama (streaming) ---------- */
// Streams tokens from Ollama. onToken(text) is called as they arrive; the full text is returned.
async function chat(messages, onToken, signal) {
  const ac = new AbortController(), timer = setTimeout(() => ac.abort(), 120000);
  if (signal) signal.addEventListener("abort", () => ac.abort());
  const body = { model: MODEL, stream: true, keep_alive: KEEP_ALIVE, messages, options: { temperature: TEMPERATURE, top_p: 0.9, repeat_penalty: 1.1, num_ctx: NUM_CTX, num_predict: NUM_PREDICT } };
  const go = async (b) => {
    const r = await fetch(`${OLLAMA}/api/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(b), signal: ac.signal });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw { code: r.status === 404 ? 503 : 502, msg: (j && j.error) || "model_error" }; }
    let full = "", buf = "";
    const dec = new TextDecoder();
    for await (const part of r.body) {
      buf += dec.decode(part, { stream: true });
      const lines = buf.split("\n"); buf = lines.pop();
      for (const l of lines) {
        if (!l.trim()) continue;
        let j; try { j = JSON.parse(l); } catch { continue; }
        if (j.error) throw { code: 502, msg: j.error };
        const t = j.message && j.message.content;
        if (t) { full += t; if (onToken) onToken(t); }
      }
    }
    return full;
  };
  const wantsThink = /qwen3/i.test(MODEL);                 // Qwen3 "thinks" first unless told not to: too slow for a study chat
  try {
    let out;
    try { out = await go(wantsThink ? { ...body, think: false } : body); }
    catch (e) { if (wantsThink && /think/i.test(String(e.msg))) out = await go(body); else throw e; }
    return out.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  } finally { clearTimeout(timer); }
}

// Load the model into GPU memory now, so the first student doesn't wait for it. An empty chat only loads it.
// num_ctx must match the real requests, or Ollama loads the model a second time with the other size.
async function warmUp() {
  const t = Date.now();
  try {
    const r = await fetch(`${OLLAMA}/api/chat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: MODEL, messages: [], keep_alive: KEEP_ALIVE, options: { num_ctx: NUM_CTX } }), signal: AbortSignal.timeout(180000) });
    if (r.ok) console.log(`Model loaded in ${((Date.now() - t) / 1000).toFixed(1)} s (kept in memory: ${KEEP_ALIVE})`);
  } catch {}
}

// Only MAX_CONCURRENT generations run at once; the rest wait in line. The wait is reported so it can be measured.
// onWait(n) tells a waiting student their place in line (1 = next). A cancelled question leaves the line.
let running = 0; const waiting = [];
function acquire(onWait, signal) {
  return new Promise((res, rej) => {
    const t = Date.now(), w = { go: () => { running++; res(Date.now() - t); }, onWait };
    if (running < MAX_CONCURRENT) return w.go();
    if (signal && signal.aborted) return rej({ code: 499, msg: "cancelled" });
    waiting.push(w);
    if (onWait) onWait(waiting.length);
    if (signal) signal.addEventListener("abort", () => {
      const i = waiting.indexOf(w);
      if (i > -1) { waiting.splice(i, 1); tellPlaces(); rej({ code: 499, msg: "cancelled" }); }
    });
  });
}
const tellPlaces = () => waiting.forEach((w, i) => { if (w.onWait) w.onWait(i + 1); });
const release = () => { running--; const n = waiting.shift(); if (n) n.go(); tellPlaces(); };

/* ---------- one question ---------- */
const cleanHistory = (h) => (Array.isArray(h) ? h : []).slice(-8)
  .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
  .map((m) => ({ role: m.role, content: m.content.slice(0, 700) }));

// A follow-up like "why is that important?" has no searchable words of its own. When the question is short or points
// back ("it", "that", "why"), search with the previous student question added, so retrieval still knows the topic.
// "Ipaliwanag sa Filipino" / "explain in Tagalog" asks for the same topic in another language: also a follow-up, or
// search would look for the word "Filipino" and find the Filipino pop-culture module.
const BACKREF = /\b(it|its|that|this|they|them|those|these|there|one|ones)\b|^(why|how come|and|so|what about|how about|can you)\b|\b(sa|in) (filipino|tagalog|bisaya|cebuano|english)\b/i;
function contextQuery(q, history) {
  const prev = [...history].reverse().find((m) => m.role === "user");
  if (prev && (R.tokenize(q).length < 3 || BACKREF.test(q.trim()))) return prev.content.slice(0, 300) + " " + q;
  return q;
}

// Small models sometimes open with filler ("Okay, let's break this down!", "That's a great question!") or use *markdown*,
// although prompts.js says not to. tidyStart removes such openers (repeatedly, they come in pairs); tidy also removes
// **bold** and *italics* marks. Small talk is left alone: "Okay lang ako" is a real answer there.
const OPENERS = [
  /^(okay|ok|alright|all right|sure|so|hey there|hey|hi there)\s*[,!.:]+\s*/i,
  /^(okay|ok|alright)\s+so\b[\s,]*/i,
  /^so,?\s+/,                                                // a lowercase "so" left over from "Okay, so ..."
  /^(that['’]?s|that is|it['’]?s|this is|what) (a |an |such a )?(really |very |super )?(great|good|important|common|interesting|excellent|nice|fair|tricky) (question|one|thing to ask)\b[^.!?\n—–-]{0,60}[.!?—–-]+\s*/i,
  /^(great|good|excellent|nice) question\b[^.!?\n—–-]{0,40}[.!?—–-]+\s*/i,
  /^let['’]?s (break|look at|talk about|dive into|go over|unpack)\b[^.!?\n]{0,80}[.!?]+\s*/i,
  /^(\[\d+\]\s*)+(?=\S)/,                                    // a citation number before any text
];
// Models write ' or ’ (curly) in "let's" / "that's", so both are matched.
const STARTERS = /^(okay|ok|alright|all|sure|so|hey|hi|that['’]?s|that|it['’]?s|this|what|great|good|excellent|nice|let['’]?s)$/i;
function tidyStart(t) {
  let prev;
  do { prev = t; for (const r of OPENERS) t = t.replace(r, ""); } while (t !== prev);
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}
const tidy = (t) => tidyStart(t.trim()).replace(/\]\s+(?=[.,;:!?])/g, "]").replace(/\*\*([^*\n]+)\*\*/g, "$1").replace(/(^|[^\w*])\*([^*\s](?:[^*\n]*[^*\s])?)\*(?![\w*])/g, "$1$2");   // *word*, not "2 * 3"
// While streaming: the start of the answer, once no more filler can follow (or after 160 characters); null = keep waiting.
function headReady(h) {
  const t = tidyStart(h.replace(/^\s+/, "")), w = t.match(/^([A-Za-z'’]+)[^A-Za-z'’]/);
  if (h.length >= 160) return t;
  if (!w || STARTERS.test(w[1]) || /^\[/.test(t)) return null;
  return t;
}

// hooks.onMeta({mode, sources, ...}) fires before generation; hooks.onToken(text) fires per token.
async function ask(body, hooks = {}, signal) {
  const q = String(body.q || "").trim().slice(0, 500);
  if (!q) throw { code: 400, msg: "empty_question" };
  const scope = typeof body.scope === "string" && body.scope ? body.scope.slice(0, 60) : null;
  const allowed = hooks.allowed || null;          // courses on the student's class lists (plus courses with no list)
  const history = cleanHistory(body.history);
  const t0 = Date.now();

  const small = SMALLTALK.test(q);
  let sources = [], retrieval = "none", rq = q;
  if (!small) {
    rq = contextQuery(q, history);
    const found = await R.search(kb, rq, { scope, allowed, level: body.lv, embed: kb.dense ? embed : null });
    retrieval = found.retrieval;
    // courseId + pos (module number, from the file name "2-security-principles.md") let the app open that exact
    // module when a student taps [1], and highlight the passage.
    sources = found.hits.map((h, i) => ({ n: i + 1, title: h.c.module, course: h.c.course, courseId: h.c.courseId, pos: parseInt(h.c.id.split("/")[1], 10) || null,
      text: h.c.text, bm25: +h.bm25.toFixed(3), dense: +h.dense.toFixed(3) }));
  }
  const tRetrieve = Date.now() - t0;

  const general = ALLOW_GENERAL && body.gen !== false;      // the client may only turn this OFF, never force it on
  const mode = small ? "chat" : sources.length ? "grounded" : general ? "general" : "none";
  if (hooks.onMeta) hooks.onMeta({ mode, sources, retrieval, model: MODEL, retrievalQuery: rq === q ? undefined : rq });

  let text = "", tQueue = 0, tGen = 0, tFirst = 0;
  if (mode !== "none") {
    const system = PERSONA + (mode === "grounded" ? GROUNDED : mode === "general" ? GENERAL_RULES : CHAT_RULES);
    const last = mode === "grounded" ? "Course passages:\n" + sources.map((s) => `[${s.n}] ${s.course}, ${s.title}: ${s.text}`).join("\n\n") + "\n\nStudent: " + q : q;
    let waited = false;
    tQueue = await acquire((n) => { waited = true; if (hooks.onQueue) hooks.onQueue(n); }, signal);
    if (waited && hooks.onQueue) hooks.onQueue(0);                 // "your turn now"
    const g0 = Date.now();
    const emit = (t) => { if (!tFirst) tFirst = Date.now() - g0; if (hooks.onToken) hooks.onToken(t); };
    // The first words are held back until it is clear they are not filler (usually one or two words), so the student
    // never sees "Okay," appear and then vanish.
    let head = "", open = mode === "chat";
    const onToken = (t) => {
      if (open) return emit(t);
      head += t;
      const h = headReady(head);
      if (h !== null) { open = true; if (h) emit(h); }
    };
    try { text = await chat([{ role: "system", content: system }, ...history, { role: "user", content: last }], onToken, signal); }
    finally { release(); }
    tGen = Date.now() - g0;
    if (mode !== "chat") text = tidy(text);
    if (!tFirst) tFirst = tGen;                                     // a short answer that never left the hold-back
    if (mode === "grounded") text = text.replace(/\[(\d+)\]/g, (m, n) => (+n >= 1 && +n <= sources.length ? m : "")).replace(/[ \t]{2,}/g, " ");   // drop citations that point at nothing
  }

  // firstTokenMs = how long the student stares at "Writing the answer…" before the first word appears.
  const timings = { retrieveMs: tRetrieve, queueMs: tQueue, firstTokenMs: tFirst, generateMs: tGen, totalMs: Date.now() - t0 };
  try { fs.mkdirSync(path.join(__dirname, "logs"), { recursive: true }); fs.appendFileSync(path.join(__dirname, "logs", "queries.jsonl"), JSON.stringify({ t: new Date().toISOString(), q, retrievalQuery: rq === q ? null : rq, turns: history.length, scope, mode, retrieval, model: MODEL, sources: sources.map((s) => `${s.course}|${s.title}`), ...timings }) + "\n"); } catch {}
  return { text, sources, mode, retrieval, model: MODEL, timings };
}

async function status() {
  let ollama = false, hasModel = false, php = false;
  try { php = (await fetch(`${PHP_API}/auth.php?action=me`, { signal: AbortSignal.timeout(2500) })).ok; } catch {}
  try {
    const j = await (await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(2500) })).json();
    ollama = true; hasModel = (j.models || []).some((m) => m.name === MODEL || m.name === MODEL + ":latest");
  } catch {}
  return { ok: ollama && hasModel, ollama, php, model: MODEL, modelInstalled: hasModel, embed: embedState, passages: kb.N, courses: Object.values(kb.courses).map((c) => c.name), queueLength: waiting.length };
}

/* ---------- login check and PHP proxy ---------- */
// Asks PHP who the session cookie belongs to. The answer is remembered for 2 minutes so a student's questions do not
// each wait on PHP and the database. Trade-off: a deactivated account, or a class-list change, takes up to 2 minutes to
// apply to AI answers.
const LOGIN_CACHE_MS = 2 * 60000;
const seen = new Map();
// Returns false when not logged in, otherwise { allowed }: the course ids this student may get answers from (null = all).
async function loggedIn(req) {
  if (!REQUIRE_LOGIN) return { allowed: null };
  const ck = req.headers.cookie || "";
  if (!ck) return false;
  const c = seen.get(ck);
  if (c && Date.now() - c.t < LOGIN_CACHE_MS) return c.ok;
  const j = await (await fetch(`${PHP_API}/auth.php?action=me`, { headers: { cookie: ck }, signal: AbortSignal.timeout(3000) })).json();
  if (seen.size > 500) seen.clear();
  const ok = j.user ? { allowed: Array.isArray(j.allowed) ? j.allowed : null } : false;
  seen.set(ck, { ok, t: Date.now() });
  return ok;
}

// /api/db/<name> is passed to api/<name>.php on Laragon. The browser only ever talks to this server, so cookies just work.
function proxyPhp(req, res, url, send) {
  // Google sends teachers back to /oauth/google after they allow Classroom access; PHP finishes the sign-in.
  // "Continue with Google" sign-in comes back to /oauth/signin.
  const oauth = url.pathname === "/oauth/google" || url.pathname === "/oauth/signin";
  const name = url.pathname === "/oauth/google" ? "google" : url.pathname === "/oauth/signin" ? "auth" : url.pathname.slice("/api/db/".length);
  if (!/^[a-z]+$/.test(name)) return send(404, { error: "not_found" });
  const t = new URL(`${PHP_API}/${name}.php${url.search}`);
  if (oauth) t.searchParams.set("action", url.pathname === "/oauth/signin" ? "google_callback" : "callback");
  const headers = {};
  ["cookie", "content-type", "content-length", "x-requested-with", "accept"].forEach((h) => { if (req.headers[h]) headers[h] = req.headers[h]; });
  const up = http.request({ hostname: t.hostname, port: t.port || 80, path: t.pathname + t.search, method: req.method, headers }, (r) => {
    const h = { ...r.headers }; delete h.connection; delete h["keep-alive"];
    res.writeHead(r.statusCode, h); r.pipe(res);
  });
  up.on("error", () => { if (!res.headersSent) send(502, { error: "php_unreachable" }); else res.end(); });
  req.pipe(up);
}

/* ---------- Google Classroom sync timer ---------- */
// Every SYNC_MINUTES, ask PHP to check every linked Classroom class for new posts. Without internet the check
// just fails and is logged; students' answers never depend on it.
const SYNC_MINUTES = +E.SYNC_MINUTES || 30;
async function syncClassroom() {
  if (!RELOAD_KEY) return;
  try {
    const r = await fetch(`${PHP_API}/google.php?action=sync_all`, { method: "POST", headers: { "x-reload-key": RELOAD_KEY, "x-requested-with": "learnlink" }, signal: AbortSignal.timeout(15 * 60000) });
    const j = await r.json().catch(() => ({}));
    if (j.results) { const n = Object.values(j.results).reduce((a, x) => a + (x.drafts || 0), 0); if (n) console.log(`Classroom sync: ${n} new draft(s) for teachers to review`); }
  } catch (e) { /* PHP or MySQL not running: try again next time */ }
}
setTimeout(syncClassroom, 60000);
setInterval(syncClassroom, SYNC_MINUTES * 60000);

/* ---------- live code updates (admin and faculty pages) ----------
   Their pages keep one connection open to /api/events. When a student asks for a sign-up or password reset code,
   or a code is used, PHP tells Node (/api/notify) and Node tells every open page to reload its code list at once.
   Only "something changed" is sent; each page then asks PHP for the codes it is allowed to see. */
const live = new Set();
setInterval(() => { for (const c of live) c.write(": ping\n\n"); }, 25000);   // keeps the connection open through idle timeouts
async function whoIs(req) {
  const ck = req.headers.cookie || "";
  if (!ck) return null;
  const j = await (await fetch(`${PHP_API}/auth.php?action=me`, { headers: { cookie: ck }, signal: AbortSignal.timeout(3000) })).json();
  return j.user || null;
}

/* ---------- http ---------- */
const rate = new Map();
const limited = (ip) => { const now = Date.now(), a = (rate.get(ip) || []).filter((t) => now - t < 60000); a.push(now); rate.set(ip, a); return a.length > RATE_PER_MIN; };
const isNet = (e) => e && !e.code && /fetch failed|aborted|timeout|ECONNREFUSED/i.test(String(e.message || "") + String((e.cause && (e.cause.code || e.cause.message)) || ""));
const errCode = (e) => (isNet(e) ? "model_unreachable" : e.msg || "server_error");

function readJson(req, cb) {
  let raw = "";
  req.on("data", (c) => { raw += c; if (raw.length > 30000) req.destroy(); });
  req.on("end", () => { let b = {}; try { b = JSON.parse(raw || "{}"); } catch {} cb(b); });
}

http.createServer(async (req, res) => {
  const send = (code, data, type = "application/json") => { res.writeHead(code, { "Content-Type": type }); res.end(typeof data === "string" || Buffer.isBuffer(data) ? data : JSON.stringify(data)); };
  const url = new URL(req.url, "http://localhost");

  if (url.pathname.startsWith("/api/db/") || url.pathname === "/oauth/google" || url.pathname === "/oauth/signin") return proxyPhp(req, res, url, send);

  // Admin and faculty pages: live "codes changed" messages (Server-Sent Events).
  if (req.method === "GET" && url.pathname === "/api/events") {
    let u;
    try { u = await whoIs(req); } catch { return send(503, { error: "php_unreachable" }); }
    if (!u || (u.role !== "admin" && u.role !== "faculty")) return send(401, { error: "not_logged_in" });
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    res.write("retry: 3000\n\n");
    live.add(res);
    req.on("close", () => live.delete(res));
    return;
  }
  // PHP calls this when a sign-up or password reset code is created or used. Only from this PC, and only with the shared key.
  if (req.method === "POST" && url.pathname === "/api/notify") {
    const ip = req.socket.remoteAddress || "";
    if (!RELOAD_KEY || req.headers["x-reload-key"] !== RELOAD_KEY || !/^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(ip)) return send(403, { error: "forbidden" });
    for (const c of live) c.write("event: codes\ndata: {}\n\n");
    return send(200, { ok: true, pages: live.size });
  }
  // PHP calls this after the modules/ folder changed (see api/_export.php). Only from this PC, and only with the shared key.
  if (req.method === "POST" && url.pathname === "/api/reload") {
    const ip = req.socket.remoteAddress || "";
    if (!RELOAD_KEY || req.headers["x-reload-key"] !== RELOAD_KEY || !/^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(ip)) return send(403, { error: "forbidden" });
    buildKB(); console.log(`Reloaded: ${kb.N} passages from ${Object.keys(kb.courses).length} courses`);
    return send(200, { ok: true, passages: kb.N });
  }

  // Streaming answer: one JSON object per line: {type:"meta"}, many {type:"token"}, then {type:"done"} (or {type:"error"}).
  if (req.method === "POST" && url.pathname === "/api/ai/stream") {
    if (limited(req.socket.remoteAddress)) return send(429, { error: "too_many_requests" });
    let who;
    try { if (!(who = await loggedIn(req))) return send(401, { error: "not_logged_in" }); } catch { return send(503, { error: "php_unreachable" }); }
    return readJson(req, async (body) => {
      const ac = new AbortController();
      res.on("close", () => { if (!res.writableEnded) ac.abort(); });   // student closed the page: stop generating
      let started = false;
      const emit = (o) => {
        if (res.destroyed || res.writableEnded) return;
        if (!started) { res.writeHead(200, { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache", "X-Accel-Buffering": "no" }); started = true; }
        res.write(JSON.stringify(o) + "\n");
      };
      try {
        const out = await ask(body, { allowed: who.allowed, onMeta: (m) => emit({ type: "meta", ...m }), onQueue: (n) => emit({ type: "queue", ahead: n }), onToken: (t) => emit({ type: "token", t }) }, ac.signal);
        emit({ type: "done", text: out.text, timings: out.timings });
      } catch (e) {
        if (ac.signal.aborted) return res.end();               // the student pressed Stop or closed the page
        console.error("AI error:", e.msg || e.message || e);
        if (started) emit({ type: "error", error: errCode(e) }); else return send(isNet(e) ? 503 : e.code || 500, { error: errCode(e) });
      }
      res.end();
    });
  }
  // Plain JSON answer (no streaming). Used by scripts and the evaluation.
  if (req.method === "POST" && url.pathname === "/api/ai") {
    if (limited(req.socket.remoteAddress)) return send(429, { error: "too_many_requests" });
    let who;
    try { if (!(who = await loggedIn(req))) return send(401, { error: "not_logged_in" }); } catch { return send(503, { error: "php_unreachable" }); }
    return readJson(req, async (body) => {
      try { send(200, await ask(body, { allowed: who.allowed })); }
      catch (e) { console.error("AI error:", e.msg || e.message || e); send(isNet(e) ? 503 : e.code || 500, { error: errCode(e) }); }
    });
  }
  if (req.method === "GET" && url.pathname === "/api/status") return send(200, await status());
  if (req.method !== "GET") return send(405, { error: "method_not_allowed" });
  let p = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[\/\\])+/, "");
  if (p === "/" || p === "\\") p = "/index.html";
  const file = path.join(PUB, p);
  if (file !== PUB && !file.startsWith(PUB + path.sep)) return send(403, "Forbidden", "text/plain");
  serveStatic(req, res, file, send);
}).listen(PORT, HOST, async () => {
  console.log(`LearnLink running at http://localhost:${PORT}  (LAN: bind ${HOST})`);
  console.log(`Knowledge base: ${kb.N} passages from ${Object.keys(kb.courses).length} courses`);
  const s = await status();
  console.log(s.ollama ? (s.modelInstalled ? `Model ready: ${MODEL}` : `Ollama is running but model "${MODEL}" is not installed. Run: ollama pull ${MODEL}`) : `Cannot reach Ollama at ${OLLAMA}. Start it with: ollama serve`);
  // Embed the modules first, then load the model. Both at once can run out of memory on a 6 GB GPU, and then the
  // embeddings time out and search stays keyword-only until the next restart.
  if (s.modelInstalled) { await embedJob; warmUp(); }
});

/* ---------- pages, scripts and styles ---------- */
// Text files are sent gzipped (about a quarter of the size, which matters on phones over campus Wi-Fi).
// Every file has an ETag: the browser asks "still the same?" and gets a tiny "304 Not Modified" instead of the
// whole file. Scripts and pages are always re-checked, so an update shows up without Ctrl + Shift + R.
const GZ_TYPES = new Set([".html", ".js", ".css", ".svg", ".json"]);
const LONG_CACHE = new Set([".jpg", ".webp", ".png", ".ico", ".woff2"]);     // images: reused for a day without asking
const files = new Map();                                                     // path -> { etag, raw, gz }
function serveStatic(req, res, file, send) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(404, "Not found", "text/plain");
    const ext = path.extname(file).toLowerCase();
    const etag = `W/"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`;
    const headers = { "Content-Type": MIME[ext] || "application/octet-stream", ETag: etag, "Cache-Control": LONG_CACHE.has(ext) ? "public, max-age=86400" : "no-cache", Vary: "Accept-Encoding" };
    if (req.headers["if-none-match"] === etag) { res.writeHead(304, headers); return res.end(); }
    const gzip = GZ_TYPES.has(ext) && /\bgzip\b/.test(req.headers["accept-encoding"] || "");
    const done = (c) => {
      const buf = gzip ? c.gz : c.raw;
      if (gzip) headers["Content-Encoding"] = "gzip";
      headers["Content-Length"] = buf.length;
      res.writeHead(200, headers); res.end(buf);
    };
    const c = files.get(file);
    if (c && c.etag === etag) return done(c);
    fs.readFile(file, (e, raw) => {
      if (e) return send(404, "Not found", "text/plain");
      const n = { etag, raw, gz: GZ_TYPES.has(ext) ? zlib.gzipSync(raw, { level: 9 }) : null };
      files.set(file, n);
      done(n);
    });
  });
}
