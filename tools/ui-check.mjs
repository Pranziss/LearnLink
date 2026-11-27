// LearnLink UI check: clicks through the student app in a headless browser, saves screenshots, and reports what
// changed on screen since the last run.
//
//   node tools/ui-check.mjs            all four looks: desktop + phone, light + dark (about 2 minutes, run in parallel)
//   node tools/ui-check.mjs --quick    desktop, light only
//   node tools/ui-check.mjs --port 3001
//
// Needs: the server running (npm start) and Chrome or Edge installed. No login, Ollama or MySQL needed: the database
// and AI replies are faked here (FAKE below), so every run sees the same data and the screens can be compared.
// Output: logs/ui-check/<variant>/ (one PNG per screen + steps.json). The previous run is kept as steps.prev.json and
// compared: a changed screen is listed with the lines that changed. Page errors (JavaScript exceptions) are listed too.
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const PORT = +(args[args.indexOf("--port") + 1] || 0) || 3000;
const BASE = `http://127.0.0.1:${PORT}`;
const ONE = args.includes("--variant") ? args[args.indexOf("--variant") + 1] : null;   // internal: run one variant
const VARIANTS = args.includes("--quick") ? ["desktop-light"] : ["desktop-light", "phone-light", "desktop-dark", "phone-dark"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- run all variants in parallel (each in its own process and browser) ---------- */
if (!ONE) {
  try { await fetch(BASE + "/api/status", { signal: AbortSignal.timeout(3000) }); }
  catch { console.error(`The server isn't running on port ${PORT}. Start it with: npm start`); process.exit(1); }
  const t0 = Date.now();
  const results = await Promise.all(VARIANTS.map((v) => new Promise((res) => {
    const p = spawn(process.execPath, [fileURLToPath(import.meta.url), "--variant", v, "--port", String(PORT)], { stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    p.stdout.on("data", (d) => (out += d)); p.stderr.on("data", (d) => (out += d));
    p.on("close", (code) => res({ v, code, out }));
  })));
  let bad = 0;
  for (const r of results) { console.log(`\n===== ${r.v} =====\n${r.out.trim()}`); if (r.code) bad++; }
  console.log(`\nDone in ${Math.round((Date.now() - t0) / 1000)} s. Screenshots: logs/ui-check/<variant>/*.png` + (bad ? `  (${bad} variant(s) had problems)` : ""));
  process.exit(bad ? 1 : 0);
}

/* ---------- fake backend: fixed data so every run looks the same ---------- */
const R = require(path.join(ROOT, "retrieval.js"));
const MODULES = path.join(ROOT, "modules");
const kb = R.loadKB(MODULES);
const courseNames = JSON.parse(fs.readFileSync(path.join(MODULES, "courses.json"), "utf8"));
const COURSES = ["information-assurance", "ge-ethics"].map((cid, ci) => ({
  id: cid, name: courseNames[cid].name, instructor: ci ? "Andrea Mae Salazar" : "Ramon Dizon", college: courseNames[cid].college,
  modules: fs.readdirSync(path.join(MODULES, cid)).filter((f) => f.endsWith(".md")).sort().map((f, i) => ({
    id: (ci + 1) * 10 + i + 1, position: String(i + 1), file: f,
    title: fs.readFileSync(path.join(MODULES, cid, f), "utf8").split("\n")[0].replace(/^#\s*Module\s+\d+:\s*/, "").trim() }))
}));
const IA = COURSES[0];
const chunk = (mod, k) => {
  const c = kb.chunks.filter((x) => x.id.startsWith(`${IA.id}/${mod.file}#`))[k];
  return { title: c.module, course: c.course, courseId: c.courseId, pos: parseInt(mod.file, 10), text: c.text, bm25: 0.81, dense: 0.77 };
};
const SOURCES = [chunk(IA.modules[1], 0), chunk(IA.modules[1], 1), chunk(IA.modules[2], 0)].map((s, i) => ({ ...s, n: i + 1 }));
const STUDY = {
  summary: { points: ["The CIA triad names three goals: confidentiality, integrity and availability.", "Each goal is protected with its own controls.", "Least privilege gives users only the access they need."],
    terms: [{ term: "Integrity", meaning: "Data stays accurate and is not changed without permission." }] },
  quiz: { questions: [
    { question: "Which control protects integrity?", options: ["Backups", "Hashing", "Redundancy", "Encryption"], answer: 1, why: "The module says integrity is protected with hashing." },
    { question: "What does least privilege mean?", options: ["Users get only the access they need", "Admins share one password", "Everyone can read all data", "Access is never logged"], answer: 0, why: "The module defines least privilege that way." }] },
  cards: { cards: [{ front: "What is the CIA triad?", back: "Confidentiality, integrity and availability." }, { front: "Least privilege", back: "Only the access a user needs." }] }
};
let loggedIn = true, demo = false, saveN = 0;
const ndjson = (lines) => ({ _raw: lines.map((l) => JSON.stringify(l)).join("\n") + "\n", _type: "application/x-ndjson" });
function FAKE(url, body) {
  const u = new URL(url), p = u.pathname, a = u.searchParams.get("action");
  if (demo) return { error: "php_unreachable", _status: 502 };   // ?demo has no server
  if (p.startsWith("/api/db/auth")) {
    if (a === "me") return loggedIn ? { user: { role: "student", username: "juan_dela_cruz", student_id: "2023-00001", email: "juan.delacruz@bisu.edu.ph",
      college: "CCIS", program: "BS Information Technology", year_level: "3rd year", section: "C" } } : { user: null };
    if (a === "signup_start") return { teacher: true, emailed: false, mail: false };
    if (a === "signup_verify") return { email: "new.student@bisu.edu.ph", name: "New Student" };
    if (a === "register") { loggedIn = true; return { ok: true }; }
    if (a === "change_password") return { error: "wrong_password", _status: 400 };
    if (a === "options" || a === "signup_state") return {};
    return { ok: true };
  }
  if (p.startsWith("/api/db/courses")) {
    if (a === "module_text") {
      for (const c of COURSES) for (const m of c.modules) if (m.id === +u.searchParams.get("id"))
        return { title: m.title, position: +m.position, files: [{ id: 5, name: "module.pdf", download: true }],
          text: fs.readFileSync(path.join(MODULES, c.id, m.file), "utf8").split("\n").slice(1).join("\n").trim() };
      return { error: "not_found", _status: 404 };
    }
    return { courses: COURSES.map((c) => ({ id: c.id, name: c.name, instructor: c.instructor, college: c.college, modules: c.modules.map((m) => ({ id: m.id, title: m.title, position: m.position })) })) };
  }
  if (p.startsWith("/api/db/chats")) {
    if (a === "list") return { chats: [{ id: 7, title: "What is the CIA triad?" }, { id: 8, title: "Risk responses" }] };
    if (a === "open") return { chat: { id: 7 }, messages: [
      { role: "user", content: "What is the CIA triad?" },
      { role: "assistant", id: 70, mode: "grounded", rating: 1, retrieval: "hybrid", content: "It names three goals [1]. Integrity uses hashing [2].", sources: SOURCES.slice(0, 2) }] };
    if (a === "save") return { chat_id: 9, message_id: 100 + ++saveN };
    return { ok: true };
  }
  if (p.startsWith("/api/db/")) return { ok: true };
  if (p === "/api/ai/stream") {
    const q = (JSON.parse(body || "{}").q || "").toLowerCase();
    if (/please fail/.test(q)) return { error: "model_unreachable", _status: 503 };
    let meta = { type: "meta", mode: "grounded", sources: SOURCES, retrieval: "hybrid", model: "gemma3:4b" },
      text = "The CIA triad names three goals: confidentiality, integrity and availability [1]. Integrity is protected with hashing [2]. Risk means a threat can cause harm [3].";
    if (/^hi\b/.test(q)) { meta = { type: "meta", mode: "chat", sources: [] }; text = "Hello Juan! What shall we study?"; }
    else if (/world cup/.test(q)) { meta = { type: "meta", mode: "general", sources: [] }; text = "Argentina won the 2022 World Cup."; }
    return ndjson([meta, ...text.split(/(?<= )/).map((t) => ({ type: "token", t })), { type: "done", text, timings: {} }]);
  }
  if (p === "/api/ai") return { text: "Hashing checks integrity [1].", mode: "grounded" };
  if (p === "/api/study") {
    const b = JSON.parse(body || "{}");
    return ndjson([...(b.modules || []).map((num) => ({ type: "module", num, title: "Module " + num, items: STUDY[b.kind] })), { type: "done" }]);
  }
  return null;   // anything else: the real server (pages, scripts, styles)
}

/* ---------- browser (Chrome DevTools Protocol) ---------- */
const [size, theme] = ONE.split("-"), PHONE = size === "phone", DARK = theme === "dark";
const OUT = path.join(ROOT, "logs", "ui-check", ONE);
fs.mkdirSync(OUT, { recursive: true });
fs.readdirSync(OUT).filter((f) => f.endsWith(".png")).forEach((f) => fs.unlinkSync(path.join(OUT, f)));
const BROWSER = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].find((b) => fs.existsSync(b));
if (!BROWSER) { console.error("No Chrome or Edge found."); process.exit(1); }
const DPORT = 9400 + Math.floor(Math.random() * 400);
const PROFILE = path.join(ROOT, "logs", "ui-check", ".profile-" + ONE + "-" + process.pid);
const browser = spawn(BROWSER, ["--headless=new", `--remote-debugging-port=${DPORT}`, `--user-data-dir=${PROFILE}`, "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
let ws, seq = 0;
const pending = {}, pageErrors = [];
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending[id] = { res, rej }; ws.send(JSON.stringify({ id, method, params })); });

async function main() {
  let wsUrl;
  for (let i = 0; i < 60 && !wsUrl; i++) {
    try { wsUrl = (await (await fetch(`http://127.0.0.1:${DPORT}/json/list`)).json()).find((t) => t.type === "page")?.webSocketDebuggerUrl; } catch {}
    if (!wsUrl) await sleep(200);
  }
  if (!wsUrl) throw new Error("the browser did not start");
  ws = new WebSocket(wsUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending[m.id]) { m.error ? pending[m.id].rej(new Error(m.error.message)) : pending[m.id].res(m.result); delete pending[m.id]; return; }
    if (m.method === "Runtime.exceptionThrown") pageErrors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === "Fetch.requestPaused") {
      const { requestId, request } = m.params, r = FAKE(request.url, request.postData);
      if (!r) return send("Fetch.continueRequest", { requestId });
      send("Fetch.fulfillRequest", { requestId, responseCode: r._status || 200, responseHeaders: [{ name: "Content-Type", value: r._type || "application/json" }],
        body: Buffer.from(r._raw || JSON.stringify(r)).toString("base64") });
    }
  };
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: "*/api/*" }] });
  await send("Emulation.setDeviceMetricsOverride", PHONE ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true } : { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: DARK ? "dark" : "light" }] });

  const shots = [];
  // Runs JS in the app (inside login.html's frame when it's open). Helpers: q(css), btn(text) clicks a button by its
  // text, menu(text) clicks a sidebar item (opening the menu first on a phone), ask(text) types and sends a question.
  const ev = async (js) => {
    const r = await send("Runtime.evaluate", { returnByValue: true, awaitPromise: true, expression: `(function(){
      var F=document.getElementById('fr'),W=F&&F.classList.contains('show')?F.contentWindow:window,d=W.document;
      function q(s){return d.querySelector(s)}
      function btn(t,sel){var b=[].slice.call(d.querySelectorAll(sel||'button,a,.it,.mod,#tab,.card')).filter(function(x){return x.textContent.trim()===t})[0];if(!b)throw new Error('no button "'+t+'"');b.click()}
      function menu(t){if(!q('#sb'))q('[aria-label=Menu]').click();btn(t)}
      function ask(t){var e=d.getElementById('askInput');e.value=t;q('[aria-label=Send]').click()}
      ${js}})()` });
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || r.exceptionDetails.text).split("\n")[0]);
    return r.result.value;
  };
  const snap = async (name, shot) => {
    const s = JSON.parse(await ev(`var r=d.getElementById('root');return JSON.stringify({text:(r?r.innerText:d.body.innerText).replace(/[ \\t]+/g,' ').replace(/\\n\\s*\\n+/g,'\\n').trim(),
      sources:!!q('#pn'),viewer:!!q('.vw'),highlighted:d.querySelectorAll('.phl,.vw mark').length,dialog:!!q('[role=dialog]')})`));
    if (shot) {
      const img = await send("Page.captureScreenshot", { format: "png" });
      s.png = String(shots.filter((x) => x.png).length + 1).padStart(2, "0") + "-" + name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".png";
      fs.writeFileSync(path.join(OUT, s.png), Buffer.from(img.data, "base64"));
    }
    shots.push({ name, ...s });
  };
  const step = async (name, js, wait = 400, shot = false) => {
    try { await ev(js); } catch (e) { shots.push({ name, error: e.message }); return; }
    await sleep(wait);
    await snap(name, shot);
  };
  const open = async (url) => { await send("Page.navigate", { url }); await sleep(2500); };

  /* ===== the real app (inside login.html), with the fake data above ===== */
  await open(BASE + "/login.html");
  await snap("first login tour", true);
  await step("tour next", "btn('Next')");
  await step("tour next 2", "btn('Next')");
  await step("home", "btn('Start studying')", 400, true);
  await step("answer with sources", "ask('What is the CIA triad?')", 1800, true);
  await step("tap citation 2", "d.querySelectorAll('#msgs .ct')[1].click()", 600, true);
  await step("module with highlighted passage", "d.querySelectorAll('#pn .src')[1].querySelector('button').click()", 1300, true);
  await step("close module", "q('[aria-label=\"Close module\"]').click()", 600);
  await step("close sources", "q('[aria-label=\"Close sources\"]').click()", 600);
  await step("rate not helpful", "q('[aria-label=\"Not helpful\"]').click()", 300, true);
  await step("pick a reason", "btn('Missing source')", 300);
  await step("small talk", "ask('hi')", 1500);
  await step("general answer", "ask('who won the world cup')", 1500, true);
  await step("error message", "ask('please fail now')", 1500, true);
  await step("new chat", "menu('+ New chat')", 500);
  await step("search chats", "menu('Search chats')", 400, true);
  await step("open saved chat", "btn('What is the CIA triad?')", 1300);
  await step("open course", "menu('Information Assurance')", 600, true);
  await step("select a module", "d.querySelectorAll('.mod')[1].click()", 300);
  await step("module from course page", "d.querySelectorAll('.mod button')[0].click()", 1300, true);
  await step("close course module", "q('[aria-label=\"Close module\"]').click()", 600);
  await step("course space: ask", "btn('Ask a question')", 400);
  await step("course space: answer", "btn('What are the key terms?')", 2300, true);
  await step("summary", "btn('Summary')", 1200, true);
  await step("quiz", "btn('Quiz')", 1200);
  await step("quiz answered", "d.querySelectorAll('.opt')[0].click()", 300, true);
  await step("leave quiz?", "q('[aria-label=\"Back to modules\"]').click()", 400, true);
  await step("keep going", "btn('Keep going')", 300);
  await step("quiz finished", "for(var k=0;k<10;k++){var o=d.querySelectorAll('.opt');if(!o.length)break;o[1].click();[].slice.call(d.querySelectorAll('button.p')).filter(function(b){return /^(Next|Finish)$/.test(b.textContent.trim())})[0].click()}", 300, true);
  await step("flashcards", "btn('Flashcards')", 1200, true);
  await step("flashcard flipped", "q('.card[onclick]').click()", 300, true);
  await step("settings", "menu('Settings')", 500, true);
  await step("change password open", "btn('Change password')", 300);
  await step("wrong password", "d.getElementById('pwCurrent').value='x';d.getElementById('pwNew').value='abcdefg1';d.getElementById('pwConfirm').value='abcdefg1';btn('Save new password')", 700, true);
  await step("offline banner", "W.dispatchEvent(new Event('offline'))", 900, true);

  /* ===== demo mode (?demo: sample data, no server) ===== */
  demo = true;
  await open(BASE + "/apps/student.html?demo&start=app");
  await snap("demo home", true);
  await step("demo answer", "ask('what is the cia triad')", 2500, true);
  await step("demo module", "d.querySelectorAll('#msgs .ct')[0].click();q('#pn .src.hl button').click()", 1000, true);
  await step("demo close module", "q('[aria-label=\"Close module\"]').click()", 600);
  await step("demo follow-up", "ask('why is it important')", 2500);
  await step("demo course", "menu('Prof Elec 2')", 500);
  await step("demo quiz", "btn('Quiz')", 400, true);

  /* ===== creating an account ===== */
  demo = false; loggedIn = false;
  await send("Storage.clearDataForOrigin", { origin: BASE, storageTypes: "local_storage" });
  await open(BASE + "/login.html");
  await step("sign-up: email", "btn('Create an account')", 2500, true);
  await step("sign-up: wrong email", "d.getElementById('email').value='abc@gmail.com';btn('Get a code')", 300, true);
  await step("sign-up: code boxes", "d.getElementById('email').value='new.student@bisu.edu.ph';btn('Get a code')", 800, true);
  await step("sign-up: details", "var b=d.querySelectorAll('#bx input');b.forEach(function(x){x.value='1'});b[5].dispatchEvent(new Event('input'))", 800, true);
  await step("sign-up: missing fields", "btn('Create account')", 300, true);

  /* ===== report ===== */
  const file = path.join(OUT, "steps.json"), prevFile = path.join(OUT, "steps.prev.json");
  if (fs.existsSync(file)) fs.copyFileSync(file, prevFile);
  fs.writeFileSync(file, JSON.stringify({ at: new Date().toISOString(), shots, pageErrors }, null, 1));
  const failed = shots.filter((s) => s.error);
  console.log(`${shots.length} steps, ${shots.filter((s) => s.png).length} screenshots, ${failed.length} failed steps, ${pageErrors.length} page errors`);
  failed.forEach((s) => console.log(`  FAILED  ${s.name}: ${s.error}`));
  pageErrors.slice(0, 10).forEach((e) => console.log(`  PAGE ERROR  ${String(e).split("\n")[0]}`));
  if (fs.existsSync(prevFile)) {
    const prev = JSON.parse(fs.readFileSync(prevFile, "utf8")).shots, byName = Object.fromEntries(prev.map((s) => [s.name, s]));
    const changed = [];
    for (const s of shots) {
      const o = byName[s.name];
      if (!o || s.error || o.error) continue;
      const A = (o.text || "").split("\n"), B = (s.text || "").split("\n");
      const lost = A.filter((l) => !B.includes(l)), got = B.filter((l) => !A.includes(l));
      const flags = ["sources", "viewer", "highlighted", "dialog"].filter((k) => o[k] !== s[k]).map((k) => `${k}: ${o[k]} -> ${s[k]}`);
      if (lost.length || got.length || flags.length) changed.push({ name: s.name, lost, got, flags });
    }
    console.log(changed.length ? `Changed since the last run (${changed.length} screens):` : "Same screens as the last run.");
    for (const c of changed) {
      console.log(`  ~ ${c.name}` + (c.flags.length ? `  [${c.flags.join(", ")}]` : ""));
      c.lost.slice(0, 4).forEach((l) => console.log(`      - ${l.slice(0, 140)}`));
      c.got.slice(0, 4).forEach((l) => console.log(`      + ${l.slice(0, 140)}`));
    }
  } else console.log("First run: nothing to compare with yet.");
  if (failed.length || pageErrors.length) process.exitCode = 1;
}

main().catch((e) => { console.error("ui-check failed: " + e.message); process.exitCode = 1; })
  .finally(async () => { try { ws.close(); } catch {} browser.kill(); await sleep(800); fs.rmSync(PROFILE, { recursive: true, force: true }); });
