// LearnLink pre-flight check: is everything ready to present?  node tools/preflight.js [--port 3000]
//
// Checks, in order: settings (.env), Ollama and the models, the LearnLink server (npm start), PHP + MySQL (through the
// server), search embeddings, the study tools (Summary / Quiz / Flashcards made ahead for every module), placeholder
// modules, and the addresses phones on the same Wi-Fi can open. It also loads the model into the GPU and times a
// short answer, so the first real question isn't slow.
// Prints one line per check (OK / WARN / FAIL) with what to do, and exits with 1 if anything FAILed.
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const ROOT = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const PORT = +(args[args.indexOf("--port") + 1] || 0) || null;

// settings, the same way server.js reads them
const env = {};
try {
  fs.readFileSync(path.join(ROOT, ".env"), "utf8").split(/\r?\n/).forEach((l) => {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].replace(/\s+#.*$/, "").trim().replace(/^["']|["']$/g, "");
  });
} catch {}
const get = (k, d) => process.env[k] || env[k] || d;
const MODEL = get("MODEL", "gemma3:4b"), EMBED = get("EMBED_MODEL", "nomic-embed-text");
const OLLAMA = get("OLLAMA_HOST", "http://127.0.0.1:11434").replace(/\/$/, "");
const SERVER = `http://127.0.0.1:${PORT || get("PORT", "3000")}`;
const NUM_CTX = +get("NUM_CTX", 4096), KEEP_ALIVE = get("KEEP_ALIVE", "4h");

let fails = 0, warns = 0;
const ok = (m) => console.log(`  OK    ${m}`);
const warn = (m, fix) => { warns++; console.log(`  WARN  ${m}` + (fix ? `\n        -> ${fix}` : "")); };
const fail = (m, fix) => { fails++; console.log(`  FAIL  ${m}` + (fix ? `\n        -> ${fix}` : "")); };
const json = async (url, opt = {}) => (await fetch(url, { signal: AbortSignal.timeout(opt.timeout || 4000), ...opt })).json();

(async () => {
  console.log("LearnLink pre-flight check\n");

  /* settings */
  console.log("Settings");
  if (fs.existsSync(path.join(ROOT, ".env"))) ok(`.env found (model ${MODEL})`);
  else warn(".env is missing: defaults are used", "copy .env.example to .env, then run: php database/setup.php");
  if (get("REQUIRE_LOGIN", "true") === "false") warn("REQUIRE_LOGIN=false: anyone on the network can use the AI", "set REQUIRE_LOGIN=true in .env for the demo");

  /* Ollama */
  console.log("\nOllama (the local AI)");
  let tags = null;
  try { tags = await json(`${OLLAMA}/api/tags`); ok(`Ollama is running at ${OLLAMA}`); }
  catch { fail(`Ollama is not running at ${OLLAMA}`, "start it: open the Ollama app, or run: ollama serve"); }
  if (tags) {
    const names = (tags.models || []).map((m) => m.name), has = (n) => names.includes(n) || names.includes(n + ":latest");
    has(MODEL) ? ok(`model ${MODEL} is installed`) : fail(`model ${MODEL} is not installed`, `run: ollama pull ${MODEL}`);
    has(EMBED) ? ok(`embedding model ${EMBED} is installed`) : fail(`embedding model ${EMBED} is not installed`, `run: ollama pull ${EMBED}`);
    // load the model now and time a tiny answer (same num_ctx as the server, or Ollama would load it twice)
    if (has(MODEL)) {
      const t0 = Date.now();
      try {
        const r = await json(`${OLLAMA}/api/chat`, { method: "POST", timeout: 180000, body: JSON.stringify({ model: MODEL, stream: false, keep_alive: /^-?\d+$/.test(KEEP_ALIVE) ? +KEEP_ALIVE : KEEP_ALIVE,
          messages: [{ role: "user", content: "Reply with the word ready." }], options: { num_ctx: NUM_CTX, num_predict: 5 } }) });
        const s = ((Date.now() - t0) / 1000).toFixed(1);
        r.message ? (Date.now() - t0 > 15000 ? warn(`the model answered, but slowly (${s} s, it was probably loading)`, "run this check again: it should now be under 2 s") : ok(`the model answers (${s} s)`)) : fail("the model did not answer: " + (r.error || "unknown error"));
      } catch (e) { fail("the model did not answer in 3 minutes", "check GPU memory: close other programs using the GPU, then restart Ollama"); }
      try {
        const ps = await json(`${OLLAMA}/api/ps`), m = (ps.models || []).find((x) => x.name === MODEL || x.name === MODEL + ":latest");
        if (m) (m.size_vram >= m.size * 0.95 ? ok(`${MODEL} is loaded on the GPU (${(m.size_vram / 1e9).toFixed(1)} GB)`) :
          warn(`${MODEL} is only partly on the GPU (${Math.round(100 * m.size_vram / m.size)}%): answers will be slow`, "close other programs that use the GPU (games, other AI apps), then restart Ollama"));
      } catch {}
    }
  }

  /* LearnLink server, PHP, MySQL */
  console.log("\nLearnLink server");
  let st = null;
  try { st = await json(`${SERVER}/api/status`); ok(`the server is running at ${SERVER}`); }
  catch { fail(`the server is not running at ${SERVER}`, "start it in the learnlink folder: npm start"); }
  if (st) {
    st.model === MODEL ? ok(`it uses ${st.model}`) : warn(`the server uses ${st.model}, but .env says ${MODEL}`, "restart the server (npm start) so it reads .env again");
    st.php ? ok("PHP and the database answer (Laragon)") : fail("PHP / MySQL don't answer", "start Laragon (Start All), then run this check again");
    st.embed === "ready" ? ok(`search is ready: ${st.passages} passages from ${st.courses.length} courses (keywords + meaning)`) :
      warn(`search runs on keywords only (embeddings: ${st.embed})`, st.embed === "starting" ? "wait a minute after starting, then check again" : `run: ollama pull ${EMBED}, then restart the server`);
    if (st.queueLength) warn(`${st.queueLength} question(s) waiting for the GPU right now`);
    // A server started before the latest code change keeps running the old code. /api/study is the newest endpoint:
    // an empty request gets "bad_request" (or "not_logged_in") from new code, and "method_not_allowed" from old code.
    try {
      const r = await json(`${SERVER}/api/study`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      r.error === "method_not_allowed" || r.error === "not_found" ? fail("the server runs older code (no Summary / Quiz / Flashcards)", "restart it: stop npm start (Ctrl + C) and run npm start again") : ok("the server runs the current code");
    } catch { warn("could not check the server's code version"); }
  }

  /* study tools ready for every module (checked without using the GPU) */
  console.log("\nCourse content");
  try {
    const { createStudy } = require(path.join(ROOT, "study.js"));
    const study = createStudy({ dir: path.join(ROOT, "modules"), cacheFile: path.join(ROOT, ".cache", "study.json"), model: MODEL, isIdle: () => true,
      generate: async () => { throw { code: 0, msg: "not_ready" }; } });
    let ready = 0, missing = [], empty = 0;
    const courses = fs.readdirSync(path.join(ROOT, "modules")).filter((d) => fs.statSync(path.join(ROOT, "modules", d)).isDirectory());
    for (const c of courses) for (const f of fs.readdirSync(path.join(ROOT, "modules", c)).filter((x) => x.endsWith(".md"))) {
      for (const kind of study.KINDS) {
        try { await study.get(kind, c, parseInt(f, 10)); ready++; }
        catch (e) { if (e.msg === "empty_module") empty++; else missing.push(`${c}/${parseInt(f, 10)} ${kind}`); }
      }
    }
    missing.length ? warn(`Summary / Quiz / Flashcards: ${ready} ready, ${missing.length} not made yet (e.g. ${missing.slice(0, 3).join(", ")})`,
      "leave the server running with Ollama on: it makes them in the background (about 5 s each)") : ok(`Summary / Quiz / Flashcards ready for every module (${ready})`);
    // placeholder text the demo should not show
    const placeholders = courses.filter((c) => fs.readdirSync(path.join(ROOT, "modules", c)).some((f) => f.endsWith(".md") &&
      /Sample content|Replace this file/i.test(fs.readFileSync(path.join(ROOT, "modules", c, f), "utf8"))));
    placeholders.length ? warn(`placeholder modules in: ${placeholders.join(", ")}`, "upload the real modules, or don't open these courses in the demo") : ok("no placeholder modules");
  } catch (e) { warn("could not check the study tools: " + (e.message || e.msg)); }

  /* PDF uploads: PHP needs the pdftotext program (looked for the same way as api/_extract.php) */
  {
    const win = process.platform === "win32", set = get("PDFTOTEXT", "");
    const places = set ? [set] : win ? ["C:/Program Files/Git/ucrt64/bin/pdftotext.exe", "C:/Program Files/Git/mingw64/bin/pdftotext.exe"] : ["/usr/bin/pdftotext", "/usr/local/bin/pdftotext", "/opt/homebrew/bin/pdftotext"];
    const found = places.find((f) => fs.existsSync(f));
    found ? ok(`PDF uploads can be read (${found})`) : warn("teachers' PDF uploads may not be readable (pdftotext not found in the usual places)",
      set ? `PDFTOTEXT in .env points to a missing file: ${set}` : "install Git for Windows, or Poppler and set PDFTOTEXT=<path to pdftotext.exe> in .env");
  }

  /* addresses for phones */
  console.log("\nOpen on a phone (same Wi-Fi)");
  const port = PORT || get("PORT", "3000");
  const ips = Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === "IPv4" && !i.internal).map((i) => i.address);
  ips.length ? ips.forEach((ip) => console.log(`        http://${ip}:${port}`)) : warn("no network address found: phones can't connect", "connect this PC to the Wi-Fi");
  if (get("HOST", "0.0.0.0") === "127.0.0.1") warn("HOST=127.0.0.1: only this PC can open LearnLink", "set HOST=0.0.0.0 in .env and restart");

  console.log(`\n${fails ? `${fails} problem(s) to fix` : "Ready to present"}` + (warns ? ` (${warns} warning(s))` : "") + ".");
  process.exit(fails ? 1 : 0);
})();
