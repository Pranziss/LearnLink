/* LearnLink student app, part 5: a course's modules, the module viewer, and the course space (Ask / Summary / Quiz / Flashcards). */
function scope() {
  return S.sel.length ? S.sel.slice().sort() : [0, 1, 2, 3]
}

function courseV() {
  var c = CO[S.ci];
  return {
    h: '<div class="sc"><h2 style="margin:6px 0 0">' + E(c[0]) + '</h2><p class="sm" style="margin:0 0 14px">' +
      [c[1] || "No instructor assigned yet", c[2]].filter(Boolean).map(E).join(" · ") + '</p>' +
      (c[3].length ? '<p class="sm" style="margin:0 0 8px">Select modules to focus on, or leave none selected to use them all.</p>' :
      '<div class="card"><b>No modules yet</b><p class="sm" style="margin:4px 0 0">Your teacher hasn’t published any modules for this course. Check back later.</p></div>') +
      c[3].map(function (t, i) {
      var o = S.sel.indexOf(i) > -1;
      return '<div class="mod' + (o ? " on" : "") + '" onclick="tg(' + i + ')"><div class="ck">' + (o ? "✓" : "") +
        '</div><div style="flex:1;min-width:0"><b>' + MT(S.ci, i) + '</b></div><button style="font-size:12px;padding:4px 10px" onclick="event.stopPropagation();S.vm=' +
        i + ';render()">Open</button></div>'
    }).join("") + "</div>",
    x: '<div class="fl"><span class="chip n">Applies to ' + (S.sel.length ? S.sel.length + " selected module" +
      (S.sel.length > 1 ? "s" : "") : "all modules") + '</span><div class="bar"><button class="p" onclick="sp(\'ask\')">Ask a question</button><button onclick="sp(\'sum\')">Summary</button><button onclick="sp(\'quiz\')">Quiz</button><button onclick="sp(\'fc\')">Flashcards</button></div></div>'
  }
}

function tg(i) {
  var k = S.sel.indexOf(i);
  k > -1 ? S.sel.splice(k, 1) : S.sel.push(i);
  render()
}

function ov(i) {
  var c = MS[S.mi].c[i];
  S.vw = { c: c[3], m: c[4], h: c[5] };
  render()
}

function sp(s) {
  if (inQ()) {
    S.cf = function () {
      sp0(s)
    };
    render();
    return
  }
  sp0(s)
}

function sp0(s) {
  S.v = "space";
  S.sp = s;
  S.qi = 0;
  S.qs = 0;
  S.qa = null;
  S.fi = 0;
  S.fl = false;
  render()
}

function rm(i) {
  if (inQ()) {
    S.cf = function () {
      rm0(i)
    };
    render();
    return
  }
  rm0(i)
}

function rm0(i) {
  S.sel = S.sel.filter(function (x) {
    return x !== i
  });
  S.qi = 0;
  S.qs = 0;
  S.qa = null;
  S.fi = 0;
  render()
}

// Loading placeholder: grey lines of the given widths ("0" = a paragraph gap). Styles: .skl in student.css.
function skl(ws) {
  return ws.map(function (w) { return w === "0" ? '<div style="height:10px"></div>' : '<i class="skl" style="width:' + w + '"></i>' }).join("")
}
// Real module text (live mode): what LearnLink reads from the module's files, loaded once per module.
var MTX = {};
function viewerLive(ci, m, id) {
  var d = MTX[id];
  if (d === undefined) {
    d = MTX[id] = "loading";
    api("courses?action=module_text&id=" + id).then(function (j) { MTX[id] = j; render() }, function () { MTX[id] = "error"; render() });
  }
  var body = d === "loading" ? '<div role="status" aria-label="Loading the module">' + skl(["40%", "100%", "95%", "88%", "0", "100%", "92%", "70%"]) + "</div>" :
    d === "error" ? '<p class="sm">Couldn’t load this module. Check that you’re on the campus Wi‑Fi.</p><button onclick="delete MTX[' + (+id) + '];render()">Try again</button>' :
    (d.text ? d.text.split(/\n{2,}/).map(function (p) {
      // light markdown: **bold**, "- " bullets, "## headings"
      var t = E(p).replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>").replace(/^[-*]\s+/gm, "• ");
      if (/^#{1,3}\s/.test(t)) return '<h4 style="margin:16px 0 8px">' + t.replace(/^#+\s*/, "") + "</h4>";
      return '<p style="line-height:1.8;margin:0 0 12px">' + t.replace(/\n/g, "<br>") + "</p>"
    }).join("") : '<p class="sm">This module has no readable text yet.</p>') +
    (d.files.some(function (f) { return f.download }) ? '<div style="border-top:1px solid var(--bd);margin-top:16px;padding-top:12px"><b class="sm">Files</b>' +
      d.files.filter(function (f) { return f.download }).map(function (f) {
        return '<div style="margin-top:6px"><a href="/api/db/materials?action=download&id=' + f.id + '">' + E(f.name) + "</a></div>"
      }).join("") + "</div>" : "");
  return '<div class="vw"><div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--bd)"><div><b>' +
    MT(ci, m) + '</b><div class="sm">' + E(CO[ci][0]) + ' · the text LearnLink answers from</div></div><button class="g" aria-label="Close module" onclick="S.vm=null;S.vw=null;render()">✕</button></div>' +
    '<div style="flex:1;overflow-y:auto;padding:24px;display:grid;place-items:start center"><div class="card" style="max-width:720px;width:100%;padding:22px">' + body + "</div></div></div>"
}

function viewer() {
  var V = S.vw || { c: S.ci, m: S.vm, h: [] }, m = V.m, ci = V.c;
  if (LIVE && CO[ci] && CO[ci][4]) return viewerLive(ci, m, CO[ci][4][m]);
  var s = C(ci, m).s;
  return '<div class="vw"><div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--bd)"><div><b>' +
    MT(ci, m) + '</b><div class="sm">' + CO[ci][0] + (V.h.length ? ' · highlighted sentences were used in the answer' : ' · mock preview') +
    '</div></div><button class="g" aria-label="Close module" onclick="S.vm=null;S.vw=null;render()">✕</button></div><div style="flex:1;overflow-y:auto;padding:24px;display:grid;place-items:start center"><div class="card" style="max-width:460px;width:100%;padding:22px"><h3 style="margin:0 0 12px">' +
    CO[ci][3][m] + '</h3><p style="line-height:2;margin:0">' + s.map(function (x, i) {
    return V.h.indexOf(i) > -1 ? "<mark>" + x + "</mark>" : x
  }).join(" ") + "</p></div></div></div>"
}

function spaceV() {
  var c = CO[S.ci], sc = scope(), h = '<div class="sc"><div style="display:flex;align-items:center;gap:8px"><button class="g" aria-label="Back to modules" onclick="lv(function(){S.v=\'course\';render()})">←</button><b>' +
    c[0] + '</b></div><div style="display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:10px 0 12px"><span class="sm">Scope</span>' +
    (S.sel.length ? S.sel.slice().sort().map(function (i) {
    return '<span class="chip">' + MT(S.ci, i) + '<button aria-label="Remove module" onclick="rm(' + i + ')">✕</button></span>'
  }).join("") : '<span class="chip n">All modules in ' + c[0] + "</span>") + '</div><div class="seg">' +
    [["ask", "Ask"], ["sum", "Summary"], ["quiz", "Quiz"], ["fc", "Flashcards"]].map(function (a) {
    return '<button class="' + (S.sp === a[0] ? "on" : "") + '" onclick="sp(\'' + a[0] + "')\">" + a[1] +
      "</button>"
  }).join("") + "</div>";
  if (S.sp === "ask") {
    h += S.ch.map(function (m) {
      return '<div style="display:flex;justify-content:flex-end;margin:8px 0"><div style="background:var(--s1);border-radius:16px;padding:8px 14px">' +
        E(m.u) + '</div></div><div style="display:flex;gap:10px;margin:10px 0 14px">' + bot(34) + '<div style="flex:1;min-width:0">' + (m.err ? '<span class="chip w">Couldn’t answer</span>' : '<span class="chip">From your modules</span>') + '<p style="line-height:1.7">' +
        m.a + '</p><div style="display:flex;gap:6px;flex-wrap:wrap">' + m.s.map(function (i) {
        return '<span class="chip n">' + MT(S.ci, i) + "</span>"
      }).join("") + "</div></div></div>"
    }).join("");
    if (S.tp) h += typH(S.tp);
    if (!S.ch.length && !S.tp) h += '<div class="card" style="text-align:center;padding:22px"><b>Ask about ' +
      (S.sel.length ? "the selected module" + (S.sel.length > 1 ? "s" : "") : "this course") + '</b><p class="sm">Answers come only from the modules in scope.</p><div class="fu" style="justify-content:center">' +
      ["Summarize this", "What are the key terms?", "Quiz me with 3 questions"].map(function (t) {
        return '<button class="sug" onclick="sa(this.textContent)">' + t + "</button>"
      }).join("") + "</div></div>";
    h += '<div style="display:flex;gap:8px;margin-top:14px"><input id="ai" placeholder="Ask a question…" style="flex:1" onkeydown="if(event.key===\'Enter\')sa()"><button class="p" onclick="sa()">Ask</button></div>'
  } else if (LIVE) h += '<div class="card" style="text-align:center;padding:24px"><span class="chip n">Coming soon</span><p style="margin:10px 0 0;line-height:1.6">' +
    ({ sum: "Summaries", quiz: "Quizzes", fc: "Flashcards" })[S.sp] + ' made from your modules are on the way. For now, use <b>Ask</b>, for example “Summarize this module” or “Quiz me on this”.</p></div>';
  else if (S.sp === "sum") h += sc.map(function (m) {
    return '<div class="card" style="margin-bottom:10px"><b>' + MT(S.ci, m) + '</b><ul style="padding-left:18px;line-height:1.7;margin:6px 0 0">' +
      C(S.ci, m).s.map(function (x) {
      return "<li>" + x + "</li>"
    }).join("") + "</ul></div>"
  }).join("");
  else if (S.sp === "quiz") {
    var q = sc.map(function (m) {
      return C(S.ci, m).q
    });
    if (S.qi >= q.length) h += '<div class="card" style="text-align:center;padding:24px"><div class="sm">Quiz complete</div><div style="font-size:28px;font-weight:600;margin:4px 0 12px">' +
      S.qs + " / " + q.length + '</div><button onclick="S.qi=0;S.qs=0;S.qa=null;render()">Try again</button></div>';
    else {
      var Q = q[S.qi];
      h += '<p class="sm">Question ' + (S.qi + 1) + " of " + q.length + '</p><p style="font-weight:600;margin:0 0 12px">' +
        Q[0] + "</p>" + Q[1].map(function (o, i) {
        return '<button class="opt' + (S.qa === null ? "" : i === Q[2] ? " ok" : i === S.qa ? " bad" : "") + '" onclick="pk(' +
          i + ')">' + o + "</button>"
      }).join("") + (S.qa !== null ? '<div style="display:flex;justify-content:space-between;align-items:center"><span class="sm">' +
        (S.qa === Q[2] ? "Correct" : "Not quite. The answer is highlighted.") + '</span><button class="p" onclick="S.qi++;S.qa=null;render()">' +
        (S.qi + 1 === q.length ? "Finish" : "Next") + "</button></div>" : "")
    }
  } else {
    var f = [];
    sc.forEach(function (m) {
      C(S.ci, m).f.forEach(function (x) {
        f.push(x)
      })
    });
    var k = f[S.fi];
    h += '<p class="sm" style="text-align:center">Card ' + (S.fi + 1) + " of " + f.length + '</p><div class="card" onclick="S.fl=!S.fl;render()" style="cursor:pointer;min-height:170px;display:grid;place-items:center;text-align:center;padding:22px"><div><div class="sm">' +
      (S.fl ? "Answer" : "Question") + '</div><p style="font-size:17px;margin:6px 0 0">' + (S.fl ? k[1] : k[0]) +
      '</p></div></div><p class="sm" style="text-align:center">Tap the card to flip</p><div style="display:flex;gap:8px;justify-content:center"><button onclick="fs(-1)">Previous</button><button onclick="fs(1)">Next</button></div>'
  }
  return { h: h + "</div>" }
}

function sa(t) {
  var e = $("ai"), v = (t || (e && e.value) || "").trim();
  if (!v) return;
  var m = scope()[0], s = C(S.ci, m).s;
  S.ch.push({ u: v, a: s[0] + " " + s[1], s: scope().slice(0, 2) });
  render()
}

function pk(i) {
  if (S.qa !== null) return;
  S.qa = i;
  var q = scope().map(function (m) {
    return C(S.ci, m).q
  });
  if (i === q[S.qi][2]) S.qs++;
  render()
}

function fs(d) {
  var n = 0;
  scope().forEach(function (m) {
    n += C(S.ci, m).f.length
  });
  S.fi = (S.fi + d + n) % n;
  S.fl = false;
  render()
}

function inQ() {
  return S.v === "space" && S.sp === "quiz" && (S.qa !== null || S.qi > 0) && S.qi < scope().length
}

function lv(fn) {
  if (inQ()) {
    S.cf = fn;
    render()
  } else fn()
}

function cfmH() {
  if (!S.cf) return "";
  return '<div style="position:absolute;inset:0;background:rgba(10,26,69,.5);display:grid;place-items:center;z-index:30"><div class="card" role="dialog" aria-modal="true" aria-label="Leave this quiz?" style="max-width:360px;width:calc(100% - 40px);text-align:center;padding:22px;animation:pop .3s"><h3 style="margin:0 0 6px;font-size:18px">Leave this quiz?</h3><p style="color:var(--t2);margin:0 0 16px">You’re on question ' +
    (S.qi + 1) + " of " + scope().length + '. If you leave now, your answers will be lost.</p><div style="display:flex;gap:8px;justify-content:center"><button class="p" onclick="S.cf=null;render()">Keep going</button><button onclick="var f=S.cf;S.cf=null;f()">Leave quiz</button></div></div></div>'
}
D.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && S.cf) {
    S.cf = null;
    render()
  }
});

var _sa = sa;
sa = function (t) {
  var e = $("ai"), v = (t || (e && e.value) || "").trim();
  if (!v || BZ) return;
  BZ = 1;
  if (e) e.value = "";
  S.tp = { u: v, t: "Finding modules…" };
  render();
  setTimeout(function () {
    if (S.tp) {
      S.tp.t = "Writing the answer…";
      render()
    }
  }, 800);
  // Live: always the real AI. If it fails, say so; never fall back to a sample answer.
  if (LIVE) {
    var t0 = Date.now(), sc = scope();
    llm(v, CO[S.ci][0]).then(function (x) {
      setTimeout(function () {
        S.tp = null;
        BZ = 0;
        S.ch.push({ u: v, a: E(x).replace(/\n/g, "<br>").replace(/\[(\d)\]/g, '<span class="ct">$1</span>'), s: [] });
        render()
      }, Math.max(0, 1500 - (Date.now() - t0)))
    }, function () {
      S.tp = null;
      BZ = 0;
      S.ch.push({ u: v, a: "LearnLink couldn’t write an answer right now. Check your connection, then try again.", s: [], err: 1 });
      render()
    })
  } else setTimeout(function () {
    S.tp = null;
    BZ = 0;
    _sa(v)
  }, 1600)
};
