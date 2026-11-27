/* =====================================================================================================================
   LearnLink student app: core (load first)
   ---------------------------------------------------------------------------------------------------------------------
   How the student app works
   - apps/student.html loads these files in order. They are plain scripts that share global variables (no build step):
       student-core.js      state, render(), small shared helpers                       <- this file
       student-demo.js      sample courses and canned answers for ?demo (no server)
       student-signup.js    creating an account
       student-chat.js      sidebar, home screen, chat, Sources panel
       student-ai.js        asking the AI (streamed answers), answer formatting, citations
       student-courses.js   a course's modules, the module viewer, the course space (Ask / Summary / Quiz / Flashcards)
       student-db.js        database calls: account, courses, saved chats, ratings
       student-settings.js  Settings page
       student-network.js   offline / weak-connection banner
       student-tour.js      first-login tour
       student-start.js     first draw and first data load (load last)
   - The whole page is a string of HTML rebuilt by render() after every change: change S (or the data below), then
     call render(). Each screen is a function that returns HTML (homeView(), chatView(), courseView(), ...).
   - "Live" means the app runs inside login.html (an iframe) with a real account. Opened on its own with ?demo it shows
     sample data instead (student-demo.js). The AI is reached through login.html (see student-ai.js).
   - The CSS (css/student.css) styles elements by id: #sb sidebar, #pn Sources panel, #vw module viewer, #msgs chat,
     #tab Sources tab. Keep those ids when changing the HTML.
   ===================================================================================================================== */

var D = document;
function $(id) { return D.getElementById(id) }

// Make text safe to put inside HTML (and inside "quoted" attributes).
function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

// Live inside login.html (real data); on its own (?demo) it shows the sample data.
var LIVE = window.parent !== window;
var PHONE_WIDTH = 760;   // at or below this width: phone layout (same breakpoint as student.css)
function isPhone() { return innerWidth <= PHONE_WIDTH }

/* ---------- app state: what is on screen ---------- */
var S = {
  screen: /start=app/.test(location.search) ? "app" : "signup",   // "signup" or "app"

  // sidebar
  sidebarOpen: !isPhone(),
  coursesOpen: true,        // "Courses enrolled" list expanded
  searchOpen: false,        // "Search chats" box shown
  searchText: "",

  view: "home",             // "home" | "chat" | "course" | "space" (course space) | "settings"
  course: 1,                // index in COURSES of the course being looked at
  selected: [],             // module indexes picked on the course page (none = all modules)
  online: true,             // false when there is no usable connection (student-network.js)

  // Sources panel (the list of passages behind an answer)
  sourcesOpen: false,
  sourcesIndex: -1,         // which entry of SOURCES the panel shows
  sourceMarked: 0,          // number of the source outlined in the panel (1, 2, ...), 0 = none

  // module viewer
  openModule: null,         // module index opened from the course page ("Open"), or null
  viewer: null,             // module opened from a source: { course, module, sentences, passage, n, scrolled }

  // course space
  spaceTab: "ask",          // "ask" | "sum" | "quiz" | "fc"
  spaceChat: [],            // questions asked in the space: { question, html, modules, failed }
  spaceTyping: null,        // { question, status } while a space answer is on its way
  quizIndex: 0,             // current question
  quizScore: 0,
  quizAnswer: null,         // option picked for the current question, or null
  cardIndex: 0,             // current flashcard
  cardFlipped: false,
  confirmLeave: null,       // function to run if the student confirms leaving a quiz in progress

  tourStep: null            // first-login tour card on screen (0, 1, 2), or null
};

/* ---------- data ---------- */
// Courses the student can see (from the database, or the samples in ?demo):
//   { id, name, teacher, college, modules: [{ id, num, title }] }
// "num" is the module's own number, so a hidden module doesn't shift the count.
var COURSES = [];
// The current chat, in order. A message is one of:
//   { question }                                   what the student asked
//   { typing: true, html }                         "Thinking…" placeholder while the answer is coming
//   { html, text, mode, messageId, rating, ... }   an answer (see student-ai.js and the ratings in student-db.js)
var CHAT = [];
// Source lists behind answers in this chat; answers point at one by index:
//   { title, live, items: [{ title, meta, text, course, module, sentences }] }
// course / module are indexes into COURSES (-1 when the module can't be found); sentences: demo highlights.
var SOURCES = [];
var SAVED_CHATS = [];      // the student's saved chats: { id, title }
var chatId = null;         // database id of the chat on screen (null until its first answer is saved)
// The logged-in student (from the database; empty in ?demo, where the sample profile is shown).
var ME = { username: "", studentId: "", email: "", college: "", program: "", year: "", section: "", photo: "" };
var BUSY = false;          // an answer is being written: no new question until it's done
var STOP = null;           // while an answer streams: a function that stops it (the send button becomes Stop)

function displayName() { return ME.username || "maria_santos" }

// "Module N: Title" for module m of course c, safe for HTML.
function moduleTitle(c, m) {
  var mod = COURSES[c].modules[m];
  return "Module " + mod.num + ": " + esc(mod.title)
}

/* ---------- render ---------- */
// Every change redraws the page from scratch. So that it doesn't look like a reload:
// - the page's fade-in ("enter") plays only when the screen really changes (another view, course, tab, card),
//   not for a new message, a rating or opening/closing Sources;
// - the Sources panel, the phone menu and the module viewer slide in only when they open (pn-in, sb-in, vw-in);
// - the chat keeps its scroll position, and only follows to the bottom for a new message or when already there;
// - the module viewer keeps its scroll position while the same module stays open;
// - whatever the student was typing (and the cursor) survives the redraw.
var LAST = { page: null, module: "", sources: false, sidebar: false, messages: -1 };
function render() {
  if (S.screen === "signup" && typeof gatherForm === "function") gatherForm();
  var typing = rememberTyping();

  var page = [S.screen, S.screen === "signup" ? signupStep() : S.view, S.spaceTab, S.course, S.quizIndex, S.cardIndex].join("|");
  var module = S.viewer ? S.viewer.course + "." + S.viewer.module : S.openModule !== null && S.view === "course" ? S.course + "." + S.openModule : "";
  var cls = [];
  if (page !== LAST.page) cls.push("enter");
  if (module && module !== LAST.module) cls.push("vw-in");
  if (S.sourcesOpen && !LAST.sources) cls.push("pn-in");
  if (S.sidebarOpen && !LAST.sidebar) cls.push("sb-in");
  // only messages that were just added slide in (1 or 2: a question and its "Thinking…" arrive together)
  if (LAST.messages >= 0 && CHAT.length > LAST.messages) cls.push("msg-new" + Math.min(2, CHAT.length - LAST.messages));

  var oldViewer = $("vwb"), viewerTop = oldViewer && module === LAST.module ? oldViewer.scrollTop : 0;
  var oldChat = $("msgs"), chatTop = oldChat ? oldChat.scrollTop : null,
    chatAtEnd = oldChat ? oldChat.scrollHeight - oldChat.scrollTop - oldChat.clientHeight < 80 : true;
  var root = $("root");
  root.className = cls.join(" ");
  root.innerHTML = S.screen === "signup" ? signupView() : appView();

  var viewer = $("vwb");
  if (viewer && viewerTop) viewer.scrollTop = viewerTop;
  var chat = $("msgs");
  if (chat) chat.scrollTop = CHAT.length !== LAST.messages || chatAtEnd || chatTop === null || cls[0] === "enter" ? chat.scrollHeight : chatTop;

  LAST = { page: page, module: module, sources: S.sourcesOpen, sidebar: S.sidebarOpen, messages: CHAT.length };
  restoreTyping(typing)
}

// Keep the text box the student is typing in (value, cursor and focus) across a redraw.
function rememberTyping() {
  var a = D.activeElement;
  var isText = a && a.id && (a.tagName === "TEXTAREA" || (a.tagName === "INPUT" && !/^(file|checkbox|range)$/.test(a.type)));
  return isText ? { id: a.id, el: a, value: a.value, from: a.selectionStart, to: a.selectionEnd } : null
}
function restoreTyping(t) {
  if (!t) return;
  var n = $(t.id);
  if (!n || n === t.el) return;
  n.value = t.value;
  n.focus();
  try { n.setSelectionRange(t.from, t.to) } catch (x) {}
}

/* ---------- panels that slide out before they close ---------- */
// Plays the closing animation (a CSS class on the element), then runs done(). No animation with "reduce motion".
function slideOut(id, cls, done) {
  var el = $(id);
  if (!el || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return done();
  el.classList.add(cls);
  setTimeout(done, 180)
}
function closeViewer() { slideOut("vw", "vw-out", function () { S.openModule = null; S.viewer = null; render() }) }
function closeSources() { slideOut("pn", "pn-out", function () { S.sourcesOpen = false; render() }) }
function closeSidebar() {
  if (!isPhone()) { S.sidebarOpen = false; render(); return }
  slideOut("sb", "sb-out", function () { S.sidebarOpen = false; render() })
}
function toggleSidebar() { S.sidebarOpen ? closeSidebar() : (S.sidebarOpen = true, render()) }
// On a phone the menu covers the page, so it closes when the student goes somewhere.
function closeSidebarOnPhone() { if (isPhone()) S.sidebarOpen = false }

/* ---------- small pieces of HTML used in many places ---------- */
// The LearnLink robot.
function botIcon(size) {
  return '<svg width="' + size + '" height="' + Math.round(size * 1.1) + '" viewBox="0 0 40 44" style="flex-shrink:0;display:block" role="img" aria-label="LearnLink AI"><line x1="20" y1="8.5" x2="20" y2="4" stroke="#FFB800" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="3.6" r="2.6" fill="#FFB800" stroke="#fff" stroke-width="1"/><path d="M3 26A17 17 0 0 1 37 26Z" fill="#002583"/><path d="M3 26A17 17 0 0 0 37 26Z" fill="#FFB800"/><circle cx="20" cy="26" r="17" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="14" cy="22" r="3.6" fill="#fff"/><circle cx="26" cy="22" r="3.6" fill="#fff"/><circle cx="14.8" cy="22.6" r="1.9" fill="#0A1A45"/><circle cx="26.8" cy="22.6" r="1.9" fill="#0A1A45"/><circle cx="15.4" cy="21.8" r=".7" fill="#fff"/><circle cx="27.4" cy="21.8" r=".7" fill="#fff"/><circle cx="9.5" cy="31.5" r="2.2" fill="#F08A24" opacity=".55"/><circle cx="30.5" cy="31.5" r="2.2" fill="#F08A24" opacity=".55"/><path d="M15.5 31Q20 35.5 24.5 31" fill="none" stroke="#0A1A45" stroke-width="2.2" stroke-linecap="round"/></svg>'
}
// Three bouncing dots, with an optional status ("Writing the answer…").
function typingDots(status) {
  return '<div class="typ" role="status"><span class="d"></span><span class="d"></span><span class="d"></span>' +
    (status ? '<span class="tx">' + status + "</span>" : "") + "</div>"
}
// Loading placeholder: grey lines of the given widths ("0" = a paragraph gap). Styles: .skl in student.css.
function skeleton(widths) {
  return widths.map(function (w) { return w === "0" ? '<div style="height:10px"></div>' : '<i class="skl" style="width:' + w + '"></i>' }).join("")
}
// A coloured label above an answer. kind: "" (blue, from the modules), "n" (neutral), "w" (warning).
function chip(text, kind) { return '<span class="chip' + (kind ? " " + kind : "") + '">' + text + "</span>" }
// A student's question bubble (right side) and the robot's side of the chat (left side).
function questionBubble(text) {
  return '<div style="display:flex;justify-content:flex-end;margin:10px 0"><div style="background:var(--s1);border-radius:16px;padding:8px 14px;max-width:80%">' + esc(text) + "</div></div>"
}
function answerRow(inner, attrs) {
  return '<div style="display:flex;gap:10px;align-items:flex-start;margin:12px 0">' + botIcon(34) + '<div' + (attrs || "") + ' style="flex:1;min-width:0">' + inner + "</div></div>"
}

function logOut() { parent.postMessage("logout", "*") }
