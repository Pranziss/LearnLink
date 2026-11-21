/* LearnLink student app, part 3: sidebar, home screen and the chat view. */
/* app */
function app() {
  var side = S.sb ? '<aside id="sb"><button class="p" onclick="newChat()" style="margin-bottom:10px">+ New chat</button><button class="it" onclick="S.srch=!S.srch;render()">Search chats</button>' +
    (S.srch ? '<input placeholder="Search your chats" value="' + E(S.sq) + '" style="width:100%;margin:2px 0 6px" oninput="S.sq=this.value;rec()"><div id="rec">' +
    recs() + "</div>" : "") + '<button class="it" onclick="S.cg=!S.cg;render()">Courses enrolled ' + (S.cg ? "▾" : "▸") +
    "</button>" + (S.cg ? '<div class="sub">' + (CO.length ? CO.map(function (c, i) {
    return '<button class="it' + (S.v !== "home" && S.v !== "chat" && S.v !== "set" && S.ci === i ? " on" : "") +
      '" onclick="openC(' + i + ')">' + E(c[0]) + "</button>"
  }).join("") : '<p class="sm" style="margin:4px 14px 8px">No courses yet. Courses appear here once your teacher sets them up.</p>') + "</div>" : "") + '<div style="margin-top:auto;border-top:1px solid var(--bd);padding-top:8px"><button class="it' +
    (S.v === "set" ? " on" : "") + '" onclick="lv(function(){S.v=\'set\';mob();render()})">Settings</button></div></aside>' : "";
  var tb = '<div class="top"><div style="display:flex;align-items:center;gap:8px"><button class="g" aria-label="Menu" onclick="S.sb ? sbClose() : (S.sb = true, render())" style="font-size:18px">☰</button>' +
    bot(26) + '<b>LearnLink</b></div></div>';
  var dd = S.pm ? '<div class="dd"><div style="cursor:default"><b>' + E(name()) + '</b><br><span class="sm">' +
    E(R.prg || "BS Information Technology") + " · " + E(R.yr || "3rd year") + " · Sec " + E(R.sec || "C") +
    '</span></div><div onclick="lv(function(){S.v=\'set\';S.pm=false;render()})">My profile and privacy</div><div style="color:var(--er)" onclick="S.pm=false;lv(function(){parent.postMessage(\'logout\',\'*\')})">Log out</div></div>' : "";
  var body = S.v === "home" || S.v === "chat" ? chatV() : S.v === "set" ? setV() : S.v === "course" ? courseV() : spaceV();
  return '<div id="app" onclick="if(S.pm||S.nm){S.pm=false;S.nm=false;render()}">' + side + "<main>" + tb +
    netB() + body.h + (body.x || "") + "</main>" + (S.vw || (S.v === "course" && S.vm !== null) ? viewer() : "") +
    dd + netP() + cfmH() + tourH() + "</div>"
}

function mob() {
  if (innerWidth <= 760) S.sb = false
}

function recs() {
  var q = S.sq.toLowerCase(), a = H.filter(function (h) {
    return h.toLowerCase().indexOf(q) > -1
  });
  return a.length ? a.map(function (h) {
    return '<div class="it sm" style="padding:6px 10px">' + E(h) + "</div>"
  }).join("") : '<p class="sm" style="padding:4px 10px">No chats yet</p>'
}

function rec() {
  $("rec").innerHTML = recs()
}

function newChat() {
  if (inQ()) {
    S.cf = newChat0;
    render();
    return
  }
  newChat0()
}

function newChat0() {
  clr();
  chatId = null;
  S.v = "home";
  CH = [];
  MS = [];
  last = null;
  S.pn = false;
  S.mi = -1;
  mob();
  render()
}

function openC(i) {
  if (inQ()) {
    S.cf = function () {
      openC0(i)
    };
    render();
    return
  }
  openC0(i)
}

function openC0(i) {
  S.v = "course";
  S.ci = i;
  S.sel = [];
  S.vm = null;
  mob();
  render()
}
// Home suggestions (live): one module from each of three different courses, phrased three ways. They change once a
// day, not on every screen update. Generic titles ("Course Overview", "Case Studies") are skipped. Demo: fixed examples.
function sugg() {
  if (!LIVE) return ["What is the CIA triad?", "Ethics vs morality", "Flexbox vs grid"];
  var day = Math.floor(Date.now() / 864e5), ways = ["Explain ", "Quiz me on ", "Key terms in "];
  var cs = CO.map(function (c) {
    return c[3].filter(function (t) { return !/^(course overview|overview|introduction|applications|case studies|review|summary)$/i.test(t.trim()) })
  }).filter(function (ts) { return ts.length });
  var out = [];
  for (var i = 0; i < cs.length && out.length < 3; i++) {
    var ts = cs[(day + i) % cs.length], t = ts[(day + i) % ts.length];
    t = t.replace(/^(introduction to|intro to|(what|who) (is|are))\s+/i, "").replace(/\?$/, "");
    out.push(ways[out.length] + t)
  }
  return out
}
// Follow-ups under the latest answer: one tap asks again about the same topic (the server knows what "this" means
// from the chat so far). Only after module or general answers, not after small talk or errors.
var FOLLOW = ["Give me an example", "Explain it more simply", "Quiz me on this", "Ipaliwanag sa Filipino"];
function followH(m, i) {
  if (!LIVE || BZ || i !== CH.length - 1 || !m.t || (m.md !== "grounded" && m.md !== "general")) return "";
  return '<div class="fu" role="group" aria-label="Ask a follow-up">' + FOLLOW.map(function (t) {
    return '<button class="sug" onclick="$(\'qi\').value=this.textContent;ask()">' + t + "</button>"
  }).join("") + "</div>"
}
/* chat */
function chatV() {
  var h = "", x = "";
  if (S.v === "home") {
    h = '<div class="sc" style="display:grid;place-items:center;padding-bottom:40px"><div style="width:100%;max-width:540px"><div style="display:flex;justify-content:center;margin-bottom:10px">' +
      bot(84) + '</div><h2 style="text-align:center;font-size:26px;margin:0 0 6px;letter-spacing:-.01em">What do you want to study today?</h2><p style="text-align:center;color:var(--t2);margin:0 0 18px">Your teachers’ modules come first, with sources. Anything else gets a clearly labeled general answer.</p>' +
      box("qi", "Ask anything…") + '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px">' +
      sugg().map(function (t) {
      return '<button class="sug" onclick="$(\'qi\').value=this.textContent;$(\'qi\').focus()">' +
        E(t) + "</button>"
    }).join("") + "</div></div></div>"
  } else {
    h = '<div class="sc" id="msgs" style="padding-right:' + (S.pn ? "292px" : "22px") + '">' + CH.map(function (m, i) {
      return m.u !== undefined ? '<div style="display:flex;justify-content:flex-end;margin:10px 0"><div style="background:var(--s1);border-radius:16px;padding:8px 14px;max-width:80%">' +
        E(m.u) + "</div></div>" : '<div style="display:flex;gap:10px;align-items:flex-start;margin:12px 0">' +
        bot(34) + '<div' + (m.live ? ' id="live"' : '') + ' style="flex:1;min-width:0">' + m.h + fbH(m) + followH(m, i) + "</div></div>"
    }).join("") + '</div><div style="padding:0 22px 16px">' + box("qi", "Ask a follow-up…") + "</div>";
    var mm = MS[S.mi];
    if (S.pn && mm) x = '<div id="pn"><div style="display:flex;justify-content:space-between;align-items:center;padding:14px;border-bottom:1px solid var(--bd)"><div><b>Sources</b><div class="sm">' +
      E(mm.t) + '</div></div><button class="g" aria-label="Close sources" onclick="pnClose()">✕</button></div><div style="flex:1;overflow-y:auto;padding:12px">' +
      mm.c.map(function (c, i) {
      return '<div class="src' + (S.hn === i + 1 ? " hl" : "") + '"><b>' + (i + 1) + ". " + E(c[0]) + '</b><div class="sm">' +
        c[1] + '</div><p class="sm" style="border-left:2px solid var(--bd2);padding-left:8px;margin:8px 0">' +
        E(c[2]) + '</p>' + (mm.r ? "" : '<button style="width:100%;font-size:12px" onclick="' + (mm.w ? "alert(\'Demo: this would open the website.\')" : "ov(" +
        i + ")") + '">' + (mm.w ? "Open website" : "Open module") + '</button>') + '</div>'
    }).join("") + '</div><div class="sm" style="padding:10px 14px;border-top:1px solid var(--bd)">' + (mm.w ? "Web results. Check the source before relying on it." : "Only your enrolled courses are searched.") +
      '</div></div>';
    else if (mm && !S.pn) x = '<div id="tab" onclick="S.pn=true;render()">Sources (' + mm.c.length + ")</div>"
  }
  return { h: h, x: x }
}

function box(id, ph) {
  return '<div style="display:flex;gap:8px;align-items:flex-end;background:var(--s2);border:1px solid var(--bd2);border-radius:16px;padding:8px 8px 8px 14px"><textarea id="' +
    id + '" rows="1" placeholder="' + ph + '" style="flex:1;border:none;resize:none;padding:6px 0;background:transparent;outline:none" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();ask()}"></textarea>' +
    (STOP ? '<button class="p" aria-label="Stop answering" title="Stop" onclick="STOP&&STOP()" style="width:36px;height:36px;border-radius:50%;padding:0">■</button>'
      : '<button class="p" aria-label="Send" onclick="ask()" style="width:36px;height:36px;border-radius:50%;padding:0">↑</button>') + '</div>'
}
// Set while an answer is being written: the send button turns into Stop.
var STOP = null;

function small(t) {
  t = t.trim().toLowerCase().replace(/[!.?,]+$/, "");
  if (/^(hi|hello|hey|good (morning|afternoon|evening)|kumusta|musta)$/.test(t)) return "Hi " + name() +
    "! I can help you study from your course modules, or answer other questions too. What would you like to look at today?";
  if (/^(can|may|could) i ask( you)?( a| another| something)?( question)?$/.test(t) || /^i (have|got) a question$/.test(t)) return "Of course, go ahead. Ask about any of your courses, or anything else.";
  if (/^how are you/.test(t)) return "I’m doing well, thanks for asking. Want to review a topic from one of your courses?";
  if (/^(thanks|thank you|ty|salamat)$/.test(t)) return "You’re welcome! Let me know if you want to go over anything else.";
  if (/^(bye|goodbye)$/.test(t)) return "See you! Good luck with your studies.";
  return null
}

function ask() {
  var e = $("qi"), t = e.value.trim();
  if (!t) return;
  if (S.v === "home") {
    S.v = "chat";
    H.unshift(t.slice(0, 40))
  }
  CH.push({ u: t });
  var s = small(t);
  if (s) CH.push({ h: '<p style="margin:0;line-height:1.7">' + s + "</p>" });
  else {
    var tp = null;
    TOP.forEach(function (x) {
      if (!tp && x.k.test(t.toLowerCase())) tp = x
    });
    var fw = t.split(/\s+/).length <= 10 && (/\b(it|this|that|they|them)\b/i.test(t) || /^(why|how come)/i.test(t)),
      a = null, rw = null;
    if (tp) {
      last = tp;
      a = tp.a
    } else if (fw) {
      if (last) {
        tp = last;
        a = last.w;
        rw = last.wq
      } else {
        CH.push({
          h: '<p style="margin:0">Which topic do you mean? Tell me the course or the topic and I’ll look it up in your modules.</p>'
        });
        render();
        return
      }
    }
    if (a) {
      var mi = MS.push({
        t: CO[tp.c][0] + " · " + CO[tp.c][1],
        c: tp.m.map(function (m, i) {
          return [MT(tp.c, m), ["Pages 8–10", "Slides 5–6"][i] || "Page 4", C(tp.c, m).s[tp.h[i][0]], tp.c, m, tp.h[i]]
        })
      }) - 1;
      CH.push({
        h: '<span class="chip">From your modules · ' + CO[tp.c][0] + " · " + CO[tp.c][2] + "</span>" + (rw ? '<p class="sm" style="margin:8px 0 0">↳ Understood as: ' +
          rw + "</p>" : "") + '<p style="margin:10px 0;line-height:1.8">' + a.map(function (x) {
          return E(x[0]) + " " + x[1].split("").map(function (n) {
            return '<button class="ct" onclick="S.mi=' + mi + ";S.hn=" + n + ';S.pn=true;render()">' + n + "</button>"
          }).join("")
        }).join(" ") + '</p><button style="font-size:12px;padding:4px 10px" onclick="S.mi=' + mi + ";S.pn=true;S.hn=0;render()\">" +
          tp.m.length + " sources</button>"
      });
      S.mi = mi;
      S.pn = true;
      S.hn = 0
    } else if (S.on && !CFG.gen) CH.push({ h: blockedH() });
    else if (S.on) CH.push({
      h: '<span class="chip n">General answer · not from your modules</span><p style="margin:10px 0 4px;line-height:1.7">' +
        (/world cup/i.test(t) ? "Argentina won the 2022 FIFA World Cup in Qatar, beating France on penalties after a 3-3 final." : "This is a general answer from the AI’s own knowledge. The demo has no live AI, so this is a sample reply.") +
        '</p><p class="sm" style="margin:0">Your modules didn’t cover this. Verify before using it in coursework.</p>'
    });
    else CH.push({
      h: '<span class="chip w">Offline · no module match</span><p style="margin:10px 0 0">I couldn’t find this in your modules, and you’re offline, so I can’t give a general answer. Reconnect and ask again.</p>'
    })
  }
  render()
}
var BZ = 0, _ask = ask;

function dots3(t) {
  return '<div class="typ" role="status"><span class="d"></span><span class="d"></span><span class="d"></span>' +
    (t ? '<span class="tx">' + t + "</span>" : "") + "</div>"
}

function typH(o) {
  return '<div style="display:flex;justify-content:flex-end;margin:8px 0"><div style="background:var(--s1);border-radius:16px;padding:8px 14px">' +
    E(o.u) + '</div></div><div style="display:flex;gap:10px;margin:10px 0 14px">' + bot(34) + '<div style="flex:1">' +
    dots3(o.t) + "</div></div>"
}

ask = function () {
  var e = $("qi");
  if (!e || BZ || !e.value.trim()) return;
  var q = e.value.trim(), pp = S.pn, pm = S.mi, ph = S.hn, r0 = render;
  render = function () {};
  try {
    _ask()
  } finally {
    render = r0
  }
  e.value = "";
  var rp = CH.pop();
  if (!rp || rp.u !== undefined) {
    render();
    return
  }
  var np = S.pn, nm = S.mi, nh = S.hn;
  S.pn = pp;
  S.mi = pm;
  S.hn = ph;
  var sm = rp.h.indexOf('class="chip') < 0, ty = { typ: 1, h: dots3(sm ? "" : "Finding modules…") };
  CH.push(ty);
  BZ = 1;
  var gen = !sm && !rp.web && rp.h.indexOf("General answer") > -1 && window.parent !== window, mod = !sm &&
    !rp.web && rp.h.indexOf("From your modules") > -1 && window.parent !== window && S.on && !!last;
  render();
  setTimeout(function () {
    if (!sm) {
      ty.h = dots3(rp.web ? "No match. Searching the web…" : gen ? (CFG.web ? "No match. Searching the web…" : "No match. Asking the AI…") : mod ? "Reading the modules…" : "Writing the answer…");
      render()
    }
  }, 900);
  if (rp.web) setTimeout(function () {
    ty.h = dots3("Writing the answer…");
    render()
  }, 1900);
  var fin = function (r) {
    var i = CH.indexOf(ty);
    if (i > -1) CH[i] = r;
    S.pn = np;
    S.mi = nm;
    S.hn = nh;
    BZ = 0;
    render()
  };
  if (gen) {
    var t0 = Date.now();
    llm(q, undefined, !!CFG.web).then(function (x) {
      setTimeout(function () {
        fin({ h: aiH(x) })
      }, Math.max(0, 1500 - (Date.now() - t0)))
    }, function () {
      setTimeout(function () {
        fin(rp)
      }, 900)
    })
  } else if (mod) {
    var t1 = Date.now(), tp = last, fu = !TOP.some(function (x) {
      return x.k.test(q.toLowerCase())
    });
    llm(fu ? tp.wq : q, ctxOf(tp)).then(function (x) {
      setTimeout(function () {
        fin({ h: aiMH(x, nm, tp) })
      }, Math.max(0, 1500 - (Date.now() - t1)))
    }, function () {
      setTimeout(function () {
        fin(rp)
      }, 900)
    })
  } else setTimeout(function () {
    fin(rp)
  }, sm ? 700 : rp.web ? 2700 : 1800)
};

document.addEventListener("click", function (e) {
  if (innerWidth > 760 || !S.sb || S.scr !== "app") return;
  var t = e.target;
  if (t.closest && (t.closest("#sb") || t.closest('[aria-label="Menu"]'))) return;
  sbClose()
}, true);
