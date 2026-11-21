/* LearnLink student app, part 6: the database (account, courses, saved chats, ratings). */
/* ===== Database: account, courses, chat history, feedback (PHP API through server.js) ===== */
function api(path, body) {
  return fetch("/api/db/" + path, body === undefined ? {} : {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "learnlink" },
    body: JSON.stringify(body)
  }).then(function (r) {
    return r.json().catch (function () {
      return { error: "php_unreachable" }
    }).then(function (j) {
      if (!r.ok || j.error) throw j;
      return j
    })
  })
}
var chatId = null, HL = [], WHY = ["Missing source", "Doesn’t match my notes", "Answer was too short",
  "Something else"];

// who is logged in -> profile fields used by the page
// strict (first load): errors are passed on, and no account means back to the login page.
function loadSession(strict) {
  return api("auth?action=me").then(function (j) {
    var u = j.user;
    if (!u) {
      if (strict) throw { error: "not_logged_in" };
      return;
    }
    R.un = u.username || u.name;
    R.sid = u.student_id || "";
    R.em = (u.email || "").split("@")[0];
    R.col = u.college || "";
    R.prg = u.program || "";
    R.yr = u.year_level || "";
    R.sec = u.section || "";
    render()
  }, function (e) { if (strict) throw e })
}
// Courses and their published modules, from the database:
// [name, instructor, college, module titles, module ids, module numbers]. In live mode the real list always
// replaces the sample one, even when it is empty.
function loadCourses(strict) {
  return api("courses").then(function (j) {
    var rows = j.courses.map(function (c) {
      return [
        c.name,
        c.instructor || "",
        c.college || "",
        c.modules.map(function (m) { return m.title }),
        c.modules.map(function (m) { return m.id }),
        c.modules.map(function (m) { return m.position })
      ]
    });
    if (LIVE || rows.length) {
      CO = rows;
      if (S.ci >= CO.length) S.ci = 0;
      render()
    }
  }, function (e) { if (strict) throw e })
}

function loadChats() {
  return api("chats?action=list").then(function (j) {
    HL = j.chats;
    render()
  }, function () {})
}

// save one finished question + answer; the returned id lets the student rate it
function saveTurn(q, text, M, tm, item) {
  api("chats?action=save", {
    chat_id: chatId,
    q: q,
    text: text,
    meta: { mode: M.mode, sources: M.sources, retrieval: M.retrieval, model: M.model },
    timings: tm
  }).then(function (j) {
    if (chatId === null) HL.unshift({ id: j.chat_id, title: q.slice(0, 40) });
    chatId = j.chat_id;
    item.mid = j.message_id;
    item.rt = 0;
    render()
  }, function () {})
}

function fbH(m) {
  if (!m.mid) return "";
  var b = 'font-size:12px;padding:3px 10px;', on = 'background:var(--acb);border-color:var(--ac);';
  var h = '<div class="sm" style="margin-top:8px;display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span>Was this helpful?</span><button aria-label="Helpful" style="' +
    b + (m.rt === 1 ? on : "") + '" onclick="rate(' + m.mid + ',1)">👍</button><button aria-label="Not helpful" style="' +
    b + (m.rt === -1 ? on : "") + '" onclick="rate(' + m.mid + ',-1)">👎</button>';
  if (m.fr) h += '<span style="width:100%">What was wrong?</span>' + WHY.map(function (w, i) {
    return '<button style="' + b + '" onclick="why(' + m.mid + ',' + i + ')">' + w + '</button>'
  }).join("");
  else if (m.why) h += '<span>Thanks: ' + E(m.why) + '</span>';
  else if (m.rt) h += '<span>Thanks for the feedback</span>';
  return h + "</div>"
}

function msgBy(mid) {
  return CH.filter(function (x) {
    return x.mid === mid
  })[0]
}

function rate(mid, r) {
  var m = msgBy(mid);
  if (!m) return;
  if (m.rt === r) r = 0;
  m.rt = r;
  m.fr = r === -1;
  m.why = "";
  render();
  api("feedback?action=rate", { message_id: mid, rating: r }).catch (function () {})
}

function why(mid, i) {
  var m = msgBy(mid);
  if (!m) return;
  m.fr = false;
  m.why = WHY[i];
  render();
  api("feedback?action=rate", { message_id: mid, rating: -1, reason: WHY[i] }).catch (function () {})
}

// Search chats: saved chats, click to reopen
recs = function () {
  var q = S.sq.toLowerCase(), a = HL.filter(function (h) {
    return h.title.toLowerCase().indexOf(q) > -1
  });
  return a.length ? a.map(function (h) {
    return '<div class="it sm" style="padding:6px 10px;cursor:pointer" onclick="openChat(' + h.id + ')">' +
      E(h.title) + "</div>"
  }).join("") : '<p class="sm" style="padding:4px 10px">No chats yet</p>'
};

function openChat(id) {
  lv(function () {
    api("chats?action=open&id=" + id).then(function (j) {
      clr();
      CH = [];
      MS = [];
      chatId = j.chat.id;
      S.v = "chat";
      S.pn = false;
      S.mi = -1;
      S.srch = false;
      j.messages.forEach(function (m) {
        if (m.role === "user") {
          CH.push({ u: m.content });
          return
        }
        var M = { mode: m.mode, sources: m.sources || [], retrieval: m.retrieval }, mi = -1;
        if (M.mode === "grounded" && M.sources.length) mi = MS.push({
          t: "Sources · " + M.sources[0].course,
          r: 1,
          c: M.sources.map(function (x) {
            return [
              x.title,
              E(x.course) + " · " + (M.retrieval === "hybrid" ? "hybrid" : "keyword") + " match " + Math.round(Math.max(x.bm25,
                x.dense || 0) * 100) + "%",
              x.text,
              0,
              0,
              []
            ]
          })
        }) - 1;
        CH.push({ h: finalH(M, m.content, mi), t: M.mode === "none" ? "" : m.content, mid: m.id, rt: m.rating,
          fr: false })
      });
      mob();
      render()
    }, function () {})
  })
}

