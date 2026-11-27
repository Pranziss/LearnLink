/* =====================================================================================================================
   LearnLink student app: the main layout, sidebar, home screen, chat and Sources panel
   ===================================================================================================================== */

// The whole app screen: sidebar + top bar + the current view + overlays (module viewer, dialogs, tour).
function appView() {
  var body = S.view === "home" || S.view === "chat" ? chatView() : S.view === "settings" ? settingsView() :
    S.view === "course" ? courseView() : spaceView();
  var viewerOpen = S.viewer || (S.view === "course" && S.openModule !== null);
  return '<div id="app">' + (S.sidebarOpen ? sidebar() : "") +
    "<main>" + topBar() + networkBanner() + body.main + (body.side || "") + "</main>" +
    (viewerOpen ? moduleViewer() : "") + leaveQuizDialog() + tourCard() + "</div>"
}

function topBar() {
  return '<div class="top"><div style="display:flex;align-items:center;gap:8px"><button class="g" aria-label="Menu" onclick="toggleSidebar()" style="font-size:18px">☰</button>' +
    botIcon(26) + "<b>LearnLink</b></div></div>"
}

/* ---------- sidebar ---------- */
function sidebar() {
  var inCourse = S.view === "course" || S.view === "space";
  var courses = COURSES.length ? COURSES.map(function (c, i) {
    return '<button class="it' + (inCourse && S.course === i ? " on" : "") + '" onclick="openCourse(' + i + ')">' + esc(c.name) + "</button>"
  }).join("") : '<p class="sm" style="margin:4px 14px 8px">No courses yet. Courses appear here once your teacher sets them up.</p>';
  return '<aside id="sb">' +
    '<button class="p" onclick="newChat()" style="margin-bottom:10px">+ New chat</button>' +
    '<button class="it" onclick="S.searchOpen=!S.searchOpen;render()">Search chats</button>' +
    (S.searchOpen ? '<input placeholder="Search your chats" value="' + esc(S.searchText) + '" style="width:100%;margin:2px 0 6px" oninput="S.searchText=this.value;$(\'rec\').innerHTML=savedChatList()">' +
      '<div id="rec">' + savedChatList() + "</div>" : "") +
    '<button class="it" onclick="S.coursesOpen=!S.coursesOpen;render()">Courses enrolled ' + (S.coursesOpen ? "▾" : "▸") + "</button>" +
    (S.coursesOpen ? '<div class="sub">' + courses + "</div>" : "") +
    '<div style="margin-top:auto;border-top:1px solid var(--bd);padding-top:8px"><button class="it' + (S.view === "settings" ? " on" : "") +
    '" onclick="openSettings()">Settings</button></div></aside>'
}

// Saved chats that match the search box; tap one to reopen it.
function savedChatList() {
  var q = S.searchText.toLowerCase(), found = SAVED_CHATS.filter(function (h) { return h.title.toLowerCase().indexOf(q) > -1 });
  return found.length ? found.map(function (h) {
    return '<div class="it sm" style="padding:6px 10px;cursor:pointer" onclick="openChat(' + h.id + ')">' + esc(h.title) + "</div>"
  }).join("") : '<p class="sm" style="padding:4px 10px">No chats yet</p>'
}

// On a phone, tapping outside the open menu closes it.
D.addEventListener("click", function (e) {
  if (!isPhone() || !S.sidebarOpen || S.screen !== "app") return;
  var t = e.target;
  if (t.closest && (t.closest("#sb") || t.closest('[aria-label="Menu"]'))) return;
  closeSidebar()
}, true);

/* ---------- going places (each asks first if a quiz is in progress: see leaveGuard() in student-courses.js) ---------- */
function newChat() {
  leaveGuard(function () {
    chatId = null;
    CHAT = [];
    SOURCES = [];
    lastTopic = null;
    S.view = "home";
    S.sourcesOpen = false;
    S.sourcesIndex = -1;
    closeSidebarOnPhone();
    render()
  })
}
function openCourse(i) {
  leaveGuard(function () {
    S.view = "course";
    S.course = i;
    S.selected = [];
    S.openModule = null;
    closeSidebarOnPhone();
    render()
  })
}
function openSettings() {
  leaveGuard(function () { S.view = "settings"; closeSidebarOnPhone(); render() })
}

/* ---------- home screen ---------- */
// Suggestions under the question box (live): one module from each of three different courses, phrased three ways.
// They change once a day, not on every redraw. Generic titles ("Course Overview", "Case Studies") are skipped.
function suggestions() {
  if (!LIVE) return ["What is the CIA triad?", "Ethics vs morality", "Flexbox vs grid"];
  var day = Math.floor(Date.now() / 864e5), ways = ["Explain ", "Quiz me on ", "Key terms in "];
  var perCourse = COURSES.map(function (c) {
    return c.modules.map(function (m) { return m.title })
      .filter(function (t) { return !/^(course overview|overview|introduction|applications|case studies|review|summary)$/i.test(t.trim()) })
  }).filter(function (ts) { return ts.length });
  var out = [];
  for (var i = 0; i < perCourse.length && out.length < 3; i++) {
    var ts = perCourse[(day + i) % perCourse.length], t = ts[(day + i) % ts.length];
    t = t.replace(/^(introduction to|intro to|(what|who) (is|are))\s+/i, "").replace(/\?$/, "");
    out.push(ways[out.length] + t)
  }
  return out
}

function homeView() {
  return '<div class="sc" style="display:grid;place-items:center;padding-bottom:40px"><div style="width:100%;max-width:540px">' +
    '<div style="display:flex;justify-content:center;margin-bottom:10px">' + botIcon(84) + "</div>" +
    '<h2 style="text-align:center;font-size:26px;margin:0 0 6px;letter-spacing:-.01em">What do you want to study today?</h2>' +
    '<p style="text-align:center;color:var(--t2);margin:0 0 18px">Your teachers’ modules come first, with sources. Anything else gets a clearly labeled general answer.</p>' +
    askBox("Ask anything…") +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px">' + suggestions().map(function (t) {
      return '<button class="sug" onclick="$(\'askInput\').value=this.textContent;$(\'askInput\').focus()">' + esc(t) + "</button>"
    }).join("") + "</div></div></div>"
}

// The question box. While an answer is being written, the send button is a Stop button.
function askBox(placeholder) {
  return '<div style="display:flex;gap:8px;align-items:flex-end;background:var(--s2);border:1px solid var(--bd2);border-radius:16px;padding:8px 8px 8px 14px">' +
    '<textarea id="askInput" rows="1" placeholder="' + placeholder + '" style="flex:1;border:none;resize:none;padding:6px 0;background:transparent;outline:none" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();ask()}"></textarea>' +
    (STOP ? '<button class="p" aria-label="Stop answering" title="Stop" onclick="STOP&&STOP()" style="width:36px;height:36px;border-radius:50%;padding:0">■</button>'
      : '<button class="p" aria-label="Send" onclick="ask()" style="width:36px;height:36px;border-radius:50%;padding:0">↑</button>') + "</div>"
}

/* ---------- chat ---------- */
function chatView() {
  if (S.view === "home") return { main: homeView() };
  var messages = CHAT.map(function (m, i) {
    if (m.question !== undefined) return questionBubble(m.question);
    return answerRow(m.html + ratingBar(m) + followUps(m, i), m.streaming ? ' id="live"' : "")
  }).join("");
  var main = '<div class="sc" id="msgs" style="padding-right:' + (S.sourcesOpen ? "292px" : "22px") + '">' + messages + "</div>" +
    '<div style="padding:0 22px 16px">' + askBox("Ask a follow-up…") + "</div>";
  var list = SOURCES[S.sourcesIndex], side = "";
  if (list && S.sourcesOpen) side = sourcesPanel(list);
  else if (list) side = '<div id="tab" onclick="S.sourcesOpen=true;render()">Sources (' + list.items.length + ")</div>";
  return { main: main, side: side }
}

// Follow-ups under the latest answer: one tap asks again about the same topic (the server knows what "this" means
// from the chat so far). Only after module or general answers, not after small talk or errors.
var FOLLOW_UPS = ["Give me an example", "Explain it more simply", "Quiz me on this", "Ipaliwanag sa Filipino"];
function followUps(m, i) {
  if (!LIVE || BUSY || i !== CHAT.length - 1 || !m.text || (m.mode !== "grounded" && m.mode !== "general")) return "";
  return '<div class="fu" role="group" aria-label="Ask a follow-up">' + FOLLOW_UPS.map(function (t) {
    return '<button class="sug" onclick="$(\'askInput\').value=this.textContent;ask()">' + t + "</button>"
  }).join("") + "</div>"
}

// The Sources panel: each passage behind the answer, with "Open module" to read it in place.
function sourcesPanel(list) {
  var items = list.items.map(function (s, i) {
    var canOpen = s.course > -1;
    return '<div class="src' + (S.sourceMarked === i + 1 ? " hl" : "") + '"><b>' + (i + 1) + ". " + esc(s.title) + "</b>" +
      '<div class="sm">' + s.meta + "</div>" +
      '<p class="sm" style="border-left:2px solid var(--bd2);padding-left:8px;margin:8px 0">' + esc(s.text) + "</p>" +
      (canOpen ? '<button style="width:100%;font-size:12px" onclick="openSource(' + i + ')">Open module</button>' : "") + "</div>"
  }).join("");
  return '<div id="pn">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;padding:14px;border-bottom:1px solid var(--bd)"><div><b>Sources</b><div class="sm">' + esc(list.title) + "</div></div>" +
    '<button class="g" aria-label="Close sources" onclick="closeSources()">✕</button></div>' +
    '<div style="flex:1;overflow-y:auto;padding:12px">' + items + "</div>" +
    '<div class="sm" style="padding:10px 14px;border-top:1px solid var(--bd)">Only your enrolled courses are searched.</div></div>'
}

/* ---------- asking ---------- */
// The send button / Enter. Live: the real AI (askLive, student-ai.js). Demo: canned answers (askDemo, student-demo.js).
function ask() {
  var input = $("askInput"), q = input ? input.value.trim() : "";
  if (!q || BUSY) return;
  input.value = "";
  if (S.view === "home") S.view = "chat";
  CHAT.push({ question: q });
  LIVE ? askLive(q) : askDemo(q)
}
