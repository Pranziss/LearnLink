// LearnLink study tools: a Summary, a Quiz and Flashcards for each module, made by the local model from the module's
// own text (modules/<course>/<n>-<name>.md, the same files the chat answers from).
//
// - One module at a time, one kind at a time. The model replies with JSON in a fixed shape (Ollama "structured
//   outputs"), which is then checked here: a broken question is dropped, never shown.
// - Every result is saved in .cache/study.json. The key includes the module text, the model and the prompt, so a
//   teacher's change (or a prompt change in prompts.js) makes that module again; anything else is reused, instantly.
// - prepareAll() makes whatever is missing in the background, one at a time, only while no student is waiting for
//   the GPU. So by the time students open a module, its quiz is usually ready.
// server.js wires this up: it passes generate(), which goes through the same one-at-a-time GPU queue as the chat.
"use strict";
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const { STUDY_SYSTEM, STUDY } = require("./prompts");

const KINDS = ["summary", "quiz", "cards"];
const MAX_CHARS = 9000;   // module text given to the model (~2,300 tokens), so prompt + answer fit NUM_CTX 4096

// The JSON shape the model must reply with, per kind. Ollama turns it into a grammar, so it is enforced while the model
// writes: lengths are capped, and double quotes (straight or curly) are not allowed inside a string, because gemma
// sometimes ends a sentence with ” and then keeps repeating it until it runs out of tokens.
// No backslash either: the model could still write an escaped \" and break the JSON (seen when it tries to quote the module).
const text = (max) => ({ type: "string", minLength: 1, maxLength: max, pattern: "^[^“”\"\\\\]+$" });
const list = (items, max) => ({ type: "array", items, minItems: 1, maxItems: max });
const SCHEMAS = {
  summary: { type: "object", required: ["points", "terms"], properties: {
    points: list(text(240), 6),
    terms: { type: "array", maxItems: 5, items: { type: "object", required: ["term", "meaning"], properties: { term: text(60), meaning: text(150) } } } } },
  quiz: { type: "object", required: ["questions"], properties: {
    questions: list({ type: "object", required: ["question", "options", "answer", "why"], properties: {
      question: text(220), options: { type: "array", items: text(140), minItems: 4, maxItems: 4 }, answer: { type: "integer", minimum: 0, maximum: 3 }, why: text(240) } }, 5) } },
  cards: { type: "object", required: ["cards"], properties: {
    cards: list({ type: "object", required: ["front", "back"], properties: { front: text(100), back: text(160) } }, 8) } }
};
const TOKENS = { summary: 450, quiz: 900, cards: 600 };   // longest reply allowed, per kind

/* ---------- module text ---------- */
// The module file for course id + module number: { title, text }, or null. The first line is "# Module N: Title".
function readModule(dir, courseId, num) {
  if (!/^[a-z0-9-]{2,40}$/.test(courseId) || !Number.isInteger(num)) return null;
  const cdir = path.join(dir, courseId);
  let file;
  try { file = fs.readdirSync(cdir).find((f) => f.endsWith(".md") && parseInt(f, 10) === num); } catch { return null; }
  if (!file) return null;
  const lines = fs.readFileSync(path.join(cdir, file), "utf8").replace(/\r/g, "").split("\n");
  const title = /^#\s/.test(lines[0]) ? lines.shift().replace(/^#+\s*/, "").trim() : `Module ${num}`;
  return { title, text: lines.join("\n").trim() };
}
// Long modules: keep paragraphs spread evenly over the whole module (not just the start) until MAX_CHARS.
function fitText(text) {
  if (text.length <= MAX_CHARS) return text;
  const paras = text.split(/\n\s*\n/).filter((p) => p.trim());
  const keep = Math.max(1, Math.floor(paras.length * MAX_CHARS / text.length));
  const step = paras.length / keep, out = [];
  for (let i = 0; i < keep; i++) out.push(paras[Math.floor(i * step)]);
  return out.join("\n\n").slice(0, MAX_CHARS);
}
// More questions / cards for longer modules.
const howMany = (kind, text) => {
  const k = Math.min(1, text.length / 6000);   // 0 (tiny) .. 1 (long)
  return kind === "quiz" ? Math.round(3 + 2 * k) : Math.round(5 + 3 * k);   // quiz 3-5, cards 5-8
};

/* ---------- checking the model's reply ---------- */
// Clean one string: one line, no list marks in front, no stray closing quote at the end.
function str(s, max) {
  if (typeof s !== "string") return "";
  s = s.replace(/\s+/g, " ").trim().replace(/^(\d+[.)]\s+|[-•*]\s+)/, "");
  const opens = (s.match(/[“"]/g) || []).length, closes = (s.match(/[”"]/g) || []).length;
  if (closes > opens || (s.match(/"/g) || []).length % 2) s = s.replace(/(\s*[”"])+$/, "");
  return s.trim().slice(0, max)
}
// A fixed shuffle (the same every time for the same question), because small models put the right answer first too often.
function shuffle(options, answer, seed) {
  const order = options.map((o, i) => ({ o, i, k: crypto.createHash("md5").update(seed + "|" + i).digest("hex") })).sort((a, b) => (a.k < b.k ? -1 : 1));
  return { options: order.map((x) => x.o), answer: order.findIndex((x) => x.i === answer) };
}
// Turns the model's JSON into clean items, or null if nothing usable came back.
function check(kind, j) {
  if (!j || typeof j !== "object") return null;
  if (kind === "summary") {
    const points = (Array.isArray(j.points) ? j.points : []).map((p) => str(p, 300)).filter(Boolean).slice(0, 8);
    const terms = (Array.isArray(j.terms) ? j.terms : []).map((t) => ({ term: str(t && t.term, 60), meaning: str(t && t.meaning, 200) }))
      .filter((t) => t.term && t.meaning).slice(0, 6);
    return points.length >= 2 ? { points, terms } : null;
  }
  if (kind === "quiz") {
    const seen = new Set(), questions = [];
    for (const q of Array.isArray(j.questions) ? j.questions : []) {
      // options sometimes come as "A. ...", "B. ...": the letters would be out of order after the shuffle
      const question = str(q && q.question, 300), options = (Array.isArray(q && q.options) ? q.options : []).map((o) => str(o, 160).replace(/^[A-Da-d][.)]\s+/, ""));
      const answer = q && Number.isInteger(q.answer) ? q.answer : -1;
      if (!question || seen.has(question.toLowerCase())) continue;
      if (options.length !== 4 || options.some((o) => !o) || new Set(options.map((o) => o.toLowerCase())).size !== 4) continue;
      if (answer < 0 || answer > 3 || options.some((o) => /\b(all|none) of the above\b/i.test(o))) continue;
      seen.add(question.toLowerCase());
      questions.push({ question, ...shuffle(options, answer, question), why: str(q.why, 300) });
    }
    return questions.length ? { questions: questions.slice(0, 6) } : null;
  }
  const seen = new Set(), cards = [];
  for (const c of Array.isArray(j.cards) ? j.cards : []) {
    const front = str(c && c.front, 120), back = str(c && c.back, 240);
    if (!front || !back || seen.has(front.toLowerCase())) continue;
    seen.add(front.toLowerCase());
    cards.push({ front, back });
  }
  return cards.length ? { cards: cards.slice(0, 10) } : null;
}

/* ---------- the study tools ---------- */
// dir: the modules/ folder. cacheFile: where results are kept. model: its name (part of the cache key).
// generate(messages, { format, numPredict, signal }): the model's reply text (server.js queues it on the GPU).
// isIdle(): true when no student is using or waiting for the GPU.
function createStudy({ dir, cacheFile, model, generate, isIdle }) {
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(cacheFile, "utf8")); } catch {}
  const save = () => { try { fs.mkdirSync(path.dirname(cacheFile), { recursive: true }); fs.writeFileSync(cacheFile, JSON.stringify(cache)); } catch {} };
  const keyOf = (kind, courseId, num, text) => crypto.createHash("sha1").update([kind, courseId, num, model, STUDY_SYSTEM, STUDY[kind], text].join("\u0000")).digest("hex");
  const making = new Map();   // key -> Promise, so two students asking at once share one generation

  // { title, items, cached } for one module, or throws { code, msg }.
  async function get(kind, courseId, num, signal) {
    if (!KINDS.includes(kind)) throw { code: 400, msg: "bad_kind" };
    const mod = readModule(dir, courseId, num);
    if (!mod) throw { code: 404, msg: "no_module" };
    if (!mod.text) throw { code: 422, msg: "empty_module" };
    const key = keyOf(kind, courseId, num, mod.text);
    if (cache[key]) return { title: mod.title, items: cache[key].items, cached: true };
    if (!making.has(key)) making.set(key, make(kind, mod, key, signal).finally(() => making.delete(key)));
    return { title: mod.title, items: await making.get(key), cached: false };
  }

  async function make(kind, mod, key, signal) {
    const text = fitText(mod.text), n = howMany(kind, text);
    const ask = STUDY[kind].replace("{n}", n);
    // the grammar also asks for at least n questions / cards (n-1 for the quiz, so one bad question doesn't fail it),
    // or the model sometimes stops after one
    const format = kind === "summary" ? SCHEMAS.summary : JSON.parse(JSON.stringify(SCHEMAS[kind]));
    if (kind === "quiz") format.properties.questions.minItems = Math.max(2, n - 1);
    if (kind === "cards") format.properties.cards.minItems = n;
    const messages = [{ role: "system", content: STUDY_SYSTEM }, { role: "user", content: `${ask}\n\nModule: ${mod.title}\n\n${text}` }];
    const t0 = Date.now();
    // Small models sometimes return an unusable list: one more try before giving up.
    for (let attempt = 1; attempt <= 2; attempt++) {
      const raw = await generate(messages, { format, numPredict: TOKENS[kind], signal });
      let j = null;
      try { j = JSON.parse(raw); } catch {}
      const items = check(kind, j);
      if (items) {
        cache[key] = { items, at: new Date().toISOString(), ms: Date.now() - t0 };
        save();
        return items;
      }
    }
    throw { code: 502, msg: "study_failed" };
  }

  // Make everything that is missing, in the background. Runs one at a time and waits while students use the GPU.
  // Calling it again (after the modules changed) restarts the walk over all modules.
  let run = 0;
  async function prepareAll(log = console.log) {
    const me = ++run, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let made = 0, failed = 0;
    let courses = [];
    try { courses = fs.readdirSync(dir).filter((d) => fs.statSync(path.join(dir, d)).isDirectory()).sort(); } catch {}
    for (const courseId of courses) {
      const nums = fs.readdirSync(path.join(dir, courseId)).filter((f) => f.endsWith(".md")).map((f) => parseInt(f, 10)).filter(Number.isInteger).sort((a, b) => a - b);
      for (const num of nums) for (const kind of KINDS) {
        const mod = readModule(dir, courseId, num);
        if (!mod || !mod.text || cache[keyOf(kind, courseId, num, mod.text)]) continue;
        while (!isIdle()) { await sleep(2000); if (run !== me) return; }
        if (run !== me) return;
        try { await get(kind, courseId, num); made++; } catch (e) { failed++; if (e && e.code !== 502) return log(`Study tools: stopped preparing (${e.msg || e.message || e})`); }
      }
    }
    if (made || failed) log(`Study tools: made ${made} summaries / quizzes / flashcard sets in the background` + (failed ? `, ${failed} failed (they will be tried again when a student opens them)` : ""));
  }

  return { get, prepareAll, KINDS };
}

module.exports = { createStudy, readModule, check, fitText };
