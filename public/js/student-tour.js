/* LearnLink student app, part 9: the first-login tour. Three short cards over the home screen, shown once per device
   (saved in this browser) after the account and courses have loaded. Skip or Esc closes it. */
var TOUR = [
  ["Ask anything about your lessons",
    "Type a question in English, Filipino or Taglish. LearnLink answers from your teachers’ modules first, and labels anything else."],
  ["See where each answer comes from",
    'Numbers like <span class="ct" style="cursor:default">1</span> show the module an answer came from. Tap one, or tap <b>Sources</b>, to read that part yourself.'],
  ["Your courses and chats",
    "The menu (☰ on a phone) has your courses, your past chats and Settings. Inside a course you can pick which modules to ask about."]
];

function tourStart() {
  try { if (localStorage.getItem("ll_tour_v1")) return } catch (e) { return }
  if (S.scr !== "app") return;
  S.tour = 0;
  render();
  var b = $("tourNext");
  if (b) b.focus()
}

function tourEnd() {
  try { localStorage.setItem("ll_tour_v1", "1") } catch (e) {}
  S.tour = null;
  render();
  var q = $("qi");
  if (q) q.focus()
}

function tourNext() {
  if (S.tour + 1 >= TOUR.length) return tourEnd();
  S.tour++;
  render();
  var b = $("tourNext");
  if (b) b.focus()
}

// Drawn by app() (student-chat.js), on top of everything else.
function tourH() {
  if (S.tour == null || !TOUR[S.tour]) return "";
  var t = TOUR[S.tour], last = S.tour === TOUR.length - 1;
  return '<div class="tour" onclick="event.stopPropagation()"><div class="card" role="dialog" aria-modal="true" aria-labelledby="tourT">' +
    '<div style="display:flex;justify-content:center;margin-bottom:8px">' + bot(56) + "</div>" +
    '<div class="tour-dots" aria-label="Step ' + (S.tour + 1) + " of " + TOUR.length + '">' + TOUR.map(function (x, i) {
      return '<span class="' + (i === S.tour ? "on" : "") + '"></span>'
    }).join("") + "</div>" +
    '<h3 id="tourT">' + t[0] + "</h3><p>" + t[1] + "</p>" +
    '<div style="display:flex;gap:8px;justify-content:center">' +
    (last ? "" : '<button class="g" onclick="tourEnd()">Skip</button>') +
    '<button class="p" id="tourNext" onclick="tourNext()">' + (last ? "Start studying" : "Next") + "</button></div></div></div>"
}

D.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && S.tour != null) tourEnd()
});
