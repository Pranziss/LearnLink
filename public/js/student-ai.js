/* =====================================================================================================================
   LearnLink student app: asking the AI
   ---------------------------------------------------------------------------------------------------------------------
   The app runs inside login.html, which does the actual requests to the Node server (js/login.js: relay() and
   relayStream()). The two talk with postMessage:
     app -> login.html   { llms: { id, q, history } }   ask, streamed answer      (askStream)
                         { llm:  { id, q, ctx } }       ask, whole answer at once  (askOnce, used by the course space)
                         { llmstop: id }                stop a streamed answer
     login.html -> app   { llmr: { id, ev } }           one streamed event: queue / meta / token / done / error
                         { llmr: { id, text, data } }   the whole answer
                         { llmr: { id, err } }          it failed
   Streamed events, from server.js:
     { type: "queue", ahead }                         questions ahead of this one (the GPU answers one at a time)
     { type: "meta", mode, sources, retrieval, model } what kind of answer is coming, and the passages it uses
     { type: "token", t }                             the next bit of text
     { type: "done", text, timings }                  the finished, cleaned-up text
     { type: "error", error }                         a code such as "model_unreachable" (see ERRORS below)
   mode: "grounded" (from the modules, with sources), "general" (AI's own knowledge), "chat" (small talk),
         "none" (not in the modules, and general answers are turned off)
   ===================================================================================================================== */

/* ---------- the bridge to login.html ---------- */
var REQUESTS = {}, nextRequestId = 0;   // id -> handler for that request's replies

window.addEventListener("message", function (e) {
  var m = e.data && e.data.llmr;
  if (m && REQUESTS[m.id]) REQUESTS[m.id](m)
});

// Ask and get the whole answer at once (a Promise of the text). scope: a course name, or null for all courses.
function askOnce(q, scope) {
  return new Promise(function (resolve, reject) {
    var id = ++nextRequestId;
    REQUESTS[id] = function (m) { delete REQUESTS[id]; m.err ? reject(m.err) : resolve(m.text) };
    parent.postMessage({ llm: { id: id, q: q, ctx: scope } }, "*");
    setTimeout(function () { if (REQUESTS[id]) { delete REQUESTS[id]; reject("timeout") } }, 60000)
  })
}

// Ask and get the answer as it is written: onEvent(event) for each streamed event. Returns the request id (for Stop).
function askStream(q, history, onEvent) {
  var id = ++nextRequestId;
  REQUESTS[id] = function (m) {
    if (m.ev) onEvent(m.ev);
    else if (m.err) onEvent({ type: "error", error: m.err })
  };
  parent.postMessage({ llms: { id: id, q: q, scope: null, history: history } }, "*");
  return id
}

// What the server gets as memory: the last few turns before the question just asked, as plain text.
function chatHistory() {
  var h = [];
  CHAT.slice(0, -1).forEach(function (m) {
    if (m.question !== undefined) h.push({ role: "user", content: m.question });
    else if (m.text) h.push({ role: "assistant", content: m.text })
  });
  return h.slice(-8)
}

/* ---------- asking (live) ---------- */
// Plain words for students when an answer fails. What to fix on the server is in the README and the server's log.
var ERRORS = {
  no_server: ["Can’t reach LearnLink", "LearnLink didn’t answer. Check that you’re on the campus Wi‑Fi, then ask again."],
  model_unreachable: ["The AI is busy or offline", "Your question was not answered. Try again in a minute. If it keeps happening, tell your teacher."],
  too_many_requests: ["Slow down a little", "You’re asking very quickly. Wait a few seconds, then ask again."],
  not_logged_in: ["You were logged out", "Log in again to keep asking. Your saved chats are still there."],
  other: ["Something went wrong", "Your question was not answered. Try asking again."]
};
ERRORS.timeout = ERRORS.model_unreachable;
var RETRY = [];   // questions behind "Ask again" buttons (kept out of the HTML)

// The question is already in CHAT (ask() in student-chat.js). Stream the answer into a placeholder message.
function askLive(q) {
  var history = chatHistory();
  var slot = { typing: true, html: typingDots("Thinking…") };
  CHAT.push(slot);
  BUSY = true;
  render();

  var meta = null, text = "", sourcesIndex = -1, started = false, finished = false, requestId = 0;
  // The server sends its first event within seconds; if nothing comes, say so instead of waiting forever.
  var guard = setTimeout(function () { if (!meta) fail("no_server") }, 25000);

  function put(message) {   // replace the placeholder with the final message
    var i = CHAT.indexOf(slot);
    if (i > -1) CHAT[i] = message;
    return i > -1
  }
  function end() {
    finished = true;
    clearTimeout(guard);
    BUSY = false;
    STOP = null;
    render()
  }
  function fail(code) {
    if (finished) return;
    var why = ERRORS[code] || ERRORS.other;
    put({
      html: chip(why[0], "w") + '<p style="margin:10px 0 0;line-height:1.7">' + why[1] + "</p>" +
        (code === "not_logged_in" ? '<button class="p" style="margin-top:8px" onclick="logOut()">Log in again</button>' :
          '<button style="margin-top:8px" onclick="$(\'askInput\').value=RETRY[' + (RETRY.push(q) - 1) + '];ask()">Ask again</button>')
    });
    end()
  }
  // Stop: cancel the request (the server stops generating) and keep whatever was written so far.
  STOP = function () {
    if (finished) return;
    if (requestId) parent.postMessage({ llmstop: requestId }, "*");
    put(text.trim() && meta ? { html: answerHtml(meta, text, sourcesIndex) + '<p class="sm" style="margin:6px 0 0">Stopped.</p>', text: text }
      : { html: '<p class="sm" style="margin:0">Stopped.</p>' });
    end()
  };

  requestId = askStream(q, history, function (ev) {
    if (finished) return;
    if (ev.type === "queue") {
      // Others are being answered first. 0 = it's our turn now.
      if (!started) {
        slot.html = typingDots(ev.ahead > 0 ? (ev.ahead === 1 ? "1 question ahead of yours…" : ev.ahead + " questions ahead of yours…") : "Writing the answer…");
        render()
      }
    } else if (ev.type === "meta") {
      clearTimeout(guard);
      meta = ev;
      if (meta.mode === "grounded") sourcesIndex = SOURCES.push({ title: meta.sources[0].course, live: true, items: sourceItems(meta.sources) }) - 1;
      slot.html = typingDots(meta.mode === "none" ? "" : "Writing the answer…");
      render()
    } else if (ev.type === "token") {
      text += ev.t;
      if (!started) {
        // first words: turn the placeholder into the live answer
        started = true;
        slot.typing = false;
        slot.streaming = true;
        slot.html = answerText(text, sourcesIndex, true);
        render()
      } else {
        // later words: only update the answer itself, not the whole page
        var el = $("live");
        if (el) {
          el.innerHTML = answerText(text, sourcesIndex, true);
          var chat = $("msgs");
          if (chat) chat.scrollTop = chat.scrollHeight
        }
      }
    } else if (ev.type === "done") {
      text = ev.text || text;
      var message = { html: answerHtml(meta, text, sourcesIndex), text: meta.mode === "none" ? "" : text, mode: meta.mode };
      if (put(message)) {
        saveTurn(q, text, meta, ev.timings, message);
        if (meta.mode === "grounded" && /\[\d+\]/.test(text)) {
          S.sourcesIndex = sourcesIndex;
          S.sourcesOpen = !isPhone();   // on a phone the panel would cover the answer: the Sources tab and [1] open it
          S.sourceMarked = 0
        }
      }
      end()
    } else if (ev.type === "error") fail(ev.error)
  })
}

/* ---------- answers as HTML ---------- */
// The model's text as safe HTML. [1] becomes a button that opens that source (when sourcesIndex >= 0; otherwise the
// marks are dropped). **bold** and *italics* marks are removed: the server does the same to the finished answer,
// this covers the words still streaming in. caret: the blinking cursor while it's being written.
function answerText(text, sourcesIndex, caret) {
  text = String(text).replace(/\]\s+(?=[.,;:!?])/g, "]").replace(/\*\*([^*\n]+)\*\*/g, "$1")
    .replace(/(^|[^\w*])\*([^*\s](?:[^*\n]*[^*\s])?)\*(?![\w*])/g, "$1$2");
  return esc(text).replace(/\n+/g, "<br>").replace(/\[(\d+)\]/g, function (a, n) {
    return sourcesIndex >= 0 ? citeButton(sourcesIndex, n) : ""
  }) + (caret ? '<span class="caret"></span>' : "")
}

// A finished answer: a label saying where it came from, the text, and the sources button.
function answerHtml(meta, text, sourcesIndex) {
  var cited = /\[\d+\]/.test(text), notFound = /couldn.t find that in your course modules/i.test(text);
  if (meta.mode === "none") return chip("Not in your modules", "w") + '<p style="margin:10px 0 0;line-height:1.7">I couldn’t find this in your course modules. Try rewording the question with a topic from your course, or ask your instructor to add it.</p>';
  if (meta.mode === "grounded" && notFound && !cited) return chip("Not in your modules", "w") + '<p style="margin:10px 0 0;line-height:1.7">' + answerText(text, -1) + "</p>";
  if (meta.mode === "general") return chip("General answer · AI, not from your modules", "n") + '<p style="margin:10px 0 4px;line-height:1.7">' +
    answerText(text, -1) + '</p><p class="sm" style="margin:0">Your modules didn’t cover this. Verify before using it in coursework.</p>';
  if (meta.mode === "chat") return '<p style="margin:0;line-height:1.7">' + answerText(text, -1) + "</p>";
  return chip("From your modules · " + esc(meta.sources[0].course)) + '<p style="margin:10px 0;line-height:1.8">' + answerText(text, sourcesIndex) + "</p>" +
    '<p class="sm" style="margin:0 0 8px">Numbered parts come from your modules. Any “Think of it this way” line is the AI’s own example.</p>' +
    sourcesButton(sourcesIndex, meta.sources.length)
}

/* ---------- sources and citations ---------- */
// The [n] button inside an answer, and the "3 sources" button under it.
function citeButton(sourcesIndex, n) {
  return '<button class="ct" aria-label="Open source ' + n + '" onclick="cite(' + sourcesIndex + "," + n + ')">' + n + "</button>"
}
function sourcesButton(sourcesIndex, count) {
  return '<button style="font-size:12px;padding:4px 10px" onclick="showSources(' + sourcesIndex + ')">' + count + " source" + (count > 1 ? "s" : "") + "</button>"
}

// The server's sources as Sources panel entries. Each says which course (courseId) and module (pos) it came from,
// so "Open module" can open that exact module; older saved chats only have the module title.
function sourceItems(sources) {
  return sources.map(function (x) {
    var at = findModule(x);
    return { title: x.title, meta: esc(x.course) + " · " + Math.round(Math.max(x.bm25, x.dense || 0) * 100) + "% match", text: x.text,
      course: at[0], module: at[1], sentences: [] }
  })
}
// [course index, module index] of a source, or [-1, -1] if it isn't in this student's course list.
function findModule(x) {
  var ci = -1, m = -1;
  COURSES.forEach(function (c, i) { if (ci < 0 && (x.courseId && c.id ? c.id === x.courseId : c.name === x.course)) ci = i });
  if (ci > -1) {
    var mods = COURSES[ci].modules;
    if (x.pos) mods.forEach(function (mod, i) { if (m < 0 && mod.num === +x.pos) m = i });
    if (m < 0) {   // older saved chats: by title
      var title = String(x.title || "").replace(/^Module\s+\d+:\s*/i, "").toLowerCase();
      mods.forEach(function (mod, i) { if (m < 0 && String(mod.title).toLowerCase() === title) m = i })
    }
  }
  return m < 0 ? [-1, -1] : [ci, m]
}

// "3 sources": open the panel. Tapping [n]: open it with source n outlined and scrolled into view.
function showSources(sourcesIndex) {
  S.sourcesIndex = sourcesIndex;
  S.sourcesOpen = true;
  S.sourceMarked = 0;
  render()
}
function cite(sourcesIndex, n) {
  S.sourcesIndex = sourcesIndex;
  S.sourceMarked = +n;
  S.sourcesOpen = true;
  render();
  setTimeout(function () { var e = D.querySelector("#pn .src.hl"); if (e) e.scrollIntoView({ block: "nearest", behavior: "smooth" }) }, 60)
}
// "Open module" in the Sources panel: that module in the viewer, with this source's passage highlighted.
function openSource(i) {
  var list = SOURCES[S.sourcesIndex], s = list.items[i];
  S.viewer = { course: s.course, module: s.module, sentences: s.sentences, passage: list.live ? s.text : null, n: i + 1 };
  render()
}
