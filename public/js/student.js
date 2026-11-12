var D = document, $ = function (i) {
  return D.getElementById(i)
}, E = function (s) {
  return String(s).replace(/</g, "&lt;")
};
var COL = {
  "College of Computing and Information Sciences (CCIS)": ["BS Information Technology", "BS Computer Science"],
  "College of Criminal Justice (CCJ)": ["BS Criminology"],
  "College of Technology and Allied Sciences (CTAS)": ["BSIT major in Food Preparation Services Management",
    "BS Electrical Technology", "BS Electronics Technology"]
};
var CO = [
  [
    "GE PPC",
    "Liza Navarro",
    "BSIT 3C",
    ["What Is Popular Culture?", "Media and Society", "Filipino Pop Icons", "Social Media Trends"]
  ],
  [
    "Information Assurance",
    "Ramon Dizon",
    "BSIT 3C",
    ["Introduction to Information Assurance", "Security Principles", "Risk Management", "Cryptography Basics"]
  ],
  [
    "Prof Elec 2",
    "Jomar Villareal",
    "BSIT 3C",
    ["Web Architecture", "HTML and CSS Review", "Flexbox and Grid", "JavaScript Basics"]
  ],
  [
    "GE Ethics",
    "Andrea Mae Salazar",
    "IT 3C",
    ["Foundations of Ethics", "Moral Theories", "Professional Ethics", "Ethics in Technology"]
  ],
  ["IT 313", "Aurora Pineda", "BSIT 3", ["Course Overview", "Core Concepts", "Applications", "Case Studies"]],
  [
    "Research Methods",
    "Carmela Reyes",
    "BSIT 3C",
    ["Research Basics", "Review of Literature", "Methodology", "Data Analysis"]
  ]
];
var IA = [
  {
    s: [
      "Information assurance protects how information is used, stored, and shared.",
      "It combines technology, people, and policy instead of relying on tools alone.",
      "Its goal is to keep information trustworthy and available."
    ],
    q: [
      "What does information assurance combine?",
      ["Technology, people, and policy", "Hardware only", "Software licenses"],
      0
    ],
    f: [["What is information assurance?", "Protecting how information is used, stored, and shared."]]
  },
  {
    s: [
      "The CIA triad is built on confidentiality, integrity, and availability.",
      "Confidentiality limits who can see data, and integrity keeps it accurate and unaltered.",
      "Availability means systems and data can be reached when needed."
    ],
    q: ["Which goal means data is not changed without permission?", ["Confidentiality", "Integrity", "Availability"],
      1],
    f: [
      ["Confidentiality", "Only authorized people can see the data."],
      ["Availability", "Systems and data are reachable when needed."]
    ]
  },
  {
    s: [
      "Risk is the chance that a threat exploits a weakness and causes harm.",
      "Assessment identifies assets, threats, and vulnerabilities.",
      "Responses include accepting, reducing, transferring, or avoiding risk."
    ],
    q: ["Which is a way to respond to risk?", ["Transferring it", "Ignoring the asset", "Deleting the policy"],
      0],
    f: [["What is a vulnerability?", "A weakness a threat can exploit."]]
  },
  {
    s: [
      "Encryption turns readable data into unreadable data using a key.",
      "Symmetric methods share one key; asymmetric methods use a key pair.",
      "Hashing creates a fixed fingerprint used to check integrity."
    ],
    q: ["Which technique checks that data was not changed?", ["Hashing", "Compression", "Formatting"], 0],
    f: [["Hash", "A fixed-length fingerprint of data."]]
  }
];

// "Module N: Title". Real courses carry each module's own number (c[5]), so hidden modules don't shift the count.
function MT(c, m) {
  return "Module " + (CO[c][5] ? CO[c][5][m] : m + 1) + ": " + E(CO[c][3][m])
}
// The app is "live" inside login.html (real data); opened on its own with ?demo it shows the sample data.
var LIVE = window.parent !== window;

function C(c, m) {
  if (c === 1 && IA[m] && CO[1][0] === "Information Assurance") return IA[m];
  var t = CO[c][3][m];
  return {
    s: [
      "This module introduces the key ideas of " + t + ".",
      "It explains the main terms and how they connect.",
      "It closes with examples you can use to review."
    ],
    q: ["Which topic does this module focus on?", [t, "An unrelated topic", "A different course"], 0],
    f: [["Main idea of " + t + "?", "Sample answer from the module."]]
  }
}
var TOP = [
  {
    k: /cia|confidential|integrity|availab|security/,
    c: 1,
    m: [1, 0],
    a: [
      ["The CIA triad is a model built on three security goals.", "1"],
      ["Confidentiality limits who can see data, and integrity keeps it accurate and unaltered.", "12"],
      ["Availability means systems and data can be reached when needed.", "2"]
    ],
    w: [
      ["It gives organizations a common checklist for deciding what needs protecting.", "1"],
      ["A weakness in any one goal is a security failure, so all three must be balanced.", "12"],
      ["It also guides which controls to choose, such as access control, hashing, and backups.", "2"]
    ],
    wq: "Why is the CIA triad important?",
    h: [[0, 1, 2], [2]]
  },
  {
    k: /ethic|moral/,
    c: 3,
    m: [0, 1],
    a: [
      ["Morality is the set of beliefs about right and wrong that a person or community holds.", "1"],
      ["Ethics is the systematic study of those beliefs and whether the reasons behind them hold up.", "12"]
    ],
    w: [
      ["It helps us judge decisions with reasons instead of habit or opinion.", "1"],
      ["In IT work it guides choices about privacy, honesty, and impact on people.", "2"]
    ],
    wq: "Why is ethics important?",
    h: [[0], [0, 1]]
  }
];
var S = {
  scr: /start=app/.test(location.search) ? "app" : "reg",
  st: 1,
  sb: innerWidth > 760,
  cg: true,
  srch: false,
  sq: "",
  v: "home",
  ci: 1,
  sel: [],
  sp: "ask",
  on: true,
  pn: false,
  mi: -1,
  hn: 0,
  pm: false,
  vm: null,
  qi: 0,
  qs: 0,
  qa: null,
  fi: 0,
  fl: false,
  ch: [],
  cf: null,
  nm: false,
  sim: null
}, R = { un: "", sid: "", em: "", col: "", prg: "", yr: "", sec: "", pw: "" }, CH = [], MS = [], H = [],
  last = null, T = [], cd = null, code = "", typed = false;

function clr() {
  T.forEach(clearTimeout);
  T = [];
  clearInterval(cd)
}

function go(s) {
  S.scr = s;
  render()
}

function render() {
  var r = $("root"), k = [S.scr, S.v, S.st, S.sp, S.ci, S.vm !== null, !!S.vw, S.qi, S.fi, S.fl, CH.length,
    S.ch.length, S.pn, S.sb].join("|");
  r.className = k !== window.K ? "enter" : "";
  window.K = k;
  if (S.scr === "reg") r.innerHTML = reg();
  else if (S.scr === "login") r.innerHTML = login();
  else r.innerHTML = app();
  after()
}

function after() {
  var m = $("msgs");
  if (m) m.scrollTop = m.scrollHeight;
  if (S.scr === "reg" && S.st === 4) startV();
  if (S.scr === "login" && S.auto) {
    S.auto = false;
    T.push(setTimeout(function () {
      var b = $("lb");
      if (b) b.textContent = "Logging you in…"
    }, 900));
    T.push(setTimeout(function () {
      S.v = "home";
      go("app");
      loadSession();
      loadCourses();
      loadChats()
    }, 1900))
  }
}
/* auth */
function dots() {
  var n = ["Account", "School info", "Password", "Verify"];
  return '<div style="display:flex;gap:6px;margin-bottom:16px">' + n.map(function (x, i) {
    var d = i + 1 < S.st, c = i + 1 === S.st;
    return '<div style="flex:1;text-align:center;font-size:12px;color:' + (c ? "var(--ac)" : "var(--t3)") +
      '"><div style="height:4px;border-radius:2px;background:' + (d || c ? "var(--ac)" : "var(--bd)") + ';margin-bottom:4px"></div>' +
      x + "</div>"
  }).join("") + "</div>"
}

function fld(id, l, t, ph, h) {
  return '<label for="' + id + '">' + l + '</label><input id="' + id + '" type="' + (t || "text") + '" placeholder="' +
    (ph || "") + '" value="' + E(R[id] || "") + '" style="width:100%" oninput="$(\'e\').textContent=\'\'">' +
    (h ? '<p class="sm" style="margin:4px 0 0">' + h + "</p>" : "")
}

function sel(id, l, o, ph) {
  return '<label for="' + id + '">' + l + '</label><select id="' + id + '" style="width:100%" onchange="' +
    (id === "col" ? "R.col=this.value;R.prg='';gather();render()" : "") + '"><option value="">' + ph + "</option>" +
    o.map(function (x) {
    return "<option" + (R[id] === x ? " selected" : "") + ">" + x + "</option>"
  }).join("") + "</select>"
}

function reg() {
  var b = "";
  if (S.st === 1) b = '<h2 style="margin:0">Create your account</h2>' + fld("un", "Username", "text", "maria_santos",
    "4 to 20 letters, numbers, or underscores") + fld("sid", "Student ID", "text", "2024-00123") + '<label for="em">School email</label><div style="display:flex"><input id="em" placeholder="maria.santos" value="' +
    E(R.em) + '" style="flex:1;min-width:0;border-radius:8px 0 0 8px" oninput="this.value=this.value.split(\'@\')[0];$(\'e\').textContent=\'\'"><span style="padding:8px 10px;background:var(--s1);border:1px solid var(--bd2);border-left:none;border-radius:0 8px 8px 0;color:var(--t2)">@bisu.edu.ph</span></div><p class="sm" style="margin:4px 0 0">Only BISU emails are accepted.</p>';
  else if (S.st === 2) {
    var pr = COL[R.col] || [];
    b = '<h2 style="margin:0">Your school info</h2><p class="sm" style="margin:2px 0 0">BISU Balilihan Campus</p>' +
      sel("col", "College", Object.keys(COL), "Select your college") + sel("prg", "Program", pr, pr.length ? "Select your program" : "Select a college first") +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + "<div>" + sel("yr", "Year level",
      ["1st year", "2nd year", "3rd year", "4th year"], "Select") + "</div><div>" + sel("sec", "Section", ["A",
      "B", "C", "D", "E", "F"], "Select") + "</div></div>"
  } else if (S.st === 3) b = '<h2 style="margin:0">Set a password</h2>' + fld("pw", "Password", "password",
    "", "At least 8 characters with a letter and a number") + fld("pw2", "Confirm password", "password");
  else b = '<h2 style="margin:0;text-align:center">Verify your email</h2><p id="vs" class="sm" style="text-align:center;margin:4px 0 12px">Sending code…</p><div id="nt" style="display:none;background:var(--acb);color:var(--ac);padding:10px 12px;border-radius:8px;margin-bottom:12px;font-size:13px"></div><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px" id="bx">' +
    "<input class=\"cb\" inputmode=\"numeric\" maxlength=\"1\" oninput=\"cin(this)\">".repeat(6) + '</div><p class="sm" style="text-align:center;margin-top:10px">We fill the code in for you. You can also type it.</p>';
  return '<div class="au"><div class="card">' + dots() + b + '<p class="er" id="e"></p><div style="display:flex;gap:8px;margin-top:10px">' +
    (S.st > 1 ? '<button style="flex:1" onclick="gather();S.st--;clr();render()">Back</button>' : "") + (S.st < 4 ? '<button class="p" style="flex:2" onclick="nxt()">' +
    (S.st === 3 ? "Send code" : "Continue") + "</button>" : "") + "</div>" + (S.st === 1 ? '<p class="sm" style="text-align:center;margin-top:14px">Already have an account? <a href="#" onclick="parent.postMessage(\'logout\',\'*\');return false" style="color:var(--ac)">Log in</a></p>' : "") +
    "</div></div>"
}

function gather() {
  ["un", "sid", "em", "col", "prg", "yr", "sec", "pw"].forEach(function (k) {
    var e = $(k);
    if (e) R[k] = e.value.trim()
  })
}

function nxt() {
  gather();
  var e = "";
  if (S.st === 1) {
    if (!/^\w{4,20}$/.test(R.un)) e = "Use 4 to 20 letters, numbers, or underscores";
    else if (R.sid.length < 5) e = "Enter your student ID, like 2024-00123";
    else {
      if (R.em && R.em.indexOf("@") < 0) {
        R.em += "@bisu.edu.ph";
        $("em").value = R.em
      }
      if (!R.em) e = "Enter your BISU email";
      else if (!/^[^\s@]+@bisu\.edu\.ph$/i.test(R.em)) e = "Only BISU emails are accepted. Use name@bisu.edu.ph"
    }
  } else if (S.st === 2) {
    if (!R.col || !R.prg || !R.yr || !R.sec) e = "Select your college, program, year, and section"
  } else {
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(R.pw)) e = "Use at least 8 characters with a letter and a number";
    else if ($("pw2").value !== R.pw) e = "Passwords don’t match. Try again"
  }
  if (e) {
    $("e").textContent = e;
    return
  }
  S.st++;
  render()
}

function startV() {
  typed = false;
  code = String(Math.floor(1e5 + Math.random() * 9e5));
  T.push(setTimeout(function () {
    $("vs").textContent = "Code sent to " + R.em;
    var n = $("nt");
    n.style.display = "block";
    n.innerHTML = "<b>New email from LearnLink</b><br>Your verification code is <b>" + code + "</b>"
  }, 1000));
  T.push(setTimeout(function () {
    if (typed) return;
    $("vs").textContent = "Code detected. Verifying…";
    var b = D.querySelectorAll("#bx input");
    code.split("").forEach(function (d, i) {
      T.push(setTimeout(function () {
        b[i].value = d
      }, i * 90))
    });
    T.push(setTimeout(vfy, 800))
  }, 2600))
}

function cin(el) {
  typed = true;
  el.value = el.value.replace(/\D/g, "");
  var b = [].slice.call(D.querySelectorAll("#bx input")), i = b.indexOf(el);
  if (el.value && i < 5) b[i + 1].focus();
  if (b.every(function (x) {
    return x.value
  })) vfy()
}

function vfy() {
  var b = [].slice.call(D.querySelectorAll("#bx input")), v = b.map(function (x) {
    return x.value
  }).join("");
  if (v === code) {
    clr();
    $("vs").textContent = "Creating your account…";
    api("auth?action=register", {
      username: R.un,
      email: R.em,
      password: R.pw,
      student_id: R.sid,
      college: R.col,
      program: R.prg,
      year_level: R.yr,
      section: R.sec
    }).then(function () {
      $("vs").textContent = "Verified";
      T.push(setTimeout(function () {
        S.auto = true;
        go("login")
      }, 900))
    }, function (x) {
      var m = {
        email_taken: "That email already has an account. Log in instead.",
        username_taken: "That username is taken. Pick another one.",
        weak_password: "Use at least 8 characters with a letter and a number"
      }[x && x.error] || "Could not create the account. Is the server (and MySQL) running?";
      S.st = 1;
      render();
      $("e").textContent = m
    })
  } else {
    $("e").textContent = "That code doesn’t match. Check your email and try again."
  }
}

function login() {
  return '<div class="au"><div class="card"><h2 style="margin:0;text-align:center">Welcome back</h2><p class="sm" style="text-align:center;margin:2px 0 0">Logging you in with your account.</p><label>Username or email</label><input style="width:100%" readonly value="' +
    E(R.un || "maria_santos") + '"><label>Password</label><input type="password" style="width:100%" readonly value="' +
    E(R.pw || "demo1234") + '"><button id="lb" class="p" style="width:100%;margin-top:16px" onclick="clr();S.v=\'home\';go(\'app\')">Log in</button></div></div>'
}
/* app */
function name() {
  return R.un || "maria_santos"
}

function app() {
  var side = S.sb ? '<aside id="sb"><button class="p" onclick="newChat()" style="margin-bottom:10px">+ New chat</button><button class="it" onclick="S.srch=!S.srch;render()">Search chats</button>' +
    (S.srch ? '<input placeholder="Search your chats" value="' + E(S.sq) + '" style="width:100%;margin:2px 0 6px" oninput="S.sq=this.value;rec()"><div id="rec">' +
    recs() + "</div>" : "") + '<button class="it" onclick="S.cg=!S.cg;render()">Courses enrolled ' + (S.cg ? "▾" : "▸") +
    "</button>" + (S.cg ? '<div class="sub">' + (CO.length ? CO.map(function (c, i) {
    return '<button class="it' + (S.v !== "home" && S.v !== "chat" && S.v !== "set" && S.ci === i ? " on" : "") +
      '" onclick="openC(' + i + ')">' + E(c[0]) + "</button>"
  }).join("") : '<p class="sm" style="margin:4px 14px 8px">No courses yet. Courses appear here once your teacher sets them up.</p>') + "</div>" : "") + '<div style="margin-top:auto;border-top:1px solid var(--bd);padding-top:8px"><button class="it' +
    (S.v === "set" ? " on" : "") + '" onclick="lv(function(){S.v=\'set\';mob();render()})">Settings</button></div></aside>' : "";
  var tb = '<div class="top"><div style="display:flex;align-items:center;gap:8px"><button class="g" aria-label="Menu" onclick="S.sb=!S.sb;render()" style="font-size:18px">☰</button>' +
    bot(26) + '<b>LearnLink</b></div></div>';
  var dd = S.pm ? '<div class="dd"><div style="cursor:default"><b>' + E(name()) + '</b><br><span class="sm">' +
    E(R.prg || "BS Information Technology") + " · " + E(R.yr || "3rd year") + " · Sec " + E(R.sec || "C") +
    '</span></div><div onclick="lv(function(){S.v=\'set\';S.pm=false;render()})">My profile and privacy</div><div style="color:var(--er)" onclick="S.pm=false;lv(function(){parent.postMessage(\'logout\',\'*\')})">Log out</div></div>' : "";
  var body = S.v === "home" || S.v === "chat" ? chatV() : S.v === "set" ? setV() : S.v === "course" ? courseV() : spaceV();
  return '<div id="app" onclick="if(S.pm||S.nm){S.pm=false;S.nm=false;render()}">' + side + "<main>" + tb +
    netB() + body.h + (body.x || "") + "</main>" + (S.vw || (S.v === "course" && S.vm !== null) ? viewer() : "") +
    dd + netP() + cfmH() + "</div>"
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
// Home suggestions: the first module of each of the student's first three courses (live), or fixed examples (demo).
function sugg() {
  if (!LIVE) return ["What is the CIA triad?", "Ethics vs morality", "Flexbox vs grid"];
  return CO.filter(function (c) { return c[3].length }).slice(0, 3).map(function (c) {
    return "Explain " + c[3][0].replace(/^(what|who) (is|are)\s+/i, "").replace(/\?$/, "")
  })
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
    h = '<div class="sc" id="msgs" style="padding-right:' + (S.pn ? "292px" : "22px") + '">' + CH.map(function (m) {
      return m.u !== undefined ? '<div style="display:flex;justify-content:flex-end;margin:10px 0"><div style="background:var(--s1);border-radius:16px;padding:8px 14px;max-width:80%">' +
        E(m.u) + "</div></div>" : '<div style="display:flex;gap:10px;align-items:flex-start;margin:12px 0">' +
        bot(34) + '<div' + (m.live ? ' id="live"' : '') + ' style="flex:1;min-width:0">' + m.h + fbH(m) + "</div></div>"
    }).join("") + '</div><div style="padding:0 22px 16px">' + box("qi", "Ask a follow-up…") + "</div>";
    var mm = MS[S.mi];
    if (S.pn && mm) x = '<div id="pn"><div style="display:flex;justify-content:space-between;align-items:center;padding:14px;border-bottom:1px solid var(--bd)"><div><b>Sources</b><div class="sm">' +
      E(mm.t) + '</div></div><button class="g" aria-label="Close" onclick="S.pn=false;render()">✕</button></div><div style="flex:1;overflow-y:auto;padding:12px">' +
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
    id + '" rows="1" placeholder="' + ph + '" style="flex:1;border:none;resize:none;padding:6px 0;background:transparent;outline:none" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();ask()}"></textarea><button class="p" aria-label="Send" onclick="ask()" style="width:36px;height:36px;border-radius:50%;padding:0">↑</button></div>'
}

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
/* course space */
function setV() {
  return {
    h: '<div class="sc"><h2 style="margin:6px 0 12px">Settings</h2><div class="card" style="margin-bottom:10px"><b>' +
      E(name()) + '</b><div class="sm">' + E(R.em ? R.em + "@bisu.edu.ph" : "maria.santos@bisu.edu.ph") + "</div><div class=\"sm\">" +
      E(R.prg || "BS Information Technology") + " · " + E(R.yr || "3rd year") + " · Section " + E(R.sec || "C") +
      '</div></div><div class="card"><b>Privacy and my data</b><p class="sm">Your chats are private. Faculty only see anonymous summaries. You can download everything LearnLink keeps about you, or delete your chats, at any time.</p><button onclick="dataDelete()">Delete my chats</button> <button onclick="dataExport()">Download my data</button><p class="sm" id="dmsg" style="margin:8px 0 0"></p></div></div>'
  }
}

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

// Real module text (live mode): what LearnLink reads from the module's files, loaded once per module.
var MTX = {};
function viewerLive(ci, m, id) {
  var d = MTX[id];
  if (d === undefined) {
    d = MTX[id] = "loading";
    api("courses?action=module_text&id=" + id).then(function (j) { MTX[id] = j; render() }, function () { MTX[id] = "error"; render() });
  }
  var body = d === "loading" ? '<p class="sm">Loading the module…</p>' : d === "error" ? '<p class="sm">Couldn’t load this module. Try again in a moment.</p>' :
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
      (S.sel.length ? "the selected module" + (S.sel.length > 1 ? "s" : "") : "this course") + '</b><p class="sm">Answers come only from the modules in scope.</p><button onclick="sa(\'Summarize this\')">Summarize this</button></div>';
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
var STEPS = ["terms", "account", "school", "photo", "pass", "verify"], TN = ["Terms", "Account", "School",
  "Photo", "Password", "Verify"], AGS = [
  ["Terms of Use", "I will use LearnLink for my own studies and keep my account to myself."],
  [
    "Data Privacy (RA 10173)",
    "LearnLink may collect my name, student ID, school info, and questions to run the service. I can export or delete my data anytime."
  ],
  [
    "Course Materials (RA 8293)",
    "I will use modules for my own learning and not copy or share them outside LearnLink."
  ]
];

function av() {
  return R.ph ? '<img src="' + R.ph + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block">' : E(name().slice(0,
    2).toUpperCase())
}

function pickPh(inp) {
  var f = inp.files[0];
  if (!f) return;
  if (f.size > 2e6) {
    $("e").textContent = "Choose a photo under 2 MB";
    return
  }
  var r = new FileReader();
  r.onload = function () {
    R.ph = r.result;
    render()
  };
  r.readAsDataURL(f)
}

function dots() {
  return '<div style="display:flex;gap:6px;margin-bottom:16px">' + TN.map(function (x, i) {
    var d = i + 1 < S.st, c = i + 1 === S.st;
    return '<div style="flex:1;text-align:center;font-size:11px;color:' + (c ? "var(--ac)" : "var(--t3)") +
      '"><div style="height:4px;border-radius:2px;background:' + (d || c ? "var(--ac)" : "var(--bd)") + ';margin-bottom:4px"></div>' +
      x + "</div>"
  }).join("") + "</div>"
}

function photoBox(sz) {
  return '<div style="width:' + sz + 'px;height:' + sz + 'px;border-radius:50%;margin:0 auto 14px;display:grid;place-items:center;overflow:hidden;background:var(--acb);color:var(--ac);font-size:' +
    Math.round(sz / 3) + 'px;font-weight:800;border:4px solid var(--s2);box-shadow:0 0 0 3px var(--sh),0 12px 24px -12px rgba(0,37,131,.5)">' +
    av() + "</div>"
}

function photoBtn() {
  return '<label class="p" style="display:inline-block;cursor:pointer;padding:8px 16px;border-radius:14px;font-weight:700;margin:0;font-size:14px;color:var(--bg)">' +
    (R.ph ? "Choose another" : "Choose a photo") + '<input type="file" accept="image/*" hidden onchange="pickPh(this)"></label>' +
    (R.ph ? ' <button onclick="R.ph=\'\';render()" style="margin-left:6px">Remove</button>' : "")
}

function reg() {
  var K = STEPS[S.st - 1], b = "";
  if (!R.ag) R.ag = [0, 0, 0];
  if (K === "terms") b = '<h2 style="margin:0">Before we start</h2><p class="sm" style="margin:2px 0 8px">Please read and agree to continue.</p>' +
    AGS.map(function (a, i) {
    return '<label style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;border:1.5px solid var(--bd);border-radius:14px;margin:8px 0;cursor:pointer;font-size:13px;color:var(--tx)"><input type="checkbox"' +
      (R.ag[i] ? " checked" : "") + ' style="width:18px;height:18px;margin-top:2px;padding:0;flex-shrink:0" onchange="R.ag[' +
      i + ']=this.checked;$(\'e\').textContent=\'\'"><span><b>' + a[0] + '</b><br><span style="color:var(--t2)">' +
      a[1] + "</span></span></label>"
  }).join("") + '<a href="#" onclick="R.ag=[1,1,1];render();return false" style="font-size:13px;color:var(--ac);font-weight:700">Agree to all</a>';
  else if (K === "account") b = '<h2 style="margin:0">Create your account</h2>' + fld("un", "Username",
    "text", "maria_santos", "4 to 20 letters, numbers, or underscores") + fld("sid", "Student ID", "text",
    "2024-00123") + '<label for="em">School email</label><input id="em" type="email" inputmode="email" autocomplete="off" placeholder="name@bisu.edu.ph" value="' +
    E(R.em) + '" style="width:100%" oninput="emIn(this)" onblur="emDone(this)"><p class="sm" style="margin:4px 0 0">Only BISU emails are accepted. Type your name and we’ll add @bisu.edu.ph.</p>';
  else if (K === "school") {
    var pr = COL[R.col] || [];
    b = '<h2 style="margin:0">Your school info</h2><p class="sm" style="margin:2px 0 0">BISU Balilihan Campus</p>' +
      sel("col", "College", Object.keys(COL), "Select your college") + sel("prg", "Program", pr, pr.length ? "Select your program" : "Select a college first") +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div>' + sel("yr", "Year level", ["1st year",
      "2nd year", "3rd year", "4th year"], "Select") + "</div><div>" + sel("sec", "Section", ["A", "B", "C",
      "D", "E", "F"], "Select") + "</div></div>"
  } else if (K === "photo") b = '<h2 style="margin:0;text-align:center">Add a profile photo</h2><p class="sm" style="text-align:center;margin:2px 0 16px">Optional. You can add or change it later in Settings.</p><div style="text-align:center">' +
    photoBox(132) + photoBtn() + "</div>";
  else if (K === "pass") b = '<h2 style="margin:0">Set a password</h2>' + fld("pw", "Password", "password",
    "", "At least 8 characters with a letter and a number") + fld("pw2", "Confirm password", "password");
  else b = '<h2 style="margin:0;text-align:center">Verify your email</h2><p id="vs" class="sm" style="text-align:center;margin:4px 0 12px">Sending code…</p><div id="nt" style="display:none;background:var(--acb);color:var(--ac);padding:10px 12px;border-radius:12px;margin-bottom:12px;font-size:13px"></div><div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px" id="bx">' +
    "<input class=\"cb\" inputmode=\"numeric\" maxlength=\"1\" oninput=\"cin(this)\">".repeat(6) + '</div><p class="sm" style="text-align:center;margin-top:10px">We fill the code in for you. You can also type it.</p>';
  return '<div class="au"><div class="card">' + dots() + b + '<p class="er" id="e"></p><div style="display:flex;gap:8px;margin-top:10px">' +
    (S.st > 1 ? '<button style="flex:1" onclick="gather();S.st--;clr();render()">Back</button>' : "") + (S.st < 6 ? '<button class="p" style="flex:2" onclick="nxt()">' +
    (K === "terms" ? "I agree and continue" : K === "photo" ? (R.ph ? "Continue" : "Skip for now") : K === "pass" ? "Send code" : "Continue") +
    "</button>" : "") + "</div>" + (S.st === 1 ? '<p class="sm" style="text-align:center;margin-top:14px">Already have an account? <a href="#" onclick="R.un=R.un||\'maria_santos\';R.pw=R.pw||\'demo1234\';go(\'login\');return false" style="color:var(--ac)">Log in</a></p>' : "") +
    "</div></div>"
}

function nxt() {
  gather();
  var K = STEPS[S.st - 1], e = "";
  if (K === "terms") {
    if (!R.ag || R.ag.some(function (x) {
      return !x
    })) e = "Please agree to all three to continue"
  } else if (K === "account") {
    if (!/^\w{4,20}$/.test(R.un)) e = "Use 4 to 20 letters, numbers, or underscores";
    else if (R.sid.length < 5) e = "Enter your student ID, like 2024-00123";
    else {
      if (R.em && R.em.indexOf("@") < 0) {
        R.em += "@bisu.edu.ph";
        $("em").value = R.em
      }
      if (!R.em) e = "Enter your BISU email";
      else if (!/^[^\s@]+@bisu\.edu\.ph$/i.test(R.em)) e = "Only BISU emails are accepted. Use name@bisu.edu.ph"
    }
  } else if (K === "school") {
    if (!R.col || !R.prg || !R.yr || !R.sec) e = "Select your college, program, year, and section"
  } else if (K === "pass") {
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(R.pw)) e = "Use at least 8 characters with a letter and a number";
    else if ($("pw2").value !== R.pw) e = "Passwords don’t match. Try again"
  }
  if (e) {
    $("e").textContent = e;
    return
  }
  S.st++;
  render()
}

function after() {
  var m = $("msgs");
  if (m) m.scrollTop = m.scrollHeight;
  if (S.scr === "reg" && S.st === 6) startV();
  if (S.scr === "login" && S.auto) {
    S.auto = false;
    T.push(setTimeout(function () {
      var b = $("lb");
      if (b) b.textContent = "Logging you in…"
    }, 900));
    T.push(setTimeout(function () {
      S.v = "home";
      go("app")
    }, 1900))
  }
}

function setV() {
  var rows = [
    ["Email", R.em || "maria.santos@bisu.edu.ph"],
    ["Student ID", R.sid || "2024-00123"],
    ["College", R.col || "College of Computing and Information Sciences (CCIS)"],
    ["Program", R.prg || "BS Information Technology"],
    ["Year level", R.yr || "3rd year"],
    ["Section", R.sec || "C"]
  ];
  return {
    h: '<div class="sc"><div style="max-width:560px;margin:0 auto"><div style="text-align:center;margin:8px 0 20px">' +
      photoBox(96) + photoBtn() + '<p class="er" id="e" style="text-align:center"></p><h2 style="margin:2px 0 6px;font-size:26px">' +
      E(name()) + '</h2><span class="chip">Student</span></div><div class="card"><b>About you</b>' + rows.map(function (r,
      i) {
      return '<div style="display:flex;justify-content:space-between;gap:16px;padding:10px 0;' + (i ? "border-top:1px solid var(--bd)" : "") +
        '"><span class="sm">' + r[0] + '</span><span style="text-align:right;font-weight:700;word-break:break-word">' +
        E(r[1]) + "</span></div>"
    }).join("") + '</div><div class="card"><b>Privacy and my data</b><p class="sm">Your chats are private. Faculty only see anonymous summaries. You can download everything LearnLink keeps about you, or delete your chats, at any time.</p><button onclick="dataDelete()">Delete my chats</button> <button onclick="dataExport()">Download my data</button><p class="sm" id="dmsg" style="margin:8px 0 0"></p></div><div class="card"><button style="width:100%;color:var(--er)" onclick="lv(function(){parent.postMessage(\'logout\',\'*\')})">Log out</button></div></div></div>'
  }
}

function emIn(el) {
  $("e").textContent = "";
  var v = el.value;
  if (v.indexOf("@") === v.length - 1 && v.length > 1) el.value = v + "bisu.edu.ph"
}

function emDone(el) {
  var v = el.value.trim();
  if (v && v.indexOf("@") < 0) {
    el.value = v + "@bisu.edu.ph";
    v = el.value
  }
  if (v && !/^[^\s@]+@bisu\.edu\.ph$/i.test(v)) $("e").textContent = "Only BISU emails are accepted. Use name@bisu.edu.ph"
}
var NET = { lv: "good", mbps: null, bad: 0 }, SIMS = [null, { on: 1, mbps: 45 }, { on: 1, mbps: .6 },
  { on: 0 }], SN = ["Auto", "Fast", "Weak", "No signal"];

function wifi(l) {
  var c = l === "good" ? "var(--ac)" : l === "weak" ? "#E0A100" : "var(--er)", n = l === "good" ? 3 : l === "weak" ? 1 : 0,
    g = "var(--bd2)";
  return '<svg width="20" height="16" viewBox="0 0 24 20" fill="none" stroke-linecap="round" stroke-width="2.4" aria-hidden="true"><path d="M2 7.5a14 14 0 0 1 20 0" stroke="' +
    (n >= 3 ? c : g) + '"/><path d="M5.5 11.5a9 9 0 0 1 13 0" stroke="' + (n >= 2 ? c : g) + '"/><path d="M9 15.2a4 4 0 0 1 6 0" stroke="' +
    (n >= 1 ? c : g) + '"/><circle cx="12" cy="18.5" r="1.1" fill="' + (n >= 1 ? c : g) + '" stroke="none"/>' +
    (l === "off" ? '<path d="M3 2l18 17" stroke="var(--er)"/>' : "") + "</svg>"
}

function rd() {
  if (S.sim) return S.sim.on ? S.sim.mbps : -1;
  if (!navigator.onLine) return -1;
  var c = navigator.connection;
  return c && typeof c.downlink === "number" ? c.downlink : null
}

function lvOf(m) {
  return m === -1 ? "off" : m === null ? "good" : m < .2 ? "off" : m < 1 ? "weak" : "good"
}

function netUpd(first) {
  var m = rd(), l = lvOf(m), prev = NET.lv;
  if (!first && !S.sim && l === "off" && prev !== "off" && NET.bad < 1) {
    NET.bad++;
    return
  }
  NET.bad = 0;
  var t = (m === -1 || m === null) ? m : Math.round(m * 10) / 10;
  if (!first && l === NET.lv && t === NET.mbps) return;
  NET.lv = l;
  NET.mbps = t;
  S.on = l !== "off";
  if (!first && prev !== l) tw(l, prev);
  if (!first) render()
}

function nu(e) {
  if (e && e.type === "offline") NET.bad = 1;
  netUpd(false)
}

function netH() {
  var l = NET.lv, t = l === "off" ? "Offline" : (NET.mbps == null || NET.mbps === -1) ? "Online" : NET.mbps +
    " Mbps";
  return '<button aria-label="Connection: ' + t + '" onclick="event.stopPropagation();S.nm=!S.nm;S.pm=false;render()" style="display:flex;align-items:center;gap:6px;font-size:12px;padding:4px 10px;border-radius:99px;color:' +
    (l === "off" ? "var(--er)" : l === "weak" ? "var(--wt)" : "var(--tx)") + '">' + wifi(l) + "<span>" + t +
    "</span></button>"
}

function netB() {
  var l = NET.lv;
  if (l === "good") return "";
  var o = l === "off";
  return '<div style="margin:0 22px 8px;padding:8px 14px;border-radius:14px;background:' + (o ? "var(--erb)" : "var(--bt)") +
    ';color:' + (o ? "var(--er)" : "var(--wt)") + ';font-size:13px;font-weight:700">' + (o ? "No internet. Campus mode: LearnLink still answers over the campus network." : "Weak connection (" +
    NET.mbps + " Mbps). Answers may be slow.") + "</div>"
}

function netP() {
  if (!S.nm) return "";
  var t = NET.lv === "off" ? "No usable signal" : NET.lv === "weak" ? "Weak signal" : "Good signal";
  return '<div class="dd" style="width:280px;right:60px;cursor:default" onclick="event.stopPropagation()"><p style="margin:4px 10px 0;font-weight:800">' +
    t + '</p><p class="sm" style="margin:2px 10px 8px">Detected automatically. Below 0.2 Mbps or with no signal, you are on campus mode only.</p><p class="sm" style="margin:0 10px 6px">Presentation demo</p><p style="margin:0 10px 8px;display:flex;flex-wrap:wrap;gap:6px">' +
    SN.map(function (n, i) {
    return '<button' + (S.sim === SIMS[i] ? ' class="p"' : "") + ' style="font-size:12px;padding:4px 10px" onclick="setSim(' +
      i + ')">' + n + "</button>"
  }).join("") + "</p></div>"
}

function setSim(i) {
  S.sim = SIMS[i];
  NET.bad = 1;
  netUpd(false);
  render()
}
window.addEventListener("online", nu);
window.addEventListener("offline", nu);
if (navigator.connection && navigator.connection.addEventListener) navigator.connection.addEventListener("change",
  nu);
setInterval(nu, 4000);
netUpd(true);
var NS = { rx: [], lat: [], mbps: null, rtt: null, fR: 0, fB: 0, ok: 0, peak: 0 }, U_R = "https://cdnjs.cloudflare.com/ajax/libs/fastclick/1.0.6/fastclick.min.js",
  U_B = "https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js", tc = 0, bR = 0, bB = 0;
for (var i0 = 0; i0 < 60; i0++) {
  NS.rx.push(0);
  NS.lat.push(0)
}

function rd() {
  if (S.sim) return S.sim.on ? S.sim.mbps : -1;
  if (!navigator.onLine) return -1;
  if (NS && NS.ok && NS.fR >= 2 && NS.fB >= 1) return -1;
  if (NS && NS.mbps != null) return NS.mbps;
  var c = navigator.connection;
  return c && typeof c.downlink === "number" ? c.downlink : null
}

function probe(u, cb) {
  var s = D.createElement("script"), t0 = performance.now(), dn = 0, tm = setTimeout(function () {
    end(0)
  }, 8000);
  function end(ok) {
    if (dn) return;
    dn = 1;
    clearTimeout(tm);
    var ms = performance.now() - t0, e = null;
    if (ok) {
      var es = performance.getEntriesByName(s.src);
      e = es[es.length - 1] || null
    }
    s.remove();
    cb(ok, ms, e)
  }
  s.onload = function () {
    end(1)
  };
  s.onerror = function () {
    end(0)
  };
  s.async = true;
  s.src = u + "?t=" + Date.now() + Math.floor(Math.random() * 999);
  D.head.appendChild(s)
}

function gotR(ok, ms, e) {
  if (ok) {
    NS.ok = 1;
    NS.fR = 0;
    NS.rtt = Math.max(1, Math.round((e && e.duration) || ms))
  } else NS.fR++;
  if (rd() === -1) NET.bad = 1;
  netUpd(false)
}

function gotB(ok, ms, e) {
  if (ok) {
    NS.ok = 1;
    NS.fB = 0;
    var by = (e && (e.transferSize || e.encodedBodySize)) || 90000, tt = e && (e.responseEnd - e.responseStart) > 3 ? (e.responseEnd - e.responseStart) : ms,
      x = Math.min(999, by * 8 / 1000 / tt);
    NS.mbps = NS.mbps == null ? x : NS.mbps * .5 + x * .5
  } else NS.fB++;
  if (rd() === -1) NET.bad = 1;
  netUpd(false)
}

function chart(a, col, min) {
  var w = 252, h = 64, mx = Math.max(min, Math.max.apply(null, a)) * 1.15, line = a.map(function (v, i) {
    return (i / (a.length - 1) * w).toFixed(1) + "," + (h - v / mx * h).toFixed(1)
  }).join(" ");
  return '<svg viewBox="0 0 ' + w + " " + h + '" width="100%" height="' + h + '" preserveAspectRatio="none" style="background:var(--s1);border-radius:10px;display:block" aria-hidden="true">' +
    [.25, .5, .75].map(function (f) {
    return '<line x1="0" x2="' + w + '" y1="' + h * f + '" y2="' + h * f + '" stroke="var(--bd)" stroke-dasharray="3 3"/>'
  }).join("") + '<polygon points="0,' + h + " " + line + " " + w + "," + h + '" fill="' + col + '" opacity=".22"/><polyline points="' +
    line + '" fill="none" stroke="' + col + '" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>'
}

function netG() {
  var off = NET.lv === "off", c = navigator.connection, d = S.sim ? (S.sim.on ? S.sim.mbps : 0) : (off ? 0 : (NS.mbps != null ? NS.mbps : (c &&
    c.downlink) || 0)), f = function (x) {
    return x >= 10 ? Math.round(x) : Math.round(x * 10) / 10
  }, lt = off ? "—" : S.sim ? "~50 ms" : NS.rtt == null ? "…" : NS.rtt + " ms";
  return '<p style="margin:0 10px 8px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px"><span><span class="sm">Download</span><br><b>' +
    (off ? 0 : f(d)) + ' Mbps</b></span><span><span class="sm">Latency</span><br><b>' + lt + '</b></span><span><span class="sm">Peak</span><br><b>' +
    f(NS.peak) + ' Mbps</b></span></p><p class="sm" style="margin:0 10px 4px">Download, last 60 seconds</p><p style="margin:0 10px 8px">' +
    chart(NS.rx, "#3B82F6", 1) + '</p><p class="sm" style="margin:0 10px 4px">Latency</p><p style="margin:0 10px 8px">' +
    chart(NS.lat, "#E0A100", 50) + "</p>"
}

function netP() {
  if (!S.nm) return "";
  var t = NET.lv === "off" ? "No usable signal" : NET.lv === "weak" ? "Weak signal" : "Good signal";
  return '<div class="dd" style="width:290px;right:60px;cursor:default" onclick="event.stopPropagation()"><p style="margin:4px 10px 6px;font-weight:800">' +
    t + (S.sim ? ' <span class="sm">(simulated)</span>' : "") + '</p><span id="ng" style="display:block">' +
    netG() + '</span><p class="sm" style="margin:0 10px 8px">' + (NS.ok ? "Measured live with small test downloads. Below 0.2 Mbps or with no signal, you are on campus mode only." : "Using your browser’s own signal while test downloads load.") +
    '</p><p class="sm" style="margin:0 10px 6px">Presentation demo</p><p style="margin:0 10px 8px;display:flex;flex-wrap:wrap;gap:6px">' +
    SN.map(function (n, i) {
    return '<button' + (S.sim === SIMS[i] ? ' class="p"' : "") + ' style="font-size:12px;padding:4px 10px" onclick="setSim(' +
      i + ')">' + n + "</button>"
  }).join("") + "</p></div>"
}

function tick() {
  tc++;
  var off = NET.lv === "off", c = navigator.connection, v = 0, l = 0;
  if (S.sim) {
    if (S.sim.on) {
      v = S.sim.mbps * (.85 + Math.random() * .3);
      l = 40 + Math.random() * 25
    }
  } else if (!off) {
    v = NS.mbps != null ? NS.mbps : (c && c.downlink) || 0;
    l = NS.rtt || 0
  }
  NS.rx.push(v);
  NS.rx.shift();
  NS.lat.push(l);
  NS.lat.shift();
  if (v > NS.peak) NS.peak = v;
  var g = $("ng");
  if (S.nm && g) g.innerHTML = netG();
  if (!S.sim && navigator.onLine) {
    if (!bR && tc % 2 === 0) {
      bR = 1;
      probe(U_R, function (a, b, e) {
        bR = 0;
        gotR(a, b, e)
      })
    }
    if (!bB && tc % (S.nm ? 3 : 10) === 0) {
      bB = 1;
      probe(U_B, function (a, b, e) {
        bB = 0;
        gotB(a, b, e)
      })
    }
  }
}
window.addEventListener("online", function () {
  NS.fR = 0;
  NS.fB = 0;
  nu()
});
setInterval(tick, 1000);
var BZ = 0, TWT, _ask = ask, _sa = sa;

function dots3(t) {
  return '<div class="typ" role="status"><span class="d"></span><span class="d"></span><span class="d"></span>' +
    (t ? '<span class="tx">' + t + "</span>" : "") + "</div>"
}

function typH(o) {
  return '<div style="display:flex;justify-content:flex-end;margin:8px 0"><div style="background:var(--s1);border-radius:16px;padding:8px 14px">' +
    E(o.u) + '</div></div><div style="display:flex;gap:10px;margin:10px 0 14px">' + bot(34) + '<div style="flex:1">' +
    dots3(o.t) + "</div></div>"
}

function tw(l, prev) {
  var k = l === "off" ? "off" : l === "weak" ? "weak" : "on", m = k === "off" ? ["No internet", "Campus mode: LearnLink still works over the campus network."] : k === "weak" ? (prev === "off" ? ["Back online, but weak",
    "Answers may be slow."] : ["Weak connection", "Answers may be slow."]) : ["Back online", "Internet restored."],
    el = $("tw");
  if (!el) return;
  el.innerHTML = '<div class="tw ' + k + '" onclick="this.parentNode.innerHTML=\'\'"><b>' + m[0] + "</b><span>" +
    m[1] + "</span></div>";
  clearTimeout(TWT);
  TWT = setTimeout(function () {
    el.innerHTML = ""
  }, 5000)
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

function llm(q, c, w) {
  return new Promise(function (res, rej) {
    var id = ++ LI;
    LQ[id] = [res, rej];
    parent.postMessage({ llm: { id: id, q: q, ctx: c, web: w } }, "*");
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

function aiH(x) {
  var ps = String(x || "").trim().split(/\n{2,}/).map(function (p) {
    return '<p style="margin:0 0 8px;line-height:1.7">' + E(p).replace(/\n/g, "<br>") + "</p>"
  }).join("");
  return '<span class="chip n">General answer · AI, not from your modules</span><div style="margin:10px 0 4px">' +
    ps + '</div><p class="sm" style="margin:0">Your modules didn’t cover this. The AI can’t browse the web, so verify important facts.</p>'
}

function netUpd(first) {
  var m = rd(), l = lvOf(m), prev = NET.lv;
  if (!first && !S.sim && l === "off" && prev !== "off" && NET.bad < 1) {
    NET.bad++;
    return
  }
  NET.bad = 0;
  var t = (m === -1 || m === null) ? m : Math.round(m * 10 / 1) / 10;
  if (!first && l === NET.lv && t === NET.mbps) return;
  var lc = l !== NET.lv;
  NET.lv = l;
  NET.mbps = t;
  S.on = l !== "off";
  if (first) return;
  if (prev !== l) tw(l, prev);
  if (lc) {
    if (S.scr === "app") render()
  } else {
    var b = D.querySelector('button[aria-label^="Connection"]');
    if (b) b.outerHTML = netH()
  }
}
var _RR = render;
render = function () {
  var a = D.activeElement, id = a && a.id, ok = a && (a.tagName === "TEXTAREA" || (a.tagName === "INPUT" &&
    a.type !== "file" && a.type !== "checkbox" && a.type !== "range")), v = ok ? a.value : null, s1 = ok ? a.selectionStart : 0,
    s2 = ok ? a.selectionEnd : 0;
  if (typeof S !== "undefined" && S.scr === "reg" && typeof gather === "function") gather();
  _RR();
  if (ok && id) {
    var n = $(id);
    if (n && n !== a) {
      n.value = v;
      n.focus();
      try {
        n.setSelectionRange(s1, s2)
      } catch (x) {}
    }
  }
};

function bot(s) {
  return '<svg width="' + s + '" height="' + Math.round(s * 1.1) + '" viewBox="0 0 40 44" style="flex-shrink:0;display:block" role="img" aria-label="LearnLink AI"><line x1="20" y1="8.5" x2="20" y2="4" stroke="#FFB800" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="3.6" r="2.6" fill="#FFB800" stroke="#fff" stroke-width="1"/><path d="M3 26A17 17 0 0 1 37 26Z" fill="#002583"/><path d="M3 26A17 17 0 0 0 37 26Z" fill="#FFB800"/><circle cx="20" cy="26" r="17" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="14" cy="22" r="3.6" fill="#fff"/><circle cx="26" cy="22" r="3.6" fill="#fff"/><circle cx="14.8" cy="22.6" r="1.9" fill="#0A1A45"/><circle cx="26.8" cy="22.6" r="1.9" fill="#0A1A45"/><circle cx="15.4" cy="21.8" r=".7" fill="#fff"/><circle cx="27.4" cy="21.8" r=".7" fill="#fff"/><circle cx="9.5" cy="31.5" r="2.2" fill="#F08A24" opacity=".55"/><circle cx="30.5" cy="31.5" r="2.2" fill="#F08A24" opacity=".55"/><path d="M15.5 31Q20 35.5 24.5 31" fill="none" stroke="#0A1A45" stroke-width="2.2" stroke-linecap="round"/></svg>'
}

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
render();

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
// Turn the model's text into safe HTML. [1] becomes a button that opens that source.
function pbody(text, mi, caret) {
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
var _askBase = ask;
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
  var M = null, text = "", mi = -1, live = false, finished = false;
  var guard = setTimeout(function () {
    if (!M) fail("no_server")
  }, 25000);
  // the server answers with its first event within seconds
  function slot() {
    return CH.indexOf(ty)
  }
  function fail(code) {
    if (finished) return;
    finished = true;
    clearTimeout(guard);
    var i = slot();
    if (i > -1) CH[i] = {
      h: '<span class="chip w">Can’t reach LearnLink</span><p style="margin:10px 0 0;line-height:1.7">' + (code === "no_server" ? "The LearnLink server isn’t running for this page. If you are using VS Code Live Server (port 5500), that is the problem: run npm start in the learnlink folder and open http://localhost:3000 instead." : code === "model_unreachable" ||
        code === "timeout" ? "The AI model isn’t answering right now. Make sure Ollama is running on the server, then try again." : code === "too_many_requests" ? "You are asking very quickly. Wait a few seconds and try again." : code === "not_logged_in" ? "Your session ended. Log out and log in again." : "Something went wrong (" +
        E(code) + "). Try again in a moment.") + "</p>"
    };
    BZ = 0;
    render()
  }
  streamAsk(q, history, function (ev) {
    if (finished) return;
    if (ev.type === "meta") {
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
        CH[i] = { h: finalH(M, text, mi), t: M.mode === "none" ? "" : text };
        saveTurn(q, text, M, ev.timings, CH[i]);
        if (M.mode === "grounded" && /\[\d+\]/.test(text)) {
          S.mi = mi;
          S.pn = true;
          S.hn = 0
        }
      }
      BZ = 0;
      render()
    } else if (ev.type === "error") fail(ev.error)
  });
};

document.addEventListener("click", function (e) {
  if (innerWidth > 760 || !S.sb || S.scr !== "app") return;
  var t = e.target;
  if (t.closest && (t.closest("#sb") || t.closest('[aria-label="Menu"]'))) return;
  S.sb = false;
  render()
}, true);
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

// The page stays hidden (gate.js) until the account and real course list are in, so sample courses never flash.
if (S.scr === "app") {
  if (LIVE) Promise.all([loadSession(true), loadCourses(true)]).then(LL_ready, function (e) {
    LL_authError(e) ? LL_toLogin() : LL_fail();
  });
  else { loadSession(); loadCourses() }
  loadChats()
} else if (window.LL_ready) LL_ready();

/* ===== Appearance: System / Light / Dark (saved on this device only) ===== */
var THEMES = [["system", "System"], ["light", "Light"], ["dark", "Dark"]];

function themeGet() {
  try { return localStorage.getItem("ll_theme") || "system" } catch (e) { return "system" }
}

function themeApply(t) {
  [document, (function () { try { return window.parent !== window ? parent.document : null } catch (e) { return null } })()].forEach(function (d) {
    if (!d) return;
    if (t === "system") d.documentElement.removeAttribute("data-theme");
    else d.documentElement.setAttribute("data-theme", t)
  })
}

function themeSet(t) {
  try { localStorage.setItem("ll_theme", t) } catch (e) {}
  themeApply(t);
  render()
}

function themeCard() {
  var cur = themeGet();
  return '<div class="card"><b>Appearance</b><p class="sm" style="margin:2px 0 10px">Choose how LearnLink looks on this device. System follows your phone or computer.</p><div class="seg" role="radiogroup" aria-label="Theme">' +
    THEMES.map(function (x) {
      return '<button role="radio" aria-checked="' + (cur === x[0]) + '" class="' + (cur === x[0] ? "on" : "") + '" onclick="themeSet(\'' + x[0] + '\')">' + x[1] + "</button>"
    }).join("") + "</div></div>"
}

/* ===== Password: change it here with the current password (forgot it? "Forgot password?" on the login page) ===== */
function pwCard() {
  return '<div class="card"><b>Password</b><p class="sm" style="margin:2px 0 10px">Change the password you use to log in.</p>' +
    '<div id="pwf" style="display:none"><label class="sm" for="sp0">Current password</label><input id="sp0" type="password" autocomplete="current-password" style="width:100%;margin:4px 0 10px">' +
    '<label class="sm" for="sp1">New password</label><input id="sp1" type="password" autocomplete="new-password" style="width:100%;margin:4px 0 2px">' +
    '<div class="sm" style="margin:0 0 10px">At least 8 characters with a letter and a number.</div>' +
    '<label class="sm" for="sp2">Confirm new password</label><input id="sp2" type="password" autocomplete="new-password" style="width:100%;margin:4px 0 8px" onkeydown="if(event.key===\'Enter\')stPw()"></div>' +
    '<button id="spb" onclick="stPw()">Change password</button><p class="sm" id="spm" style="margin:8px 0 0"></p></div>';
}
function stPw() {
  var f = $("pwf"), m = $("spm");
  if (f.style.display === "none") { f.style.display = ""; $("spb").textContent = "Save new password"; $("spb").className = "p"; $("sp0").focus(); m.textContent = ""; return; }
  var a = $("sp0").value, b = $("sp1").value, c = $("sp2").value;
  m.style.color = "var(--er)";
  if (!a) { m.textContent = "Enter your current password."; return; }
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(b)) { m.textContent = "Use at least 8 characters with a letter and a number."; return; }
  if (b !== c) { m.textContent = "The new passwords don’t match."; return; }
  $("spb").textContent = "Saving…";
  fetch("/api/db/auth?action=change_password", { method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "learnlink" },
    body: JSON.stringify({ current: a, password: b }) }).then(function (r) {
    return r.json().catch(function () { return { error: "server" }; }).then(function (j) { if (!r.ok || j.error) throw j; return j; });
  }).then(function () {
    f.style.display = "none"; ["sp0", "sp1", "sp2"].forEach(function (i) { $(i).value = ""; });
    $("spb").textContent = "Change password"; $("spb").className = "";
    m.style.color = "var(--ok,#1f7a4a)"; m.textContent = "Password changed. Use it next time you log in.";
  }, function (e) {
    $("spb").textContent = "Save new password";
    m.textContent = { wrong_password: "Your current password is wrong.", weak_password: "Use at least 8 characters with a letter and a number.",
      same_password: "Choose a password different from your current one." }[e && e.error] || "Could not reach the server.";
  });
}

var _setVTheme = setV;
setV = function () {
  var o = _setVTheme();
  // show the full school email, and put Appearance above "Privacy and my data"
  if (R.em && R.em.indexOf("@") < 0) o.h = o.h.replace('font-weight:700;word-break:break-word">' + E(R.em) + "<", 'font-weight:700;word-break:break-word">' + E(R.em) + "@bisu.edu.ph<");
  o.h = o.h.replace('<div class="card"><b>Privacy and my data</b>', themeCard() + pwCard() + '<div class="card"><b>Privacy and my data</b>');
  return o
};
themeApply(themeGet());
render();


/* ===== My data (Data Privacy Act, RA 10173): download everything, or delete all chats ===== */
function dataMsg(t) {
  var e = $("dmsg");
  if (e) e.textContent = t;
}
function dataExport() {
  fetch("/api/db/chats?action=export").then(function (r) {
    if (!r.ok) throw r;
    return r.blob();
  }).then(function (b) {
    var a = D.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = "learnlink-my-data-" + new Date().toISOString().slice(0, 10) + ".json";
    D.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href) }, 4000);
    dataMsg("Downloaded: your profile, all your chats, and the ratings you gave.");
  }, function () {
    dataMsg("Couldn’t reach the server. Try again on the campus network.");
  });
}
function dataDelete() {
  if (!confirm("Delete all your chats? Your questions, LearnLink's answers and your ratings will be removed for good. Your account stays.")) return;
  api("chats?action=delete_all", {}).then(function (j) {
    HL = []; CH = []; MS = []; chatId = null; H = [];
    render();
    dataMsg(j.deleted ? "Deleted " + j.deleted + " chat" + (j.deleted === 1 ? "" : "s") + "." : "You had no saved chats.");
  }, function () {
    dataMsg("Couldn’t reach the server. Nothing was deleted.");
  });
}


/* ==========================================================================
   Real sign-up (two steps)
   1. Prove it's your BISU email: "Continue with Google", or a code your teacher / the admin reads out to you.
   2. Your details, password, and one consent checkbox right before "Create account".
   After that you log in with email + password over the campus network, internet or not.
   ========================================================================== */
var GS = { opts: null, sent: false, busy: false, terms: false };
var GLOGO = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
var REGERR = {
  bad_email: "Only BISU emails are accepted. Use name@bisu.edu.ph",
  email_taken: "That email already has an account. Log in instead.",
  not_on_roster: "That email isn’t on any class list linked to LearnLink yet. Ask your teacher to link your Classroom class.",
  bad_code: "That code doesn’t match. Check it with your teacher and try again.",
  code_expired: "That code has expired. Ask for a new one.",
  too_many_tries: "Too many wrong tries. Ask for a new code.",
  verify_first: "Your email check timed out. Please verify your email again.",
  weak_password: "Use at least 8 characters with a letter and a number",
  missing_name: "Enter your full name",
  must_agree: "Please agree to the terms to create your account",
  php_unreachable: "Can’t reach the campus server. Check that you’re on the campus Wi‑Fi.",
  server_error: "The database isn’t updated yet. On the server PC, run: php database/setup.php",
  unknown_action: "The server files are older than this page. Replace the whole learnlink folder, then run: php database/setup.php"
};
function regErr(x) {
  return REGERR[x && x.error] || "Something went wrong. Is the campus server running?";
}
// Google can only send people back to the address it was set up with, so only offer it where that works.
function gOk() {
  var o = GS.opts;
  if (!o || !o.google) return false;
  try { return new URL(o.redirect).origin === location.origin } catch (e) { return false }
}
function gStart() {
  top.location.href = "/api/db/auth?action=google_start&for=signup";
}

dots = function () {
  var n = ["Verify your email", "Your details"];
  return '<div style="display:flex;gap:6px;margin-bottom:16px">' + n.map(function (x, i) {
    var d = i + 1 < S.st, c = i + 1 === S.st;
    return '<div style="flex:1;text-align:center;font-size:12px;color:' + (c ? "var(--ac)" : "var(--t3)") +
      '"><div style="height:4px;border-radius:2px;background:' + (d || c ? "var(--ac)" : "var(--bd)") + ';margin-bottom:4px"></div>' + x + "</div>";
  }).join("") + "</div>";
};

gather = function () {
  ["nm", "sid", "em", "col", "prg", "yr", "sec", "pw", "pw2"].forEach(function (k) {
    var e = $(k);
    if (e) R[k] = e.value.trim();
  });
};

reg = function () {
  var b = "", foot = "";
  S.st = R.vem ? 2 : 1;
  if (S.st === 1) {
    b = '<h2 style="margin:0">Create your account</h2><p class="sm" style="margin:2px 0 14px">First, show us it’s really your BISU email.</p>' +
      (gOk() ? '<button onclick="gStart()" style="width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:11px;font-weight:700;background:#fff;color:#1f1f1f;border:1px solid #dadce0">' +
        GLOGO + "Continue with BISU Google</button>" +
        '<div style="display:flex;align-items:center;gap:10px;margin:16px 0 4px;color:var(--t3);font-size:12px"><span style="flex:1;height:1px;background:var(--bd)"></span>or use a code<span style="flex:1;height:1px;background:var(--bd)"></span></div>' : "");
    if (!GS.sent) {
      b += '<label for="em">School email</label><input id="em" type="email" inputmode="email" autocomplete="email" placeholder="name@bisu.edu.ph" value="' +
        E(R.em) + '" style="width:100%" oninput="emIn(this)" onblur="emDone(this)" onkeydown="if(event.key===\'Enter\')askCode()">';
      foot = '<button class="p" style="width:100%" onclick="askCode()"' + (GS.busy ? " disabled" : "") + ">" + (GS.busy ? "Asking…" : "Get a code") + "</button>";
    } else {
      var who = (GS.teacher ? "your teacher and " : "") + "the campus admin";
      b += '<div style="background:var(--acb);color:var(--ac);padding:10px 12px;border-radius:12px;margin:8px 0 12px;font-size:13px">' +
        (GS.emailed ? "<b>We emailed a code to " + E(R.em) + "</b><br>Check your BISU inbox (and Spam). No email? " + who.charAt(0).toUpperCase() + who.slice(1) +
          " can also see the code in LearnLink. It works for 2 hours." :
          "<b>Code ready for " + E(R.em) + "</b><br>" + (GS.mail ? "We couldn’t email it right now (no internet). " : "") +
          "The code shows up inside LearnLink for " + who + ". Ask them for it and bring your school ID. It works for 2 hours.") + "</div>" +
        '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px" id="bx">' +
        '<input class="cb" inputmode="numeric" maxlength="1" aria-label="Code digit" oninput="cin(this)">'.repeat(6) + "</div>";
      foot = '<button class="p" style="width:100%" onclick="vfy()">Verify</button><p class="sm" style="text-align:center;margin:10px 0 0">' +
        '<a href="#" onclick="GS.sent=false;GS.sent0=false;render();return false" style="color:var(--ac)">Use a different email</a> · ' +
        '<a href="#" onclick="askCode();return false" style="color:var(--ac)">Ask again</a></p>';
    }
  } else {
    var pr = COL[R.col] || [];
    b = '<h2 style="margin:0">Your details</h2><p class="sm" style="margin:2px 0 6px">BISU Balilihan Campus</p>' +
      '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:2px 8px;padding:8px 12px;border-radius:12px;background:var(--acb);color:var(--ac);font-size:13px;font-weight:700"><span style="word-break:break-all">✓ ' +
      E(R.vem) + '</span><span style="font-weight:400;margin-left:auto;white-space:nowrap">' + (R.via === "google" ? "verified with Google" : "verified") + "</span></div>" +
      fld("nm", "Full name", "text", "Maria Santos") + fld("sid", "Student ID", "text", "2024-00123") +
      sel("col", "College", Object.keys(COL), "Select your college") + sel("prg", "Program", pr, pr.length ? "Select your program" : "Select a college first") +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div>' + sel("yr", "Year level", ["1st year", "2nd year", "3rd year", "4th year"], "Select") +
      "</div><div>" + sel("sec", "Section", ["A", "B", "C", "D", "E", "F"], "Select") + "</div></div>" +
      fld("pw", "Password", "password", "", "At least 8 characters with a letter and a number. You’ll use it to log in on campus Wi‑Fi.") +
      fld("pw2", "Confirm password", "password") +
      '<label style="display:flex;gap:10px;align-items:flex-start;margin:16px 0 0;font-size:13px;color:var(--tx);cursor:pointer"><input id="ag" type="checkbox"' + (R.ag === true ? " checked" : "") +
      ' style="width:18px;height:18px;margin-top:1px;padding:0;flex-shrink:0" onchange="R.ag=this.checked;$(\'e\').textContent=\'\'"><span>I agree to the ' +
      '<a href="#" onclick="event.preventDefault();GS.terms=!GS.terms;$(\'tx\').style.display=GS.terms?\'\':\'none\'" style="color:var(--ac);font-weight:700">Terms of Use, Data Privacy notice and course materials rules</a></span></label>' +
      '<div id="tx" style="' + (GS.terms ? "" : "display:none;") + 'border:1.5px solid var(--bd);border-radius:12px;padding:4px 12px;margin-top:8px;font-size:13px">' + AGS.map(function (a) {
        return '<p style="margin:8px 0"><b>' + a[0] + '</b><br><span style="color:var(--t2)">' + a[1] + "</span></p>";
      }).join("") + "</div>";
    foot = '<button class="p" style="width:100%" onclick="mkAcct()"' + (GS.busy ? " disabled" : "") + ">" + (GS.busy ? "Creating your account…" : "Create account") + "</button>";
  }
  return '<div class="au"><div class="card">' + dots() + b + '<p class="er" id="e"></p><div style="margin-top:10px">' + foot + "</div>" +
    (S.st === 1 ? '<p class="sm" style="text-align:center;margin-top:14px">Already have an account? <a href="#" onclick="parent.postMessage(\'logout\',\'*\');return false" style="color:var(--ac)">Log in</a></p>' :
      '<p class="sm" style="text-align:center;margin-top:14px">Not you? <a href="#" onclick="R.vem=\'\';GS.sent=false;render();return false" style="color:var(--ac)">Start over</a></p>') +
    "</div></div>";
};

function askCode() {
  gather();
  if (R.em && R.em.indexOf("@") < 0) R.em += "@bisu.edu.ph";
  if (!/^[^\s@]+@bisu\.edu\.ph$/i.test(R.em)) {
    $("e").textContent = REGERR.bad_email;
    return;
  }
  GS.busy = true;
  render();
  api("auth?action=signup_start", { email: R.em }).then(function (j) {
    GS.busy = false;
    GS.sent = true;
    GS.teacher = j.teacher;
    if (j.emailed || !GS.sent0) GS.emailed = j.emailed;   // "Ask again" within a minute keeps the earlier status
    GS.mail = j.mail;
    GS.sent0 = true;
    render();
    var b = D.querySelector("#bx input");
    if (b) b.focus();
  }, function (x) {
    GS.busy = false;
    render();
    $("e").textContent = regErr(x);
  });
}

vfy = function () {
  var b = [].slice.call(D.querySelectorAll("#bx input")), v = b.map(function (x) {
    return x.value;
  }).join("");
  if (v.length < 6) {
    $("e").textContent = "Enter all 6 digits";
    return;
  }
  api("auth?action=signup_verify", { email: R.em, code: v }).then(function (j) {
    R.vem = j.email;
    R.via = "code";
    if (j.name && !R.nm) R.nm = j.name;
    GS.sent = false;
    render();
  }, function (x) {
    b.forEach(function (i) { i.value = "" });
    b[0].focus();
    $("e").textContent = regErr(x) + (x && x.error === "bad_code" && x.left > 0 ? " (" + x.left + " tr" + (x.left === 1 ? "y" : "ies") + " left)" : "");
  });
};

function mkAcct() {
  gather();
  var e = "";
  if (R.nm.length < 3) e = REGERR.missing_name;
  else if (R.sid.length < 5) e = "Enter your student ID, like 2024-00123";
  else if (!R.col || !R.prg || !R.yr || !R.sec) e = "Select your college, program, year, and section";
  else if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(R.pw)) e = REGERR.weak_password;
  else if ($("pw2").value !== R.pw) e = "Passwords don’t match. Try again";
  else if (R.ag !== true) e = REGERR.must_agree;
  if (e) {
    $("e").textContent = e;
    return;
  }
  GS.busy = true;
  render();
  api("auth?action=register", { name: R.nm, password: R.pw, student_id: R.sid, college: R.col, program: R.prg, year_level: R.yr, section: R.sec, agree: true }).then(function () {
    GS.busy = false;
    R.pw = ""; R.pw2 = "";
    S.v = "home";
    go("app");
    loadSession();
    loadCourses();
    loadChats();
  }, function (x) {
    GS.busy = false;
    if (x && x.error === "verify_first") R.vem = "";
    render();
    $("e").textContent = x && x.error === "email_taken" ? REGERR.email_taken : regErr(x);
  });
}

// On the sign-up page: what's on offer, and whether we just came back from Google with a verified email.
if (S.scr === "reg") {
  S.st = 1;
  api("auth?action=options").then(function (o) { GS.opts = o; }, function () {}).then(function () {
    return api("auth?action=signup_state");
  }).then(function (s) {
    if (s && s.email) {
      R.vem = s.email;
      R.em = s.email;
      R.via = s.via;
      if (s.name && !R.nm) R.nm = s.name;
    }
  }, function () {}).then(render);
}
