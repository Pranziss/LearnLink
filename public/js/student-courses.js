/* =====================================================================================================================
   LearnLink student app: a course's page, the module viewer, and the course space (Ask / Summary / Quiz / Flashcards)
   ===================================================================================================================== */

/* ---------- course page: the list of modules ---------- */
function courseView() {
  var c = COURSES[S.course];
  var modules = c.modules.map(function (m, i) {
    var on = S.selected.indexOf(i) > -1;
    return '<div class="mod' + (on ? " on" : "") + '" onclick="toggleModule(' + i + ')"><div class="ck">' + (on ? "✓" : "") + "</div>" +
      '<div style="flex:1;min-width:0"><b>' + moduleTitle(S.course, i) + "</b></div>" +
      '<button style="font-size:12px;padding:4px 10px" onclick="event.stopPropagation();S.openModule=' + i + ';render()">Open</button></div>'
  }).join("");
  var main = '<div class="sc"><h2 style="margin:6px 0 0">' + esc(c.name) + "</h2>" +
    '<p class="sm" style="margin:0 0 14px">' + [c.teacher || "No instructor assigned yet", c.college].filter(Boolean).map(esc).join(" · ") + "</p>" +
    (c.modules.length ? '<p class="sm" style="margin:0 0 8px">Select modules to focus on, or leave none selected to use them all.</p>' :
      '<div class="card"><b>No modules yet</b><p class="sm" style="margin:4px 0 0">Your teacher hasn’t published any modules for this course. Check back later.</p></div>') +
    modules + "</div>";
  var n = S.selected.length;
  var bar = '<div class="fl"><span class="chip n">Applies to ' + (n ? n + " selected module" + (n > 1 ? "s" : "") : "all modules") + "</span>" +
    '<div class="bar"><button class="p" onclick="openSpace(\'ask\')">Ask a question</button><button onclick="openSpace(\'sum\')">Summary</button>' +
    '<button onclick="openSpace(\'quiz\')">Quiz</button><button onclick="openSpace(\'fc\')">Flashcards</button></div></div>';
  return { main: main, side: bar }
}

function toggleModule(i) {
  var k = S.selected.indexOf(i);
  k > -1 ? S.selected.splice(k, 1) : S.selected.push(i);
  render()
}

// The modules the course space works on: the selected ones, or all of them.
function spaceModules() {
  return S.selected.length ? S.selected.slice().sort() : COURSES[S.course].modules.map(function (m, i) { return i })
}

/* ---------- module viewer ---------- */
// Opened from the course page (S.openModule) or from a source (S.viewer). Live it shows the module's real text;
// in the demo, the sample sentences.
function moduleViewer() {
  var V = S.viewer || { course: S.course, module: S.openModule, sentences: [] };
  var c = COURSES[V.course], mod = c && c.modules[V.module];
  if (LIVE && mod && mod.id) return liveModuleViewer(V, mod);
  var sentences = sampleModule(V.course, V.module).summary;
  return viewerFrame(moduleTitle(V.course, V.module), esc(c.name) + (V.sentences.length ? " · highlighted sentences were used in the answer" : " · mock preview"),
    '<h3 style="margin:0 0 12px">' + esc(mod.title) + '</h3><p style="line-height:2;margin:0">' + sentences.map(function (x, i) {
      return V.sentences.indexOf(i) > -1 ? "<mark>" + x + "</mark>" : x
    }).join(" ") + "</p>", 460)
}

function viewerFrame(title, subtitle, body, width) {
  return '<div class="vw" id="vw"><div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--bd)">' +
    "<div><b>" + title + '</b><div class="sm">' + subtitle + "</div></div>" +
    '<button class="g" aria-label="Close module" onclick="closeViewer()">✕</button></div>' +
    '<div id="vwb" style="flex:1;overflow-y:auto;padding:24px;display:grid;place-items:start center"><div class="card" style="max-width:' + width + 'px;width:100%;padding:22px">' + body + "</div></div></div>"
}

// The module's real text: what LearnLink reads from its files, loaded once per module (MODULE_TEXT[id]).
// V.passage is the passage a citation points to (the server's chunk of this module): the paragraphs it came from are
// highlighted and scrolled to once. Matching ignores case, markdown and punctuation, because the server's chunker
// (retrieval.js) strips **bold**, glues a bullet list to the paragraph above it, and splits long paragraphs.
var MODULE_TEXT = {};
function plainWords(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() }

function liveModuleViewer(V, mod) {
  var d = MODULE_TEXT[mod.id], passage = V.passage ? plainWords(V.passage) : "", hits = 0;
  if (d === undefined) {
    d = MODULE_TEXT[mod.id] = "loading";
    api("courses?action=module_text&id=" + mod.id).then(function (j) { MODULE_TEXT[mod.id] = j; render() }, function () { MODULE_TEXT[mod.id] = "error"; render() })
  }
  function paragraph(raw) {
    var words = plainWords(raw), hit = passage && words.length > 15 && (passage.indexOf(words) > -1 || words.indexOf(passage) > -1);
    // light markdown: **bold**, "- " bullets
    var html = esc(raw).replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>").replace(/^[-*]\s+/gm, "• ").replace(/\n/g, "<br>");
    return "<p" + (hit ? ' class="phl"' + (hits++ ? "" : ' id="phl"') : "") + ' style="line-height:1.8;margin:0 0 12px">' + html + "</p>"
  }
  function block(b) {
    b = b.trim();
    if (!/^#{1,3}\s/.test(b)) return b ? paragraph(b) : "";
    // a "## heading" line, maybe with text right under it
    var lines = b.split("\n"), rest = lines.slice(1).join("\n").trim();
    return '<h4 style="margin:16px 0 8px">' + esc(lines[0].replace(/^#+\s*/, "")) + "</h4>" + (rest ? paragraph(rest) : "")
  }

  var body;
  if (d === "loading") body = '<div role="status" aria-label="Loading the module">' + skeleton(["40%", "100%", "95%", "88%", "0", "100%", "92%", "70%"]) + "</div>";
  else if (d === "error") body = '<p class="sm">Couldn’t load this module. Check that you’re on the campus Wi‑Fi.</p><button onclick="delete MODULE_TEXT[' + (+mod.id) + '];render()">Try again</button>';
  else {
    var files = d.files.filter(function (f) { return f.download });
    body = (d.text ? d.text.replace(/\r/g, "").split(/\n\s*\n/).map(block).join("") : '<p class="sm">This module has no readable text yet.</p>') +
      (files.length ? '<div style="border-top:1px solid var(--bd);margin-top:16px;padding-top:12px"><b class="sm">Files</b>' + files.map(function (f) {
        return '<div style="margin-top:6px"><a href="/api/db/materials?action=download&id=' + f.id + '">' + esc(f.name) + "</a></div>"
      }).join("") + "</div>" : "")
  }
  if (hits && !V.scrolled) {
    V.scrolled = true;
    setTimeout(function () { var e = $("phl"); if (e) e.scrollIntoView({ block: "center", behavior: "smooth" }) }, 300);   // after the slide-in
  }
  return viewerFrame(moduleTitle(V.course, V.module),
    esc(COURSES[V.course].name) + (hits ? " · highlighted: the passage behind source [" + V.n + "]" : " · the text LearnLink answers from"), body, 720)
}

/* ---------- course space ---------- */
var SPACE_TABS = [["ask", "Ask"], ["sum", "Summary"], ["quiz", "Quiz"], ["fc", "Flashcards"]];

function openSpace(tab) {
  leaveGuard(function () {
    S.view = "space";
    S.spaceTab = tab;
    S.quizIndex = 0;
    S.quizScore = 0;
    S.quizAnswer = null;
    S.cardIndex = 0;
    S.cardFlipped = false;
    render()
  })
}
// The ✕ on a module in the "Scope" row.
function removeFromScope(i) {
  leaveGuard(function () {
    S.selected = S.selected.filter(function (x) { return x !== i });
    S.quizIndex = 0;
    S.quizScore = 0;
    S.quizAnswer = null;
    S.cardIndex = 0;
    render()
  })
}

function spaceView() {
  var c = COURSES[S.course];
  var scope = S.selected.length ? S.selected.slice().sort().map(function (i) {
    return '<span class="chip">' + moduleTitle(S.course, i) + '<button aria-label="Remove module" onclick="removeFromScope(' + i + ')">✕</button></span>'
  }).join("") : '<span class="chip n">All modules in ' + esc(c.name) + "</span>";
  var head = '<div class="sc"><div style="display:flex;align-items:center;gap:8px"><button class="g" aria-label="Back to modules" onclick="leaveGuard(function(){S.view=\'course\';render()})">←</button><b>' +
    esc(c.name) + "</b></div>" +
    '<div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:10px 0 12px"><span class="sm">Scope</span>' + scope + "</div>" +
    '<div class="seg">' + SPACE_TABS.map(function (t) {
      return '<button class="' + (S.spaceTab === t[0] ? "on" : "") + '" onclick="openSpace(\'' + t[0] + "')\">" + t[1] + "</button>"
    }).join("") + "</div>";
  var tab = S.spaceTab === "ask" ? spaceAskTab() : S.spaceTab === "sum" ? summaryTab() : S.spaceTab === "quiz" ? quizTab() : flashcardsTab();
  return { main: head + tab + "</div>" }
}

// Shown live for Summary / Quiz / Flashcards until the AI makes them.
function comingSoon(what) {
  return '<div class="card" style="text-align:center;padding:24px">' + chip("Coming soon", "n") + '<p style="margin:10px 0 0;line-height:1.6">' + what +
    " made from your modules are on the way. For now, use <b>Ask</b>, for example “Summarize this module” or “Quiz me on this”.</p></div>"
}

/* Ask tab: questions about the modules in scope */
function spaceAskTab() {
  var h = S.spaceChat.map(function (m) {
    return questionBubble(m.question) + answerRow(chip(m.failed ? "Couldn’t answer" : "From your modules", m.failed ? "w" : "") +
      '<p style="line-height:1.7">' + m.html + '</p><div style="display:flex;gap:6px;flex-wrap:wrap">' + m.modules.map(function (i) {
        return '<span class="chip n">' + moduleTitle(S.course, i) + "</span>"
      }).join("") + "</div>")
  }).join("");
  if (S.spaceTyping) h += questionBubble(S.spaceTyping.question) + answerRow(typingDots(S.spaceTyping.status));
  if (!S.spaceChat.length && !S.spaceTyping) h += '<div class="card" style="text-align:center;padding:22px"><b>Ask about ' +
    (S.selected.length ? "the selected module" + (S.selected.length > 1 ? "s" : "") : "this course") + '</b><p class="sm">Answers come only from the modules in scope.</p>' +
    '<div class="fu" style="justify-content:center">' + ["Summarize this", "What are the key terms?", "Quiz me with 3 questions"].map(function (t) {
      return '<button class="sug" onclick="spaceAsk(this.textContent)">' + t + "</button>"
    }).join("") + "</div></div>";
  return h + '<div style="display:flex;gap:8px;margin-top:14px"><input id="spaceInput" placeholder="Ask a question…" style="flex:1" onkeydown="if(event.key===\'Enter\')spaceAsk()"><button class="p" onclick="spaceAsk()">Ask</button></div>'
}

// Ask in the course space (typed, or a suggestion). Live: the real AI, limited to this course; it never falls back to
// a sample answer. The answer shows after at least 1.5 s so the "Finding modules…" steps can be read.
function spaceAsk(text) {
  var input = $("spaceInput"), q = (text || (input && input.value) || "").trim();
  if (!q || BUSY) return;
  BUSY = true;
  if (input) input.value = "";
  S.spaceTyping = { question: q, status: "Finding modules…" };
  render();
  setTimeout(function () { if (S.spaceTyping) { S.spaceTyping.status = "Writing the answer…"; render() } }, 800);
  function done(answer) {
    S.spaceTyping = null;
    BUSY = false;
    S.spaceChat.push(answer);
    render()
  }
  if (!LIVE) return setTimeout(function () { var a = sampleSpaceAnswer(); done({ question: q, html: a.html, modules: a.modules }) }, 1600);
  var t0 = Date.now();
  askOnce(q, COURSES[S.course].name).then(function (x) {
    setTimeout(function () {
      done({ question: q, html: esc(x).replace(/\n/g, "<br>").replace(/\[(\d)\]/g, '<span class="ct">$1</span>'), modules: [] })
    }, Math.max(0, 1500 - (Date.now() - t0)))
  }, function () {
    done({ question: q, html: "LearnLink couldn’t write an answer right now. Check your connection, then try again.", modules: [], failed: true })
  })
}

/* Summary tab */
function summaryTab() {
  if (LIVE) return comingSoon("Summaries");
  return spaceModules().map(function (m) {
    return '<div class="card" style="margin-bottom:10px"><b>' + moduleTitle(S.course, m) + '</b><ul style="padding-left:18px;line-height:1.7;margin:6px 0 0">' +
      sampleModule(S.course, m).summary.map(function (x) { return "<li>" + x + "</li>" }).join("") + "</ul></div>"
  }).join("")
}

/* Quiz tab: one question per module in scope */
function quizQuestions() {
  return spaceModules().map(function (m) { return sampleModule(S.course, m).quiz })   // [question, options, right option]
}
function quizTab() {
  if (LIVE) return comingSoon("Quizzes");
  var qs = quizQuestions();
  if (S.quizIndex >= qs.length) return '<div class="card" style="text-align:center;padding:24px"><div class="sm">Quiz complete</div>' +
    '<div style="font-size:28px;font-weight:600;margin:4px 0 12px">' + S.quizScore + " / " + qs.length + "</div>" +
    '<button onclick="S.quizIndex=0;S.quizScore=0;S.quizAnswer=null;render()">Try again</button></div>';
  var Q = qs[S.quizIndex], picked = S.quizAnswer;
  return '<p class="sm">Question ' + (S.quizIndex + 1) + " of " + qs.length + '</p><p style="font-weight:600;margin:0 0 12px">' + Q[0] + "</p>" +
    Q[1].map(function (o, i) {
      return '<button class="opt' + (picked === null ? "" : i === Q[2] ? " ok" : i === picked ? " bad" : "") + '" onclick="pickAnswer(' + i + ')">' + o + "</button>"
    }).join("") +
    (picked !== null ? '<div style="display:flex;justify-content:space-between;align-items:center"><span class="sm">' + (picked === Q[2] ? "Correct" : "Not quite. The answer is highlighted.") + "</span>" +
      '<button class="p" onclick="S.quizIndex++;S.quizAnswer=null;render()">' + (S.quizIndex + 1 === qs.length ? "Finish" : "Next") + "</button></div>" : "")
}
function pickAnswer(i) {
  if (S.quizAnswer !== null) return;
  S.quizAnswer = i;
  if (i === quizQuestions()[S.quizIndex][2]) S.quizScore++;
  render()
}

/* Flashcards tab: all cards of the modules in scope; tap to flip */
function flashcards() {
  var cards = [];
  spaceModules().forEach(function (m) { sampleModule(S.course, m).cards.forEach(function (x) { cards.push(x) }) });
  return cards   // [front, back]
}
function flashcardsTab() {
  if (LIVE) return comingSoon("Flashcards");
  var cards = flashcards(), k = cards[S.cardIndex];
  return '<p class="sm" style="text-align:center">Card ' + (S.cardIndex + 1) + " of " + cards.length + "</p>" +
    '<div class="card" onclick="S.cardFlipped=!S.cardFlipped;render()" style="cursor:pointer;min-height:170px;display:grid;place-items:center;text-align:center;padding:22px"><div>' +
    '<div class="sm">' + (S.cardFlipped ? "Answer" : "Question") + '</div><p style="font-size:17px;margin:6px 0 0">' + (S.cardFlipped ? k[1] : k[0]) + "</p></div></div>" +
    '<p class="sm" style="text-align:center">Tap the card to flip</p>' +
    '<div style="display:flex;gap:8px;justify-content:center"><button onclick="nextCard(-1)">Previous</button><button onclick="nextCard(1)">Next</button></div>'
}
function nextCard(step) {
  var n = flashcards().length;
  S.cardIndex = (S.cardIndex + step + n) % n;
  S.cardFlipped = false;
  render()
}

/* ---------- "Leave this quiz?" ---------- */
function quizInProgress() {
  return S.view === "space" && S.spaceTab === "quiz" && (S.quizAnswer !== null || S.quizIndex > 0) && S.quizIndex < spaceModules().length
}
// Run go() now, or, with a quiz half done, first ask whether to leave it (the answers would be lost).
function leaveGuard(go) {
  if (quizInProgress()) { S.confirmLeave = go; render() } else go()
}
function leaveQuizDialog() {
  if (!S.confirmLeave) return "";
  return '<div style="position:absolute;inset:0;background:rgba(10,26,69,.5);display:grid;place-items:center;z-index:30">' +
    '<div class="card" role="dialog" aria-modal="true" aria-label="Leave this quiz?" style="max-width:360px;width:calc(100% - 40px);text-align:center;padding:22px;animation:pop .3s">' +
    '<h3 style="margin:0 0 6px;font-size:18px">Leave this quiz?</h3><p style="color:var(--t2);margin:0 0 16px">You’re on question ' + (S.quizIndex + 1) + " of " + spaceModules().length +
    '. If you leave now, your answers will be lost.</p><div style="display:flex;gap:8px;justify-content:center">' +
    '<button class="p" onclick="S.confirmLeave=null;render()">Keep going</button><button onclick="var go=S.confirmLeave;S.confirmLeave=null;go()">Leave quiz</button></div></div></div>'
}
D.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && S.confirmLeave) { S.confirmLeave = null; render() }
});
