/* LearnLink student app, part 4: talking to the AI through the login page (streamed answers, sources). */
var CFG = Object.assign({ web: false, gen: true, lv: 3 }, window.LLCFG || (window.parent !== window &&
  window.parent.LLCFG) || {});

function webAns(t) {
  if (/world cup/i.test(t)) return {
    a: [
      ["Argentina won the 2022 FIFA World Cup in Qatar.", "1"],
      ["They beat France in the final, which ended 3-3 after extra time and went to penalties.", "12"]
    ],
    l: [
      ["2022 World Cup final recap", "fifa.com", "Argentina and France drew 3-3 before the penalty shootout."],
      ["FIFA World Cup 2022", "britannica.com", "Argentina’s third title, and its first since 1986."]
    ]
  };
  return {
    a: [
      ["Here is a summary of what the web says about this topic. This demo uses sample text.", "1"],
      ["Check the linked sources before using it in coursework.", "2"]
    ],
    l: [
      ["Overview of the topic", "wikipedia.org", "Sample excerpt from a web page."],
      ["Further reading", "britannica.com", "Sample excerpt from a second page."]
    ]
  }
}

function webH(t) {
  var w = webAns(t), mi = MS.push({ t: "Web results", w: 1, c: w.l }) - 1;
  S.mi = mi;
  S.pn = true;
  S.hn = 0;
  return '<span class="chip" style="background:var(--pk);color:var(--ac)">From the web (sample)</span><p style="margin:10px 0 8px;line-height:1.8">' +
    w.a.map(function (x) {
    return E(x[0]) + " " + x[1].split("").map(function (n) {
      return '<button class="ct" onclick="S.mi=' + mi + ";S.hn=" + n + ';S.pn=true;render()">' + n + "</button>"
    }).join("")
  }).join(" ") + '</p><div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">' + w.l.map(function (x) {
    return '<span class="chip n" style="font-weight:600">' + x[1] + "</span>"
  }).join("") + '</div><p class="sm" style="margin:0">Your modules didn’t cover this. Verify before using it in coursework.</p>'
}

function blockedH() {
  return '<span class="chip w">Not covered by your modules</span><p style="margin:10px 0 0;line-height:1.7">Your school has turned off answers outside the course modules. Try rewording your question with a course topic.</p>'
}
var LQ = {}, LI = 0;

function llm(q, ctx) {
  return new Promise(function (res, rej) {
    var id = ++ LI;
    LQ[id] = [res, rej];
    parent.postMessage({ llm: { id: id, q: q, ctx: ctx } }, "*");
    setTimeout(function () {
      if (LQ[id]) {
        delete LQ[id];
        rej("timeout")
      }
    }, 60000)
  })
}

window.addEventListener("message", function (e) {
  var m = e.data && e.data.llmr;
  if (!m || !LQ[m.id]) return;
  var p = LQ[m.id];
  delete LQ[m.id];
  if (m.err) p[1](m.err);
  else p[0](p.x ? m.data : m.text)
});

function ctxOf(tp) {
  return tp.m.map(function (m, i) {
    return { n: i + 1, t: MT(tp.c, m), x: C(tp.c, m).s.join(" ") }
  })
}

function aiMH(x, mi, tp) {
  var ps = String(x || "").trim().split(/\n{2,}/).map(function (p) {
    return '<p style="margin:0 0 8px;line-height:1.8">' + E(p).replace(/\n/g, "<br>").replace(/\[(\d)\]/g,
      function (a, n) {
      return +n >= 1 && +n <= tp.m.length ? '<button class="ct" onclick="S.mi=' + mi + ";S.hn=" + n + ';S.pn=true;render()">' +
        n + "</button>" : ""
    }) + "</p>"
  }).join("");
  return '<span class="chip">From your modules + AI · ' + CO[tp.c][0] + " · " + CO[tp.c][2] + '</span><div style="margin:10px 0 6px">' +
    ps + '</div><p class="sm" style="margin:0 0 8px">Numbered parts come from your modules. The rest is the AI’s own explanation.</p><button style="font-size:12px;padding:4px 10px" onclick="S.mi=' +
    mi + ';S.pn=true;S.hn=0;render()">' + tp.m.length + " sources</button>"
}

function aiH(x) {
  var src = ((x && x.src) || []).filter(function (s) {
    return /^https?:\/\//i.test(s.url)
  }), t = (x && x.text !== undefined) ? x.text : x, ps = String(t || "").trim().split(/\n{2,}/).map(function (p) {
    return '<p style="margin:0 0 8px;line-height:1.7">' + E(p).replace(/\n/g, "<br>") + "</p>"
  }).join(""), ln = src.map(function (s) {
    var d = s.url;
    try {
      d = new URL(s.url).hostname.replace(/^www\./, "")
    } catch (e) {}
    return '<a class="chip n" style="font-weight:600;text-decoration:none" href="' + E(s.url).replace(/"/g,
      "%22") + '" target="_blank" rel="noopener noreferrer">' + E(d) + "</a>"
  }).join(" ");
  return '<span class="chip n">' + (src.length ? "From the web + AI" : "General answer · AI, not from your modules") +
    '</span><div style="margin:10px 0 4px">' + ps + "</div>" + (ln ? '<div style="display:flex;flex-wrap:wrap;gap:6px;margin:6px 0">' +
    ln + "</div>" : "") + '<p class="sm" style="margin:0">' + (src.length ? "Links come from a web search. Check them before relying on the answer." : "Your modules didn’t cover this. The AI can’t browse the web, so verify important facts.") +
    "</p>"
}

/* ===== LearnLink chat: remembers the conversation, streams the answer as it is written ===== */
var SQ = {};
window.addEventListener("message", function (e) {
  var m = e.data && e.data.llmr;
  if (!m || !SQ[m.id]) return;
  if (m.ev) SQ[m.id](m.ev);
  else if (m.err) SQ[m.id]({ type: "error", error: m.err })
});

function llmx(q, scope) {
  return new Promise(function (res, rej) {
    var id = ++ LI;
    LQ[id] = [res, rej];
    LQ[id].x = 1;
    parent.postMessage({ llm: { id: id, q: q, scope: scope || null } }, "*");
    setTimeout(function () {
      if (LQ[id]) {
        delete LQ[id];
        rej("timeout")
      }
    }, 180000)
  })
}

function streamAsk(q, history, on) {
  var id = ++ LI;
  SQ[id] = on;
  parent.postMessage({ llms: { id: id, q: q, scope: null, history: history } }, "*");
  return id
}(function () {
  var st = document.createElement("style");
  st.textContent = ".caret{display:inline-block;width:7px;height:1.05em;background:var(--ac);margin-left:2px;vertical-align:-3px;border-radius:2px;animation:cblink 1s steps(2) infinite}@keyframes cblink{50%{opacity:0}}@media (prefers-reduced-motion:reduce){.caret{animation:none}}";
  document.head.appendChild(st)
})();
// What the server gets as memory: the last few turns, as plain text.
function hist() {
  var h = [];
  CH.forEach(function (m) {
    if (m.u !== undefined) h.push({ role: "user", content: m.u });
    else if (m.t) h.push({ role: "assistant", content: m.t })
  });
  return h.slice(-8)
}
// Turn the model's text into safe HTML. [1] becomes a button that opens that source. **bold** and *italics* marks are
// dropped (the server does the same to the finished answer; this covers the words still streaming in).
function pbody(text, mi, caret) {
  text = String(text).replace(/\]\s+(?=[.,;:!?])/g, "]").replace(/\*\*([^*\n]+)\*\*/g, "$1").replace(/(^|[^\w*])\*([^*\s](?:[^*\n]*[^*\s])?)\*(?![\w*])/g, "$1$2");
  return E(text).replace(/\n+/g, "<br>").replace(/\[(\d+)\]/g, function (a, n) {
    return mi >= 0 ? '<button class="ct" onclick="S.mi=' + mi + ";S.hn=" + n + ';S.pn=true;render()">' + n +
      "</button>" : ""
  }) + (caret ? '<span class="caret"></span>' : "")
}

function finalH(M, text, mi) {
  var cited = /\[\d+\]/.test(text), nf = /couldn.t find that in your course modules/i.test(text);
  if (M.mode === "none") return '<span class="chip w">Not in your modules</span><p style="margin:10px 0 0;line-height:1.7">I couldn’t find this in your course modules. Try rewording the question with a topic from your course, or ask your instructor to add it.</p>';
  if (M.mode === "grounded" && nf && !cited) return '<span class="chip w">Not in your modules</span><p style="margin:10px 0 0;line-height:1.7">' +
    pbody(text, -1) + "</p>";
  if (M.mode === "general") return '<span class="chip n">General answer · AI, not from your modules</span><p style="margin:10px 0 4px;line-height:1.7">' +
    pbody(text, -1) + '</p><p class="sm" style="margin:0">Your modules didn’t cover this. Verify before using it in coursework.</p>';
  if (M.mode === "chat") return '<p style="margin:0;line-height:1.7">' + pbody(text, -1) + "</p>";
  return '<span class="chip">From your modules · ' + E(M.sources[0].course) + '</span><p style="margin:10px 0;line-height:1.8">' +
    pbody(text, mi) + '</p><p class="sm" style="margin:0 0 8px">Numbered parts come from your modules. Any “Think of it this way” line is the AI’s own example.</p><button style="font-size:12px;padding:4px 10px" onclick="S.mi=' +
    mi + ';S.pn=true;S.hn=0;render()">' + M.sources.length + " source" + (M.sources.length > 1 ? "s" : "") +
    "</button>"
}
var _askBase = ask, RETRY = [];   // RETRY: questions behind "Ask again" buttons (kept out of the HTML)
ask = function () {
  var e = $("qi");
  if (!e || BZ || !e.value.trim()) return;
  var q = e.value.trim();
  if (window.parent === window) return _askBase();
  // standalone preview without a server
  e.value = "";
  if (S.v === "home") {
    S.v = "chat";
    H.unshift(q.slice(0, 40))
  }
  var history = hist();
  CH.push({ u: q });
  var ty = { typ: 1, h: dots3("Thinking…") };
  CH.push(ty);
  BZ = 1;
  render();
  var M = null, text = "", mi = -1, live = false, finished = false, reqId = 0;
  var guard = setTimeout(function () {
    if (!M) fail("no_server")
  }, 25000);
  // Stop: cancel the request (the server stops generating) and keep whatever was written so far.
  STOP = function () {
    if (finished) return;
    finished = true;
    clearTimeout(guard);
    if (reqId) parent.postMessage({ llmstop: reqId }, "*");
    var i = slot();
    if (i > -1) CH[i] = text.trim() && M ? { h: finalH(M, text, mi) + '<p class="sm" style="margin:6px 0 0">Stopped.</p>', t: text }
      : { h: '<p class="sm" style="margin:0">Stopped.</p>' };
    BZ = 0;
    STOP = null;
    render()
  };
  // the server answers with its first event within seconds
  function slot() {
    return CH.indexOf(ty)
  }
  function fail(code) {
    if (finished) return;
    finished = true;
    clearTimeout(guard);
    var i = slot();
    // Plain words for students. What to fix on the server is in the README and the server's own log.
    var why = code === "no_server" ? ["Can’t reach LearnLink", "LearnLink didn’t answer. Check that you’re on the campus Wi‑Fi, then ask again."] :
      code === "model_unreachable" || code === "timeout" ? ["The AI is busy or offline", "Your question was not answered. Try again in a minute. If it keeps happening, tell your teacher."] :
      code === "too_many_requests" ? ["Slow down a little", "You’re asking very quickly. Wait a few seconds, then ask again."] :
      code === "not_logged_in" ? ["You were logged out", "Log in again to keep asking. Your saved chats are still there."] :
      ["Something went wrong", "Your question was not answered. Try asking again."];
    if (i > -1) CH[i] = {
      h: '<span class="chip w">' + why[0] + '</span><p style="margin:10px 0 0;line-height:1.7">' + why[1] + "</p>" +
        (code === "not_logged_in" ? '<button class="p" style="margin-top:8px" onclick="parent.postMessage(\'logout\',\'*\')">Log in again</button>' :
          '<button style="margin-top:8px" onclick="$(\'qi\').value=RETRY[' + (RETRY.push(q) - 1) + '];ask()">Ask again</button>')
    };
    BZ = 0;
    STOP = null;
    render()
  }
  reqId = streamAsk(q, history, function (ev) {
    if (finished) return;
    if (ev.type === "queue") {
      // Others are being answered first (the server answers one at a time). 0 = it's our turn now.
      if (!live) {
        ty.h = dots3(ev.ahead > 0 ? (ev.ahead === 1 ? "1 question ahead of yours…" : ev.ahead + " questions ahead of yours…") : "Writing the answer…");
        render()
      }
    } else if (ev.type === "meta") {
      clearTimeout(guard);
      M = ev;
      if (M.mode === "grounded") mi = MS.push({
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
      ty.h = dots3(M.mode === "none" ? "" : "Writing the answer…");
      render()
    } else if (ev.type === "token") {
      text += ev.t;
      if (!live) {
        live = true;
        ty.typ = 0;
        ty.live = 1;
        ty.h = pbody(text, mi, true);
        render()
      } else {
        var el = $("live");
        if (el) {
          el.innerHTML = pbody(text, mi, true);
          var ms = $("msgs");
          if (ms) ms.scrollTop = ms.scrollHeight
        }
      }
    } else if (ev.type === "done") {
      finished = true;
      clearTimeout(guard);
      text = ev.text || text;
      var i = slot();
      if (i > -1) {
        CH[i] = { h: finalH(M, text, mi), t: M.mode === "none" ? "" : text, md: M.mode };
        saveTurn(q, text, M, ev.timings, CH[i]);
        if (M.mode === "grounded" && /\[\d+\]/.test(text)) {
          S.mi = mi;
          S.pn = innerWidth > 760;   // on a phone the panel would cover the answer: the Sources tab and [1] open it
          S.hn = 0
        }
      }
      BZ = 0;
      STOP = null;
      render()
    } else if (ev.type === "error") fail(ev.error)
  });
};
