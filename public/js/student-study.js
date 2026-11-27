/* =====================================================================================================================
   LearnLink student app: Summary, Quiz and Flashcards data
   ---------------------------------------------------------------------------------------------------------------------
   Live, the server makes them from each module's text with the local AI (study.js) and keeps them, so they are
   usually ready at once; a module nobody opened yet takes about 5 seconds. Asked for with
     POST /api/study { kind: "summary" | "quiz" | "cards", course: course id, modules: [module numbers] }
   which answers one line of JSON per module as it is ready: { type: "module", num, title, items } or { ..., error }.
   In ?demo the same shapes come from the sample content (student-demo.js), so the screens are the same.
   The screens themselves are in student-courses.js (summaryTab, quizTab, flashcardsTab).
   Shapes of "items":
     summary  { points: [sentence], terms: [{ term, meaning }] }
     quiz     { questions: [{ question, options: [4], answer: index of the right option, why }] }
     cards    { cards: [{ front, back }] }
   ===================================================================================================================== */

// "kind|course id|module number" -> { state: "loading" | "ready" | "error", items, error }
var STUDY = {};
function studyKey(kind, c, m) { return kind + "|" + COURSES[c].id + "|" + COURSES[c].modules[m].num }

// What is known for the modules in scope:
//   { modules: [{ module, state, items, error }] in module order, loading: how many are on their way, ready, failed }
// Live, modules not asked for yet are requested (once). Pass load = false to only look.
function studyFor(kind, load) {
  var c = S.course, missing = [];
  var modules = spaceModules().map(function (m) {
    if (!LIVE) return { module: m, state: "ready", items: sampleStudy(kind, c, m) };
    var e = STUDY[studyKey(kind, c, m)];
    if (!e) { missing.push(m); e = { state: "loading" } }
    return { module: m, state: e.state, items: e.items, error: e.error }
  });
  if (missing.length && load !== false) requestStudy(kind, c, missing);
  return {
    modules: modules,
    loading: modules.filter(function (x) { return x.state === "loading" }).length,
    ready: modules.filter(function (x) { return x.state === "ready" }),
    failed: modules.filter(function (x) { return x.state === "error" })
  }
}

function requestStudy(kind, c, mods) {
  var course = COURSES[c];
  mods.forEach(function (m) { STUDY[studyKey(kind, c, m)] = { state: "loading" } });
  function settle(m, entry) {
    var key = studyKey(kind, c, m);
    if (STUDY[key] && STUDY[key].state === "loading") STUDY[key] = entry
  }
  fetch("/api/study", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: kind, course: course.id, modules: mods.map(function (m) { return course.modules[m].num }) })
  }).then(function (r) {
    if (!r.ok || !r.body) return r.json().catch(function () { return {} }).then(function (j) { throw j.error || "no_server" });
    // read the reply line by line, showing each module as soon as it arrives
    var reader = r.body.getReader(), dec = new TextDecoder(), buf = "";
    function next() {
      return reader.read().then(function (x) {
        if (x.done) return;
        buf += dec.decode(x.value, { stream: true });
        var lines = buf.split("\n");
        buf = lines.pop();
        lines.forEach(function (l) {
          var ev;
          try { ev = JSON.parse(l) } catch (e) { return }
          if (ev.type !== "module") return;
          var m = -1;
          course.modules.forEach(function (mod, i) { if (mod.num === ev.num) m = i });
          if (m > -1) settle(m, ev.error ? { state: "error", error: ev.error } : { state: "ready", items: ev.items })
        });
        render();
        return next()
      })
    }
    return next()
  }).catch(function (code) {
    mods.forEach(function (m) { settle(m, { state: "error", error: typeof code === "string" ? code : "no_server" }) })
  }).then(function () {
    // anything the server didn't mention counts as failed, so the screen never waits forever
    mods.forEach(function (m) { settle(m, { state: "error", error: "no_server" }) });
    render()
  })
}

// "Try again" after a failure: forget the failed ones, so the next draw asks for them again.
function retryStudy(kind) {
  spaceModules().forEach(function (m) {
    var key = studyKey(kind, S.course, m);
    if (STUDY[key] && STUDY[key].state === "error") delete STUDY[key]
  });
  render()
}

// Plain words for what went wrong.
var STUDY_ERRORS = {
  not_logged_in: "You were logged out. Log in again to continue.",
  model_unreachable: "The AI is busy or offline. Try again in a minute.",
  too_many_requests: "That was a lot of requests at once. Wait a few seconds, then try again.",
  empty_module: "This module has no readable text yet, so there is nothing to make it from.",
  no_module: "This module isn’t available anymore. Your teacher may have hidden it.",
  study_failed: "The AI couldn’t make a good one this time. Try again."
};
function studyError(code) { return STUDY_ERRORS[code] || "Couldn’t reach LearnLink. Check that you’re on the campus Wi‑Fi, then try again." }

// The demo's sample content in the same shapes as the server's.
function sampleStudy(kind, c, m) {
  var s = sampleModule(c, m);
  if (kind === "summary") return { points: s.summary, terms: [] };
  if (kind === "quiz") return { questions: [{ question: s.quiz[0], options: s.quiz[1], answer: s.quiz[2], why: "" }] };
  return { cards: s.cards.map(function (x) { return { front: x[0], back: x[1] } }) }
}
