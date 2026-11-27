/* =====================================================================================================================
   LearnLink student app: database calls (account, courses, saved chats, ratings)
   ---------------------------------------------------------------------------------------------------------------------
   The PHP API (api/*.php) is reached through server.js at /api/db/<file>?action=...
   Every call returns a Promise of the JSON reply; a failure (or { error }) rejects with that reply.
   ===================================================================================================================== */

function api(path, body) {
  return fetch("/api/db/" + path, body === undefined ? {} : {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "learnlink" },
    body: JSON.stringify(body)
  }).then(function (r) {
    return r.json().catch(function () { return { error: "php_unreachable" } }).then(function (j) {
      if (!r.ok || j.error) throw j;
      return j
    })
  })
}

/* ---------- loading ---------- */
// Who is logged in. strict (first load): errors are passed on, and no account means back to the login page.
function loadSession(strict) {
  return api("auth?action=me").then(function (j) {
    var u = j.user;
    if (!u) {
      if (strict) throw { error: "not_logged_in" };
      return
    }
    ME.username = u.username || u.name;
    ME.studentId = u.student_id || "";
    ME.email = u.email || "";
    ME.college = u.college || "";
    ME.program = u.program || "";
    ME.year = u.year_level || "";
    ME.section = u.section || "";
    render()
  }, function (e) { if (strict) throw e })
}

// The courses the student can see, with their published modules. Live, the real list always replaces the sample
// one, even when it is empty.
function loadCourses(strict) {
  return api("courses").then(function (j) {
    var list = j.courses.map(function (c) {
      return {
        id: c.id, name: c.name, teacher: c.instructor || "", college: c.college || "",
        modules: c.modules.map(function (m) { return { id: m.id, num: +m.position, title: m.title } })
      }
    });
    if (LIVE || list.length) {
      COURSES = list;
      if (S.course >= COURSES.length) S.course = 0;
      render()
    }
  }, function (e) { if (strict) throw e })
}

function loadChats() {
  return api("chats?action=list").then(function (j) {
    SAVED_CHATS = j.chats;
    render()
  }, function () {})
}

/* ---------- saved chats ---------- */
// Save one finished question + answer. The reply's message id lets the student rate the answer.
function saveTurn(q, text, meta, timings, message) {
  api("chats?action=save", {
    chat_id: chatId,
    q: q,
    text: text,
    meta: { mode: meta.mode, sources: meta.sources, retrieval: meta.retrieval, model: meta.model },
    timings: timings
  }).then(function (j) {
    if (chatId === null) SAVED_CHATS.unshift({ id: j.chat_id, title: q.slice(0, 40) });
    chatId = j.chat_id;
    message.messageId = j.message_id;
    message.rating = 0;
    render()
  }, function () {})
}

// Reopen a saved chat. It shows at once with "Opening your chat…", so a tap never looks like nothing happened.
function openChat(id) {
  leaveGuard(function () {
    function clear() {
      chatId = null;
      CHAT = [];
      SOURCES = [];
      S.view = "chat";
      S.sourcesOpen = false;
      S.sourcesIndex = -1;
      S.searchOpen = false
    }
    clear();
    CHAT = [{ typing: true, html: typingDots("Opening your chat…") }];
    closeSidebarOnPhone();
    render();
    api("chats?action=open&id=" + id).then(function (j) {
      clear();
      chatId = j.chat.id;
      j.messages.forEach(function (m) {
        if (m.role === "user") { CHAT.push({ question: m.content }); return }
        var meta = { mode: m.mode, sources: m.sources || [], retrieval: m.retrieval }, si = -1;
        if (meta.mode === "grounded" && meta.sources.length) si = SOURCES.push({ title: meta.sources[0].course, live: true, items: sourceItems(meta.sources) }) - 1;
        CHAT.push({ html: answerHtml(meta, m.content, si), text: meta.mode === "none" ? "" : m.content, mode: meta.mode, messageId: m.id, rating: m.rating })
      });
      closeSidebarOnPhone();
      render()
    }, function () {
      CHAT = [{ html: chip("Couldn’t open this chat", "w") + '<p style="margin:10px 0 0;line-height:1.7">Check that you’re on the campus Wi‑Fi, then try again. You can still ask a new question below.</p>' +
        '<button style="margin-top:8px" onclick="openChat(' + (+id) + ')">Try again</button>' }];
      render()
    })
  })
}

/* ---------- ratings: "Was this helpful?" under each saved answer ---------- */
var REASONS = ["Missing source", "Doesn’t match my notes", "Answer was too short", "Something else"];

// message.rating: 1 helpful, -1 not helpful, 0 none. askReason: show the reasons after 👎. reason: the one picked.
function ratingBar(m) {
  if (!m.messageId) return "";
  var b = "font-size:12px;padding:3px 10px;", on = "background:var(--acb);border-color:var(--ac);";
  var h = '<div class="sm" style="margin-top:8px;display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span>Was this helpful?</span>' +
    '<button aria-label="Helpful" style="' + b + (m.rating === 1 ? on : "") + '" onclick="rate(' + m.messageId + ',1)">👍</button>' +
    '<button aria-label="Not helpful" style="' + b + (m.rating === -1 ? on : "") + '" onclick="rate(' + m.messageId + ',-1)">👎</button>';
  if (m.askReason) h += '<span style="width:100%">What was wrong?</span>' + REASONS.map(function (w, i) {
    return '<button style="' + b + '" onclick="rateReason(' + m.messageId + "," + i + ')">' + w + "</button>"
  }).join("");
  else if (m.reason) h += "<span>Thanks: " + esc(m.reason) + "</span>";
  else if (m.rating) h += "<span>Thanks for the feedback</span>";
  return h + "</div>"
}

function messageById(id) {
  return CHAT.filter(function (x) { return x.messageId === id })[0]
}

// Tapping the same thumb again takes the rating back.
function rate(id, r) {
  var m = messageById(id);
  if (!m) return;
  if (m.rating === r) r = 0;
  m.rating = r;
  m.askReason = r === -1;
  m.reason = "";
  render();
  api("feedback?action=rate", { message_id: id, rating: r }).catch(function () {})
}

function rateReason(id, i) {
  var m = messageById(id);
  if (!m) return;
  m.askReason = false;
  m.reason = REASONS[i];
  render();
  api("feedback?action=rate", { message_id: id, rating: -1, reason: REASONS[i] }).catch(function () {})
}
