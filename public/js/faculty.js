/* ==========================================================================
       1. Utility Helpers, State & User Profile Setup
       ========================================================================== */
var D = document;
var $ = function (i) {
  return D.getElementById(i);
};
var E = function (s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
};
var EA = function (s) {
  return E(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};

// Validates and loads saved user session ensuring @bisu.edu.ph domain
function getInitialUser() {
  try {
    var saved = localStorage.getItem("learnlink_user");
    if (saved) {
      var user = JSON.parse(saved);
      if (user.email && user.email.toLowerCase().endsWith("@bisu.edu.ph")) {
        return user;
      }
    }
  } catch (e) {}

  // Default safe fallback
  return { name: "Faculty Member", email: "faculty@bisu.edu.ph" };
}

// Get initials for the user avatar badge
function getInitials(name) {
  if (!name) return "FC";
  var parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function mk(t) {
  return t.map(function (x, i) {
    return { t: "Module " + (i + 1) + ": " + x, pub: i < 3, f: [{ n: x.split(" ")[0] + " Module " + (i + 1) +
      ".pdf", st: "ready" }] };
  });
}

var ST = [["Ana Reyes", "2024-00311"], ["Jose Dela Cruz", "2024-00287"], ["Mika Tan", "2024-00342"]];

// Sample answers shown in the "Test chat" tab, one list per module
var IAS = [
  [
    "Information assurance protects how information is used, stored, and shared.",
    "It combines technology, people, and policy."
  ],
  [
    "The CIA triad covers confidentiality, integrity, and availability.",
    "Integrity keeps data accurate and unaltered."
  ],
  ["Risk is the chance that a threat exploits a weakness.", "Responses include accept, reduce, transfer, and avoid."],
  [
    "Encryption turns readable data into unreadable data using a key.",
    "Hashing creates a fingerprint used to check integrity."
  ]
];

var NSA = [
  ["Networks connect devices so they can share data.", "The OSI and TCP/IP models describe the layers involved."],
  ["A firewall filters traffic using rules.", "Rules allow or block traffic by address, port, or protocol."],
  [
    "A VPN sends encrypted traffic through a tunnel between two points.",
    "It protects data that crosses untrusted networks."
  ],
  [
    "An intrusion detection system watches traffic for suspicious activity.",
    "It raises an alert when something matches a known attack pattern."
  ]
];

/* Each section has its own materials, join requests and (sample) question stats.
       q7 = questions per day for the last 7 days (oldest first), mp = % answered from modules,
       top = [topic, asks, module index], gaps = [topic, asks], poor = [question, reason, count, module index],
       use = module usage %, kw = what each module answers (used by the Test chat). */
var CS = [
  {
    n: "Information Assurance",
    s: "BSIT 3C",
    st: 42,
    code: "IA3C-7K2P",
    open: true,
    req: ST.slice(),
    mods: mk(["Introduction to Information Assurance", "Security Principles", "Risk Management", "Cryptography Basics"]),
    q7: [14, 19, 17, 22, 18, 15, 23],
    mp: 86,
    top: [["CIA triad", 34, 1], ["Risk management", 21, 2], ["Encryption", 18, 3], ["Hashing", 11, 3]],
    gaps: [["Penetration testing basics", 9], ["Incident response steps", 6]],
    poor: [
      ["Why is the CIA triad important?", "Missing source", 4, 1],
      ["Encryption explanation", "Doesn’t match my notes", 3, 3]
    ],
    use: [18, 42, 26, 14],
    ans: IAS,
    kw: [
      /information assurance|intro/,
      /cia|confidential|integrity|availab|security/,
      /risk|threat/,
      /encrypt|hash|crypto/
    ],
    sug: ["What is the CIA triad?", "What is a firewall?", "How do I manage risk?"]
  },
  {
    n: "Information Assurance",
    s: "BSIT 3B",
    st: 38,
    code: "IA3B-4M9Q",
    open: true,
    req: [["Lia Gomez", "2024-00298"]],
    mods: mk(["Introduction to Information Assurance", "Security Principles", "Risk Management", "Cryptography Basics"]),
    q7: [9, 12, 11, 14, 10, 8, 13],
    mp: 82,
    top: [["CIA triad", 22, 1], ["Risk management", 15, 2], ["Encryption", 12, 3], ["Hashing", 7, 3]],
    gaps: [["Penetration testing basics", 5]],
    poor: [["Explain risk transfer", "Answer was too short", 2, 2]],
    use: [22, 38, 24, 16],
    ans: IAS,
    kw: [
      /information assurance|intro/,
      /cia|confidential|integrity|availab|security/,
      /risk|threat/,
      /encrypt|hash|crypto/
    ],
    sug: ["What is the CIA triad?", "What is risk transfer?", "What is hashing?"]
  },
  {
    n: "Network Security",
    s: "BSIT 4A",
    st: 35,
    code: "NS4A-2X8D",
    open: true,
    req: [],
    mods: mk(["Network Fundamentals", "Firewalls", "VPN and Tunnels", "Intrusion Detection"]),
    q7: [6, 8, 7, 10, 9, 5, 8],
    mp: 79,
    top: [["Firewall rules", 14, 1], ["VPN", 11, 2], ["Intrusion detection", 9, 3], ["TCP/IP layers", 6, 0]],
    gaps: [["Wireless security", 5]],
    poor: [],
    use: [30, 28, 24, 18],
    ans: NSA,
    kw: [/network|tcp|osi|layer/, /firewall/, /vpn|tunnel/, /intrusion|ids\b|detect/],
    sug: ["What is a firewall?", "How does a VPN work?", "What is wireless security?"]
  }
];

// Global Application State
var S = {
  v: "home",
  ci: 0,
  tab: "mat",
  sb: innerWidth > 760,
  pm: false,
  rng: 7,
  tc: [],
  hq: "",
  // home: search text
  hs: "name",
  // home: sort
  mq: "",
  // materials: search text
  mf: "all",
  // materials: filter
  mc: {},
  // materials: collapsed modules ("course-module": true)
  eq: "",
  // enrollment: search text
  currentUser: getInitialUser()
};

/* Dynamic user setting with strict @bisu.edu.ph email validation */
function setCurrentUser(name, email) {
  if (!email || !email.toLowerCase().endsWith("@bisu.edu.ph")) {
    toast("Access denied: Only @bisu.edu.ph emails are allowed.");
    return false;
  }

  S.currentUser = { name: name, email: email };
  try {
    localStorage.setItem("learnlink_user", JSON.stringify(S.currentUser));
  } catch (e) {}

  toast("Welcome, " + name + "!");
  render();
  return true;
}

/* ==========================================================================
       2. Helper Functions & UI Controllers
       ========================================================================== */
function C() {
  return CS[S.ci];
}

function toast(t) {
  var e = $("toast");
  e.textContent = t;
  e.className = "show";
  clearTimeout(toast.t);
  toast.t = setTimeout(function () {
    e.className = "";
  }, 2200);
}

function pend() {
  return CS.reduce(function (a, c) {
    return a + c.req.length;
  }, 0);
}

function mob() {
  if (innerWidth <= 760) S.sb = false;
}

function sum(a, f) {
  return a.reduce(function (x, y) {
    return x + f(y);
  }, 0);
}

function live(c) {
  return c.mods.filter(function (m) {
    return m.pub;
  }).length;
}

function issues(c) {
  return sum(c.mods, function (m) {
    return m.f.filter(function (f) {
      return f.st === "fail";
    }).length;
  });
}

function qWeek(c) {
  return sum(c.q7, function (x) {
    return x;
  });
}

function poorN(c) {
  return sum(c.poor, function (p) {
    return p[2];
  });
}

function lbl(c) {
  return "<b>" + E(c.n) + '</b><div class="sm">' + E(c.s) + "</div>";
}

function greet() {
  var h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

// Open a course (optionally on a given tab, with a materials filter)
function openC(i, tab, f) {
  closeM();
  if (S.v !== "course" || S.ci !== i) {
    S.tc = [];
    S.mq = "";
    S.mf = "all";
    S.eq = "";
  }
  S.v = "course";
  S.ci = i;
  S.tab = tab || "mat";
  if (f) S.mf = f;
  mob();
  render();
  var sc = D.querySelector(".sc");
  if (sc) sc.scrollTop = 0;
}

// Jump to one module in Materials and highlight it
function goMat(ci, mi) {
  delete S.mc[ci + "-" + mi];
  S.mq = "";
  S.mf = "all";
  openC(ci, "mat");
  setTimeout(function () {
    flash("m" + mi);
  }, 40);
}

function flash(id) {
  var e = $(id);
  if (!e) return;
  e.scrollIntoView({ behavior: "smooth", block: "center" });
  e.classList.add("flash");
  setTimeout(function () {
    e.classList.remove("flash");
  }, 1900);
}

/* ---- Pop-up windows ---- */
function openM(h, w) {
  tipOff();
  $("mdh").innerHTML = '<div class="mdb" onclick="if(event.target===this)closeM()"><div class="mdl' + (w ? " wide" : "") +
    '" role="dialog" aria-modal="true" tabindex="-1">' + h + "</div></div>";
  var f = $("mdh").querySelector("input") || $("mdh").querySelector(".mdl");
  if (f) f.focus();
}

var VU = null;

function closeM() {
  $("mdh").innerHTML = "";
  if (VU) {
    URL.revokeObjectURL(VU);
    VU = null;
  }
}

function mhead(t, x) {
  return '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px"><div><h3 style="font-size:18px">' +
    E(t) + "</h3>" + (x || "") + '</div><button class="g" aria-label="Close" onclick="closeM()">✕</button></div>';
}

function mfoot(l, r) {
  return '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:18px"><button onclick="closeM()">Close</button>' +
    (l || "") + (r || "") + "</div>";
}

D.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && $("mdh").innerHTML) closeM();
});

// Rows with a bar. "bars" rows are clickable, "barsD" rows are display only.
function bars(items, total) {
  return items.map(function (it) {
    return '<button class="rowb" onclick="' + it[2] + '"><span class="rl">' + it[0] + '</span><span class="bar"><i style="width:' +
      (total ? it[1] / total * 100 : 0) + '%"></i></span><b class="rv">' + it[1] + '</b><span class="ar">›</span></button>';
  }).join("");
}

function barsD(items, total) {
  return items.map(function (it) {
    return '<div class="rowb rowd"><span class="rl">' + it[0] + '</span><span class="bar"><i style="width:' +
      (total ? it[1] / total * 100 : 0) + '%"></i></span><b class="rv">' + it[1] + "</b></div>";
  }).join("");
}

/* ==========================================================================
       3. Questions-per-day Data & Chart
       ========================================================================== */
function add(a, b) {
  return a + b;
}

// One course: last 7 days are real sample data; 30 days is built around them
function cser(c, n) {
  var now = new Date(), a = [], i;
  var mkd = function (t, k) {
    return { d: new Date(now.getFullYear(), now.getMonth(), now.getDate() - k), t: t, m: Math.round(t * c.mp / 100) };
  };
  if (n === 7) return c.q7.map(function (t, i) {
    return mkd(t, 6 - i);
  });

  var tot7 = c.q7.reduce(add, 0), tgt = Math.round(tot7 * 3.6) - tot7, raw = [], rs = 0, x;
  for (i = 0; i < 23; i++) {
    x = 1 + .25 * Math.sin(i * .7 + c.q7[0]) + .1 * Math.cos(i * 1.9);
    raw.push(x);
    rs += x;
  }
  var v = raw.map(function (y) {
    return Math.round(y * tgt / rs);
  });
  v[11] += tgt - v.reduce(add, 0);
  for (i = 0; i < 23; i++) a.push(mkd(v[i], 29 - i));
  for (i = 0; i < 7; i++) a.push(mkd(c.q7[i], 6 - i));
  return a;
}

// All courses added together
function aser(n) {
  var all = CS.map(function (c) {
    return cser(c, n);
  });
  return all[0].map(function (x, i) {
    return {
      d: x.d,
      t: sum(all, function (s) {
        return s[i].t;
      }),
      m: sum(all, function (s) {
        return s[i].m;
      })
    };
  });
}

function pc(x) {
  return Math.round(x.m / x.t * 100);
}

function dl(d) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function rngSeg() {
  return '<div class="seg" style="margin:0">' + [7, 30].map(function (n) {
    return '<button class="' + (S.rng === n ? "on" : "") + '" onclick="S.rng=' + n + ';render()">Last ' +
      n + " days</button>";
  }).join("") + "</div>";
}

var CH = { s: [], sc: -1 };

function qchart(sr, sc) {
  CH.s = sr;
  CH.sc = sc;
  var n = sr.length, big = n > 7, gap = big ? 3 : 10, g = "", y = "", h = "", xl = "", i;
  var mx = Math.max.apply(null, sr.map(function (x) {
    return x.t;
  }));
  var step = [2, 5, 10, 20, 25, 50, 100, 200].filter(function (s) {
    return s * 3 >= mx;
  })[0] || Math.ceil(mx / 300) * 100;
  var ym = step * 3;

  for (i = 0; i <= 3; i++) {
    g += '<div class="qg" style="bottom:' + (i * 100 / 3) + '%"></div>';
    y += '<span style="bottom:' + (i * 100 / 3) + '%">' + step * i + "</span>";
  }

  sr.forEach(function (x, i) {
    var o = x.t - x.m, show = big ? (n - 1 - i) % 5 === 0 : true;
    h += '<button class="qcol" aria-label="' + EA(dl(x.d)) + ": " + x.t + " questions, " + pc(x) + '% from modules. Open details" onmouseenter="tipOn(event,' +
      i + ')" onmousemove="tipMv(event)" onmouseleave="tipOff()" onclick="dayM(' + i + ')">' + '<span class="qs" style="height:' +
      (x.t / ym * 100).toFixed(1) + "%;width:" + (big ? 80 : 70) + '%">' + '<i style="height:' + (o / x.t * 100).toFixed(1) +
      '%;background:var(--sh)"></i>' + '<i style="height:' + (x.m / x.t * 100).toFixed(1) + '%;background:var(--ac)"></i></span></button>';
    xl += "<span>" + (show ? (i === n - 1 ? "Today" : x.d.toLocaleDateString("en-US", big ? { month: "short",
      day: "numeric" } : { weekday: "short" })) : "") + "</span>";
  });

  return '<div class="qc" style="--qgap:' + gap + 'px"><div class="qy">' + y + '</div><div class="qp">' +
    g + '<div class="qb">' + h + '</div></div></div>' + '<div class="qx" style="--qgap:' + gap + 'px"><div style="width:30px;flex-shrink:0"></div><div class="qxl">' +
    xl + "</div></div>";
}

function chartCard(sr, sc, title) {
  var T = sum(sr, function (x) {
    return x.t;
  }), M = sum(sr, function (x) {
    return x.m;
  });
  return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><b style="font-size:16px">' +
    title + '</b><div class="sm">' + T.toLocaleString() + " questions · " + Math.round(T / sr.length) + "/day average · " +
    Math.round(M / T * 100) + "% answered from your modules</div></div>" + rngSeg() + "</div>" + qchart(sr,
    sc) + '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px"><div style="display:flex;gap:14px;flex-wrap:wrap"><span class="lg"><i style="background:var(--ac)"></i>Answered from modules</span><span class="lg"><i style="background:var(--sh)"></i>Not in your modules</span></div><span class="sm">Click a bar for that day’s details</span></div></div>';
}

function tipOn(e, i) {
  var x = CH.s[i], t = $("tip");
  t.innerHTML = "<b>" + dl(x.d) + "</b><br>" + x.t + " questions · " + pc(x) + "% from modules";
  t.style.opacity = 1;
  tipMv(e);
}

function tipMv(e) {
  var t = $("tip");
  t.style.left = Math.max(6, Math.min(e.clientX + 12, innerWidth - t.offsetWidth - 6)) + "px";
  t.style.top = (e.clientY > 70 ? e.clientY - 54 : e.clientY + 18) + "px";
}

function tipOff() {
  var t = $("tip");
  if (t) t.style.opacity = 0;
}

function dayM(i) {
  var s = CH.s, x = s[i], p = s[i - 1], today = i === s.length - 1, cmp = "", per = "";
  if (p) {
    var df = p.t ? Math.round((x.t - p.t) / p.t * 100) : 0;
    cmp = '<div class="' + (df < 0 ? "dl neg" : "dl") + '" style="margin-top:2px">' + (df >= 0 ? "▲ " : "▼ ") +
      Math.abs(df) + "% vs the day before (" + p.t + ")</div>";
  }
  if (CH.sc < 0) {
    per = '<div class="mh">By section</div>' + bars(CS.map(function (c, ci) {
      return [lbl(c), cser(c, S.rng)[i].t, "openC(" + ci + ",'ins')"];
    }), x.t);
  }
  openM(mhead(dl(x.d) + (today ? " · Today" : ""), '<div class="sm">Questions students asked</div>') + '<div class="big2">' +
    x.t + "</div>" + cmp + '<div class="mh">Where the answers came from</div>' + barsD([["From your modules",
    x.m], ["Not in your modules", x.t - x.m]], x.t) + per + '<p class="sm" style="margin:12px 0 0">Totals only. You can’t see who asked what.</p>' +
    mfoot());
}

/* ==========================================================================
       4. Main Layout & Component Renderers
       ========================================================================== */
function app() {
  var user = S.currentUser;
  var userInitials = getInitials(user.name);

  var side = S.sb ? '<aside id="sb">' + '<button class="it' + (S.v === "home" ? " on" : "") + '" onclick="S.v=\'home\';mob();render()">Home</button>' +
    '<div class="lbl">My courses</div>' + CS.map(function (c, i) {
    return '<button class="it' + (S.v === "course" && S.ci === i ? " on" : "") + '" onclick="openC(' + i +
      ')">' + E(c.n) + '<div class="sm">' + E(c.s) + (c.req.length ? " · " + c.req.length + " new" : "") + '</div>' +
      '</button>';
  }).join("") + '<div style="margin-top:auto;border-top:1px solid var(--bd);padding-top:8px">' + '<button class="it' + (S.v === "settings" ? " on" : "") + '" onclick="openSet()">Settings</button>' +
    '</div>' + '</aside>' : "";

  var tb = '<div class="top">' + '<div style="display:flex;align-items:center;gap:8px">' + '<button class="g" aria-label="Menu" onclick="S.sb=!S.sb;render()" style="font-size:18px">☰</button>' +
    '<b>LearnLink</b>' + '<span class="chip">Faculty</span>' + '</div>' + '<button class="g" aria-label="Profile" onclick="event.stopPropagation();S.pm=!S.pm;render()" style="padding:2px">' +
    '<span style="display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--acb);color:var(--ac);font-weight:800;font-size:12px">' +
    E(userInitials) + '</span>' + '</button>' + '</div>';

  var dd = S.pm ? '<div class="dd">' + '<div style="cursor:default"><b>' + E(user.name) + '</b><br><span class="sm">' +
    E(user.email) + '</span></div>' + '<div onclick="S.pm=false;openSet()">My profile</div>' +
    '<div style="color:var(--er)" onclick="localStorage.removeItem(\'learnlink_user\');parent.postMessage(\'logout\',\'*\')">Log out</div>' +
    '</div>' : "";

  return '<div id="app" onclick="if(S.pm){S.pm=false;render()}">' + side + '<main>' + tb + (S.v === "home" ? home() : course()) +
    '</main>' + dd + '</div>';
}

/* ==========================================================================
       5. Home
       ========================================================================== */
function home() {
  var user = S.currentUser;
  var w = aser(7), td = w[6], yd = w[5], dq = yd.t ? Math.round((td.t - yd.t) / yd.t * 100) : 0;
  // with real data every course reports the same total (no enrollment yet), so don't add them up
  var stu = CS.length && CS[0].id ? Math.max.apply(null, CS.map(function (c) { return c.st; })) : sum(CS, function (c) {
    return c.st;
  });
  var lv = sum(CS, live), tm = sum(CS, function (c) {
    return c.mods.length;
  });
  var bad = sum(CS, issues);
  var firstReq = CS.findIndex(function (c) {
    return c.req.length;
  });
  var firstBad = CS.findIndex(function (c) {
    return issues(c) > 0;
  });

  var stat = function (fn, l, v, sub) {
    return '<button class="card stat" onclick="' + fn + '()"><div class="sm">' + l + '</div><div class="big">' +
      v + "</div>" + sub + '<div class="hint">View details</div></button>';
  };

  return '<div class="sc">' + '<h2 style="font-size:22px;margin-top:6px">' + greet() + ', ' + E(user.name) +
    ' ✨</h2>' + '<p style="color:var(--t2);margin:2px 0 14px">Here is how your course sections are doing.</p>' +
    (pend() ? '<div class="card" style="background:var(--bt);display:flex;justify-content:space-between;align-items:center;gap:10px">' +
    '<span><b>' + pend() + ' join request' + (pend() > 1 ? "s" : "") + ' waiting</b><br><span class="sm" style="color:var(--wt)">Students are asking to join your courses.</span></span>' +
    '<button class="p" onclick="openC(' + firstReq + ',\'enr\')">Review</button>' + '</div>' : "") + (bad ? '<div class="card" style="background:var(--erb);display:flex;justify-content:space-between;align-items:center;gap:10px">' +
    '<span><b>' + bad + ' file' + (bad > 1 ? "s" : "") + ' failed to process</b><br><span class="sm" style="color:var(--er)">Students can’t get answers from them until they are fixed.</span></span>' +
    '<button class="p" onclick="openC(' + firstBad + ',\'mat\',\'issue\')">Fix now</button>' + '</div>' : "") +
    '<div class="cg" style="margin-bottom:12px">' + stat("stuM", "Students", stu, '<div class="sm">' + CS.length +
    " sections</div>") + stat("reqM", "Join requests", pend(), pend() ? '<div class="dl" style="color:var(--wt)">Waiting for you</div>' : '<div class="dl">All caught up</div>') +
    stat("modM", "Modules live", lv + "/" + tm, '<div class="sm">' + (tm - lv) + " hidden</div>") + stat("qM",
    "Questions this week", sum(w, function (x) {
    return x.t;
  }), '<div class="' + (dq < 0 ? "dl neg" : "dl") + '">' + (dq >= 0 ? "+" : "") + dq + "% vs yesterday</div>") +
    "</div>" + '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin:6px 0 10px"><b style="font-size:16px">My sections</b>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><input id="hq" aria-label="Search sections" placeholder="Search sections" value="' +
    EA(S.hq) + '" oninput="S.hq=this.value;refH()" style="min-width:160px">' + '<select aria-label="Sort sections" onchange="S.hs=this.value;refH()">' +
    [["name", "Sort: Name"], ["stu", "Sort: Most students"], ["req", "Sort: Most requests"]].map(function (o) {
    return '<option value="' + o[0] + '"' + (S.hs === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
  }).join("") + "</select></div></div>" + '<div id="hl">' + hlist() + "</div>" + '<div style="margin-top:12px">' +
    chartCard(aser(S.rng), -1, "Questions per day · all sections") + "</div>" + '<div class="two">' + attnCard() +
    topCard() + "</div>" + '</div>';
}

function hlist() {
  var q = S.hq.toLowerCase().trim();
  var a = CS.map(function (c, i) {
    return { c: c, i: i };
  }).filter(function (x) {
    return !q || (x.c.n + " " + x.c.s).toLowerCase().indexOf(q) > -1;
  });
  a.sort(function (x, y) {
    return S.hs === "stu" ? y.c.st - x.c.st : S.hs === "req" ? y.c.req.length - x.c.req.length : (x.c.n +
      x.c.s).localeCompare(y.c.n + y.c.s);
  });
  if (!a.length) return '<div class="card" style="text-align:center;padding:24px"><b>No sections match</b><p class="sm">Try a different search.</p><button onclick="S.hq=\'\';render()">Clear search</button></div>';

  return '<div class="cg">' + a.map(function (x) {
    var c = x.c, i = x.i, lv = live(c), bad = issues(c);
    return '<div class="card click" role="button" tabindex="0" onclick="openC(' + i + ')" onkeydown="if(event.key===\'Enter\')openC(' +
      i + ')">' + '<b style="font-size:16px">' + E(c.n) + '</b>' + '<div class="sm">' + E(c.s) + '</div>' +
      '<p style="margin:10px 0 6px">' + c.st + (c.st === 1 ? " student · " : " students · ") + lv + " of " + c.mods.length + " modules live</p>" +
      '<div class="bar"><i style="width:' + (c.mods.length ? lv / c.mods.length * 100 : 0) + '%"></i></div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">' + (c.req.length ? '<button class="chip pr" onclick="event.stopPropagation();openC(' +
      i + ',\'enr\')">' + c.req.length + " pending</button>" : "") + (bad ? '<button class="chip fl" onclick="event.stopPropagation();openC(' +
      i + ',\'mat\',\'issue\')">' + bad + " failed file" + (bad > 1 ? "s" : "") + "</button>" : "") + (!c.open ? '<span class="chip fl">Requests closed</span>' : "") +
      '<span class="chip">' + qWeek(c) + " questions this week</span>" + "</div></div>";
  }).join("") + "</div>";
}

function refH() {
  if ($("hl")) $("hl").innerHTML = hlist();
}

// Things the teacher should look at next, most important first
function attnItems() {
  var a = [];
  CS.forEach(function (c, i) {
    var w = E(c.n) + " · " + E(c.s);
    if (issues(c)) a.push({
      w: 100,
      t: issues(c) + " file" + (issues(c) > 1 ? "s" : "") + " failed to process",
      sub: w,
      tag: ["fl", "Fix"],
      go: "openC(" + i + ",'mat','issue')"
    });
    if (c.req.length) a.push({
      w: 50 + c.req.length,
      t: c.req.length + " join request" + (c.req.length > 1 ? "s" : ""),
      sub: w,
      tag: ["pr", "Review"],
      go: "openC(" + i + ",'enr')"
    });
    c.gaps.forEach(function (g) {
      a.push({
        w: g[1],
        t: "Students ask about “" + E(g[0]) + "”",
        sub: g[1] + " asks · not in your modules · " + w,
        tag: ["", "Add material"],
        go: "openC(" + i + ",'mat')"
      });
    });
    c.poor.forEach(function (p) {
      a.push({ w: p[2], t: "Poorly rated: “" + E(p[0]) + "”", sub: p[1] + " · " + w, tag: ["fl", p[2] + "×"],
        go: "openC(" + i + ",'ins')" });
    });
  });
  return a.sort(function (x, y) {
    return y.w - x.w;
  }).slice(0, 5);
}

function attnCard() {
  var a = attnItems();
  return '<div class="card"><b>Needs your attention</b><div style="margin-top:6px">' + (a.length ? a.map(function (x) {
    return '<button class="rowb" onclick="' + x.go + '"><span style="flex:1;min-width:0"><b>' + x.t + '</b><div class="sm">' +
      x.sub + '</div></span><span class="chip ' + x.tag[0] + '">' + x.tag[1] + '</span><span class="ar">›</span></button>';
  }).join("") : '<p class="sm" style="margin:10px 0 0">Nothing needs your attention right now.</p>') + "</div></div>";
}

function topTopics() {
  var m = {};
  CS.forEach(function (c) {
    c.top.forEach(function (t) {
      m[t[0]] = (m[t[0]] || 0) + t[1];
    });
  });
  return Object.keys(m).map(function (k) {
    return [E(k), m[k]];
  }).sort(function (a, b) {
    return b[1] - a[1];
  }).slice(0, 5);
}

function topCard() {
  var t = topTopics();
  return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><b>Most asked this week</b><span class="sm">All sections</span></div><div style="margin-top:6px">' +
    (t.length ? barsD(t, t[0][1]) : '<p class="sm">No topics yet.</p>') + "</div></div>";
}

/* ---- Home detail pop-ups ---- */
function stuM() {
  var T = sum(CS, function (c) {
    return c.st;
  });
  openM(mhead("Students", '<div class="sm">Across your ' + CS.length + " sections</div>") + '<div class="big2">' +
    T + '</div><div class="mh">By section</div>' + bars(CS.map(function (c, i) {
    return [lbl(c), c.st, "openC(" + i + ",'enr')"];
  }), T) + mfoot(), true);
}

function reqM() {
  var all = [];
  CS.forEach(function (c, i) {
    c.req.forEach(function (r) {
      all.push({ r: r, c: c, i: i });
    });
  });
  var first = CS.findIndex(function (c) {
    return c.req.length;
  });
  openM(mhead("Join requests", '<div class="sm">Students asking to join your sections</div>') + '<div class="big2">' +
    all.length + "</div>" + (all.length ? '<div class="mh">Waiting</div>' + all.map(function (x) {
    return '<button class="rowb" onclick="openC(' + x.i + ",'enr')\"><span style=\"flex:1;min-width:0\"><b>" +
      E(x.r[0]) + '</b><div class="sm">' + E(x.r[1]) + " · " + E(x.c.n) + " " + E(x.c.s) + '</div></span><span class="ar">›</span></button>';
  }).join("") : '<p class="sm" style="margin-top:10px">All caught up. No pending requests.</p>') + mfoot("",
    first > -1 ? '<button class="p" onclick="openC(' + first + ',\'enr\')">Review requests</button>' : ""),
    true);
}

function modM() {
  var tm = sum(CS, function (c) {
    return c.mods.length;
  }), hid = [];
  CS.forEach(function (c, ci) {
    c.mods.forEach(function (m, mi) {
      if (!m.pub) hid.push({ c: c, ci: ci, m: m, mi: mi });
    });
  });
  openM(mhead("Modules live", '<div class="sm">Modules students can get answers from</div>') + '<div class="big2">' +
    sum(CS, live) + " of " + tm + '</div><div class="mh">By section</div>' + bars(CS.map(function (c, i) {
    return [lbl(c) + '<div class="sm">' + live(c) + " of " + c.mods.length + " live</div>", live(c), "openC(" +
      i + ",'mat')"];
  }), Math.max.apply(null, CS.map(function (c) {
    return c.mods.length;
  }))) + '<div class="mh">Hidden from students</div>' + (hid.length ? hid.map(function (x) {
    return '<button class="rowb" onclick="goMat(' + x.ci + "," + x.mi + ')"><span style="flex:1;min-width:0"><b>' +
      E(x.m.t) + '</b><div class="sm">' + E(x.c.n) + " " + E(x.c.s) + '</div></span><span class="chip fl">Hidden</span><span class="ar">›</span></button>';
  }).join("") : '<p class="sm">Every module is published.</p>') + mfoot(), true);
}

function qM() {
  var w = aser(7), td = w[6], t = topTopics();
  openM(mhead("Questions this week", '<div class="sm">Last 7 days · today ' + td.t + "</div>") + '<div class="big2">' +
    sum(w, function (x) {
    return x.t;
  }) + '</div><div class="mh">By section</div>' + bars(CS.map(function (c, i) {
    return [lbl(c) + '<div class="sm">' + c.mp + "% from modules</div>", qWeek(c), "openC(" + i + ",'ins')"];
  }), Math.max.apply(null, CS.map(qWeek))) + '<div class="mh">Most asked topics</div>' + (t.length ? barsD(t,
    t[0][1]) : '<p class="sm">No topics yet.</p>') + '<p class="sm" style="margin:12px 0 0">Totals only. You can’t see who asked what.</p>' +
    mfoot(), true);
}

/* ==========================================================================
       6. Course Page
       ========================================================================== */
function csum() {
  var c = C(), bad = issues(c);
  return '<div class="cst"><span><b>' + c.st + "</b> student" + (c.st === 1 ? "" : "s") + "</span><span><b>" + live(c) + "/" + c.mods.length +
    "</b> modules live</span>" + (c.req.length ? '<button onclick="S.tab=\'enr\';render()"><b>' + c.req.length +
    "</b> pending</button>" : "") + (bad ? '<button style="color:var(--er)" onclick="S.tab=\'mat\';S.mf=\'issue\';render()"><b style="color:var(--er)">' +
    bad + "</b> failed file" + (bad > 1 ? "s" : "") + "</button>" : "") + "<span><b>" + qWeek(c) + "</b> questions this week</span></div>";
}

function tabs() {
  var c = C(), bad = issues(c);
  return [
    ["mat", "Materials" + (bad ? " (" + bad + " failed)" : "")],
    ["enr", "Enrollment" + (c.req.length ? " (" + c.req.length + ")" : "")],
    ["ins", "Insights"],
    ["tst", "Test chat"]
  ].map(function (t) {
    return '<button class="' + (S.tab === t[0] ? "on" : "") + '" onclick="S.tab=\'' + t[0] + '\';render()">' +
      t[1] + '</button>';
  }).join("");
}

function refCH() {
  if ($("cs")) $("cs").innerHTML = csum();
  if ($("tb")) $("tb").innerHTML = tabs();
}

function course() {
  var c = C();
  return '<div class="sc">' + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' + '<button class="g" aria-label="Back" onclick="S.v=\'home\';render()">←</button>' +
    '<h2 style="font-size:20px">' + E(c.n) + '</h2>' + '<span class="chip">' + E(c.s) + '</span>' + '</div>' +
    '<div id="cs" style="margin-left:6px">' + csum() + '</div>' + '<div class="seg" id="tb">' + tabs() + '</div>' +
    (S.tab === "mat" ? mat() : S.tab === "enr" ? enr() : S.tab === "ins" ? ins() : tst()) + '</div>';
}

/* ==========================================================================
       7. Materials
       ========================================================================== */
var OKEXT = { pdf: 1, pptx: 1, docx: 1 }, MAXMB = 25;

function ext(n) {
  var m = /\.([a-z0-9]+)$/i.exec(n);
  return m ? m[1].toLowerCase() : "";
}

function mkey(mi) {
  return S.ci + "-" + mi;
}

function mat() {
  var c = C();
  var allCol = c.mods.every(function (m, i) {
    return S.mc[mkey(i)];
  });
  return '<div class="card">' + '<b>Add materials</b>' + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">' +
    '<select id="um" aria-label="Module" style="flex:1 1 220px;min-width:0;max-width:100%">' + c.mods.map(function (m,
    i) {
    return '<option value="' + i + '">' + E(m.t) + '</option>';
  }).join("") + '</select>' + '<input id="fi" type="file" multiple accept=".pdf,.pptx,.docx,.md,.txt" aria-label="Files" style="flex:1;min-width:180px">' +
    '</div>' + '<label style="display:flex;gap:8px;align-items:center"><input id="rt" type="checkbox" style="width:18px;height:18px;padding:0"> I have the right to share these files with my students</label>' +
    '<p class="er" id="ue"></p>' + '<button class="p" onclick="upload()">Upload</button> <span class="sm">PDF, PPTX, DOCX, MD or TXT, up to ' +
    MAXMB + ' MB each. Scanned PDFs have no text and will show as failed.</span>' + '</div>' + '<div class="card tools"><div>' +
    '<input id="mq" aria-label="Search files and modules" placeholder="Search files or modules" value="' +
    EA(S.mq) + '" oninput="S.mq=this.value;refM()" style="flex:2;min-width:180px">' + '<select aria-label="Show" style="flex:1;min-width:130px" onchange="S.mf=this.value;refM()">' +
    [["all", "All modules"], ["pub", "Published"], ["hid", "Hidden"], ["issue", "Has failed files"]].map(function (o) {
    return '<option value="' + o[0] + '"' + (S.mf === o[0] ? " selected" : "") + ">" + o[1] + "</option>";
  }).join("") + '</select>' + '<button onclick="colAll()">' + (allCol ? "Expand all" : "Collapse all") +
    '</button>' + '<button class="p" onclick="addMod()">+ Add module</button>' + '</div></div>' + '<div id="ml">' +
    mlist() + '</div>';
}

function mlist() {
  var c = C(), q = S.mq.toLowerCase().trim(), h = "", shown = 0;

  c.mods.forEach(function (m, mi) {
    var bad = m.f.filter(function (f) {
      return f.st === "fail";
    }).length;
    if ((S.mf === "pub" && !m.pub) || (S.mf === "hid" && m.pub) || (S.mf === "issue" && !bad)) return;

    var mm = !q || m.t.toLowerCase().indexOf(q) > -1;
    var fs = m.f.map(function (f, fi) {
      return { f: f, fi: fi };
    }).filter(function (x) {
      return mm || x.f.n.toLowerCase().indexOf(q) > -1;
    });
    if (q && !mm && !fs.length) return;

    shown++;
    var col = !q && S.mc[mkey(mi)];

    h += '<div class="card" id="m' + mi + '">' + '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">' +
      '<span style="display:flex;align-items:center;gap:8px;min-width:0;flex:1;flex-wrap:wrap">' + '<button class="g chv" aria-expanded="' +
      !col + '" aria-label="' + (col ? "Expand " : "Collapse ") + EA(m.t) + '" onclick="colMod(' + mi + ')">' +
      (col ? "▸" : "▾") + '</button>' + '<button class="ml" title="Open module" onclick="modOpen(' + mi + ')">' +
      E(m.t) + '</button>' + '<span class="chip">' + m.f.length + " file" + (m.f.length === 1 ? "" : "s") +
      '</span>' + (bad ? '<span class="chip fl">' + bad + " failed</span>" : "") + '<button style="font-size:12px;padding:3px 12px" onclick="modOpen(' +
      mi + ')">Open</button>' + '</span>' + '<span style="display:flex;align-items:center;gap:8px">' + '<span class="sm">' +
      (m.pub ? "Published" : "Hidden") + '</span>' + '<button class="sw' + (m.pub ? " on" : "") + '" role="switch" aria-checked="' +
      m.pub + '" aria-label="Publish ' + EA(m.t) + '" onclick="togMod(' + mi + ')"></button>' + '</span>' +
      '</div>';

    if (!col) {
      h += fs.map(function (x) {
        var f = x.f, fi = x.fi;
        return '<div class="row frow">' + '<span style="flex:1;min-width:140px;overflow:hidden"><button class="fl2" style="max-width:100%" title="Open file" onclick="fileOpen(' +
          mi + "," + fi + ')">' + E(f.n) + '</button></span>' + (f.src === "gc" ? '<span class="chip" title="Copied from Google Classroom">From Classroom</span>' : "") + '<span class="chip" style="background:var(--s1);color:var(--t2)">' +
          E((ext(f.n) || "file").toUpperCase()) + '</span>' + (f.st === "ready" ? '<span class="chip ok">Ready</span>' : f.st === "proc" ? '<span class="chip pr">Processing…</span>' : '<span class="chip fl">Failed: no readable text</span><button style="font-size:12px;padding:3px 10px" onclick="retry(' +
          mi + "," + fi + ')">Retry</button>') + '<button class="g" aria-label="Remove ' + EA(f.n) + '" onclick="rmM(' +
          mi + "," + fi + ')">✕</button>' + '</div>';
      }).join("");
      if (!m.f.length) h += '<p class="sm" style="margin:10px 0 0">No files yet. Upload one above to get started.</p>';
    }
    h += "</div>";
  });

  if (!shown) {
    return '<div class="card" style="text-align:center;padding:24px"><b>Nothing matches</b><p class="sm">Try a different search or filter.</p><button onclick="S.mq=\'\';S.mf=\'all\';render()">Clear filters</button></div>';
  }
  return h;
}

// Update only the module list and the header, so typing, scrolling and the upload form are not disturbed
function refM() {
  if (S.v !== "course") return;
  if (S.tab === "mat" && $("ml")) $("ml").innerHTML = mlist();
  refCH();
}

function fin(ci) {
  if (S.v === "course" && S.ci === ci && S.tab === "mat") refM();
  else render();
}

function colMod(mi) {
  S.mc[mkey(mi)] = !S.mc[mkey(mi)];
  refM();
}

function colAll() {
  var c = C(), all = c.mods.every(function (m, i) {
    return S.mc[mkey(i)];
  });
  c.mods.forEach(function (m, i) {
    S.mc[mkey(i)] = !all;
  });
  render();
}

function upload() {
  var c = C(), ci = S.ci, fl = [].slice.call($("fi").files), m = +$("um").value, er = $("ue");
  if (!fl.length) {
    er.textContent = "Choose at least one file";
    return;
  }
  if (!$("rt").checked) {
    er.textContent = "Please confirm you can share these files";
    return;
  }

  var good = [], bad = [];
  fl.forEach(function (x) {
    if (!OKEXT[ext(x.name)]) bad.push(x.name + " (use PDF, PPTX or DOCX)");
    else if (x.size > MAXMB * 1048576) bad.push(x.name + " (over " + MAXMB + " MB)");
    else good.push(x);
  });
  if (!good.length) {
    er.textContent = "Nothing uploaded: " + bad.join("; ");
    return;
  }
  er.textContent = bad.length ? "Skipped: " + bad.join("; ") : "";

  good.forEach(function (x) {
    var o = { n: x.name, st: "proc", file: x };
    c.mods[m].f.push(o);
    setTimeout(function () {
      o.st = /scan/i.test(o.n) ? "fail" : "ready";
      fin(ci);
    }, 1800);
  });

  delete S.mc[ci + "-" + m];
  $("fi").value = "";
  $("rt").checked = false;
  toast(good.length + " file" + (good.length > 1 ? "s" : "") + " uploaded");
  refM();
  setTimeout(function () {
    flash("m" + m);
  }, 40);
}

function togMod(mi) {
  var x = C().mods[mi];
  x.pub = !x.pub;
  var ready = x.f.some(function (f) {
    return f.st === "ready";
  });
  toast(x.pub ? (ready ? "Module published" : "Published, but it has no ready files yet") : "Module hidden from students");
  refM();
}

function rmM(mi, fi) {
  var m = C().mods[mi], f = m.f[fi];
  openM(mhead("Remove this file?") + '<p style="margin:12px 0 4px;line-height:1.6">Remove <b>' + E(f.n) +
    '</b> from <b>' + E(m.t) + '</b>?</p>' + '<p class="sm" style="margin:0 0 14px">Students will no longer get answers from it. This can’t be undone.</p>' +
    '<div style="display:flex;gap:8px;justify-content:flex-end"><button onclick="closeM()">Cancel</button><button class="dng solid" onclick="rmFile(' +
    mi + "," + fi + ')">Remove file</button></div>');
}

function rmFile(mi, fi) {
  C().mods[mi].f.splice(fi, 1);
  closeM();
  toast("File removed");
  refM();
}

function retry(mi, fi) {
  var o = C().mods[mi].f[fi], ci = S.ci;
  o.st = "proc";
  refM();
  setTimeout(function () {
    o.st = "ready";
    fin(ci);
  }, 1500);
}

/* ---- Open a module / open a file ---- */
function modOpen(mi) {
  var c = C(), m = c.mods[mi];
  if (!m) return;
  var rel = [];
  c.top.forEach(function (t, ti) {
    if (t[2] === mi) rel.push({ t: t, ti: ti });
  });
  var asks = sum(rel, function (x) {
    return x.t[1];
  });
  var ready = m.f.some(function (f) {
    return f.st === "ready";
  });
  var sample = c.ans[mi];

  openM(mhead(m.t, '<div class="sm">' + E(c.n) + " " + E(c.s) + "</div>") + '<div class="row" style="border:none;padding:12px 0 0">' +
    '<span style="flex:1"><span class="chip ' + (m.pub ? "ok" : "fl") + '">' + (m.pub ? "Published" : "Hidden from students") +
    '</span>' + '<div class="sm" style="margin-top:4px">' + (m.pub ? "Students get answers from this module." : "Students can’t get answers from it until you publish.") +
    '</div></span>' + '<button class="sw' + (m.pub ? " on" : "") + '" role="switch" aria-checked="' + m.pub +
    '" aria-label="Publish module" onclick="togMod(' + mi + ');modOpen(' + mi + ')"></button>' + '</div>' +
    '<div class="cst"><span><b>' + m.f.length + "</b> file" + (m.f.length === 1 ? "" : "s") + "</span>" +
    (c.use[mi] != null ? "<span><b>" + c.use[mi] + "%</b> of module use</span>" : "") + "<span><b>" + asks +
    "</b> questions this week</span></div>" + '<div class="mh">Files</div>' + (m.f.length ? m.f.map(function (f,
    fi) {
    return '<div class="row frow"><span style="flex:1;min-width:140px;overflow:hidden"><button class="fl2" style="max-width:100%" onclick="fileOpen(' +
      mi + "," + fi + ')">' + E(f.n) + '</button></span>' + '<span class="chip" style="background:var(--s1);color:var(--t2)">' +
      E((ext(f.n) || "file").toUpperCase()) + '</span>' + (f.st === "ready" ? '<span class="chip ok">Ready</span>' : f.st === "proc" ? '<span class="chip pr">Processing…</span>' : '<span class="chip fl">Failed</span>') +
      '<button style="font-size:12px;padding:3px 10px" onclick="fileOpen(' + mi + "," + fi + ')">Open</button></div>';
  }).join("") : '<p class="sm" style="margin:6px 0 0">No files yet. Use “Add files” below.</p>') + '<div class="mh">Questions this module answers</div>' +
    (rel.length ? rel.map(function (x) {
    return '<button class="rowb" onclick="topM(' + x.ti + ')"><span style="flex:1;min-width:0"><b>' + E(x.t[0]) +
      '</b></span><span class="sm">' + x.t[1] + ' asks</span><span class="ar">›</span></button>';
  }).join("") : '<p class="sm" style="margin:6px 0 0">No questions matched this module yet.</p>') + (ready &&
    sample ? '<div class="mh">What students’ answers use</div><div class="doc">' + E(sample.join(" ")) + '</div><p class="sm" style="margin:6px 0 0">A sample of the text LearnLink reads from this module’s files.</p>' : "") +
    mfoot('<button onclick="rmModAsk(' + mi + ')" class="dng">Delete module</button>', '<button class="p" onclick="addTo(' +
    mi + ')">Add files</button>'), true);
}

function addTo(mi) {
  closeM();
  S.tab = "mat";
  render();
  setTimeout(function () {
    var u = $("um"), f = $("fi");
    if (u) u.value = mi;
    if (f) {
      f.scrollIntoView({ block: "center" });
      f.focus();
    }
  }, 40);
}

function rmModAsk(mi) {
  var m = C().mods[mi];
  openM(mhead("Delete this module?") + '<p style="margin:12px 0 4px;line-height:1.6">Delete <b>' + E(m.t) +
    '</b> and its ' + m.f.length + ' file' + (m.f.length === 1 ? "" : "s") + '?</p>' + '<p class="sm" style="margin:0 0 14px">Students will no longer get answers from it. This can’t be undone. To keep it, hide the module instead.</p>' +
    '<div style="display:flex;gap:8px;justify-content:flex-end"><button onclick="modOpen(' + mi + ')">Cancel</button><button class="dng solid" onclick="rmMod(' +
    mi + ')">Delete module</button></div>');
}

function rmMod(mi) {
  var c = C();
  c.mods.splice(mi, 1);
  // sample stats are stored by module number, so realign them after a delete
  c.use = c.use.slice();
  c.use.splice(mi, 1);
  c.ans = c.ans.slice();
  c.ans.splice(mi, 1);
  c.kw = c.kw.slice();
  c.kw.splice(mi, 1);
  c.top = c.top.filter(function (t) {
    return t[2] !== mi;
  }).map(function (t) {
    return [t[0], t[1], t[2] > mi ? t[2] - 1 : t[2]];
  });
  c.poor = c.poor.filter(function (p) {
    return p[3] !== mi;
  }).map(function (p) {
    return [p[0], p[1], p[2], p[3] > mi ? p[3] - 1 : p[3]];
  });
  // keep collapsed/expanded state lined up with the new module numbers
  var ci = S.ci, keep = {};
  Object.keys(S.mc).forEach(function (k) {
    var p = k.split("-"), a = +p[0], b = +p[1];
    if (a !== ci || b < mi) keep[k] = S.mc[k];
    else if (b > mi) keep[a + "-" + (b - 1)] = S.mc[k];
  });
  S.mc = keep;
  closeM();
  toast("Module deleted");
  render();
}

function fileOpen(mi, fi) {
  var c = C(), m = c.mods[mi], f = m.f[fi];
  if (!f) return;
  var e = ext(f.n), body = "", sample = c.ans[mi];
  if (VU) {
    URL.revokeObjectURL(VU);
    VU = null;
  }

  if (f.st === "proc") {
    body = '<div class="doc">This file is still being processed. Check back in a moment.</div>';
  } else if (f.st === "fail") {
    body = '<div class="doc"><b>No readable text was found.</b><br>This often happens with scanned pages. Upload a text-based version of the file so students can get answers from it.</div>';
  } else if (f.file) {
    VU = URL.createObjectURL(f.file);
    body = (e === "pdf" ? '<iframe src="' + VU + '" title="' + EA(f.n) + '" style="width:100%;height:55vh;border:1.5px solid var(--bd);border-radius:14px;background:#fff"></iframe>' : '<div class="doc">A preview isn’t available for ' +
      E(e.toUpperCase()) + ' files here. Download it to view the full file.</div>') + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><a class="btnl" href="' +
      VU + '" target="_blank" rel="noopener">Open in new tab</a><a class="btnl" href="' + VU + '" download="' +
      EA(f.n) + '">Download</a></div>';
  } else {
    body = (sample ? '<div class="mh" style="margin-top:4px">Text LearnLink reads from this file</div><div class="doc">' +
      E(sample.join(" ")) + '</div>' : '<div class="doc">No text sample is available for this file.</div>') +
      '<p class="sm" style="margin:8px 0 0">This is a sample file, so only the extracted text is shown.</p>';
  }

  openM(mhead(f.n, '<div class="sm">In ' + E(m.t) + "</div>") + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 12px"><span class="chip">' +
    E((e || "file").toUpperCase()) + '</span>' + (f.st === "ready" ? '<span class="chip ok">Ready</span>' : f.st === "proc" ? '<span class="chip pr">Processing…</span>' : '<span class="chip fl">Failed</span>') +
    '<span class="chip ' + (m.pub ? "ok" : "fl") + '">' + (m.pub ? "Published" : "Hidden") + '</span></div>' +
    body + mfoot('<button onclick="modOpen(' + mi + ')">Back to module</button>', '<button class="dng" onclick="rmM(' +
    mi + "," + fi + ')">Remove file</button>'), true);
}

function addMod() {
  openM(mhead("Add a module", '<div class="sm">It stays hidden until you publish it.</div>') + '<label class="sm" style="display:block;margin-top:14px">Module title</label>' +
    '<input id="mn" placeholder="Incident Response" style="width:100%" onkeydown="if(event.key===\'Enter\')saveMod()" oninput="$(\'me\').textContent=\'\'">' +
    '<p class="er" id="me"></p>' + '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px"><button onclick="closeM()">Cancel</button><button class="p" onclick="saveMod()">Add module</button></div>');
}

function saveMod() {
  var c = C(), v = $("mn").value.trim();
  if (v.length < 3) {
    $("me").textContent = "Enter a module title (at least 3 letters)";
    return;
  }
  if (c.mods.some(function (m) {
    return m.t.replace(/^Module \d+:\s*/, "").toLowerCase() === v.toLowerCase();
  })) {
    $("me").textContent = "A module with that title already exists";
    return;
  }
  c.mods.push({ t: "Module " + (c.mods.length + 1) + ": " + v, pub: false, f: [] });
  c.use.push(0);
  closeM();
  toast("Module added. It is hidden until you publish it.");
  render();
  var mi = c.mods.length - 1;
  setTimeout(function () {
    flash("m" + mi);
  }, 60);
}

/* ==========================================================================
       8. Enrollment
       ========================================================================== */
function enr() {
  var c = C(), q = S.eq.toLowerCase().trim();
  var list = c.req.map(function (r, i) {
    return { r: r, i: i };
  }).filter(function (x) {
    return !q || (x.r[0] + " " + x.r[1]).toLowerCase().indexOf(q) > -1;
  });

  return '<div class="card">' + '<div class="sm">Course code for ' + E(c.s) + '</div>' + '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:4px">' +
    '<b style="font-size:26px;letter-spacing:2px">' + E(c.code) + '</b>' + '<button onclick="cpy()">Copy</button>' +
    '<button onclick="ncM()">New code</button>' + '</div>' + '<p class="sm" style="margin:8px 0 0">' + c.st +
    ' students enrolled</p>' + '<div class="row" style="margin-top:10px">' + '<span style="flex:1"><b>Accept join requests</b><div class="sm">' +
    (c.open ? "Students can use the code to ask to join." : "Closed. Students can’t request to join with this code.") +
    '</div></span>' + '<button class="sw' + (c.open ? " on" : "") + '" role="switch" aria-checked="' + c.open +
    '" aria-label="Accept join requests" onclick="tgOpen()"></button>' + '</div>' + '</div>' + '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin:4px 0 8px">' +
    '<h3 style="font-size:15px">Join requests' + (c.req.length ? ' <span class="chip pr">' + c.req.length +
    "</span>" : "") + '</h3>' + (c.req.length > 1 ? '<span style="display:flex;gap:8px"><button onclick="declM()" class="dng" style="font-size:12px;padding:4px 12px">Decline all</button><button class="p" onclick="apprAll()" style="font-size:12px;padding:4px 12px">Approve all</button></span>' : "") +
    '</div>' + (c.req.length > 3 ? '<input id="eq" aria-label="Search requests" placeholder="Search by name or student ID" value="' +
    EA(S.eq) + '" oninput="S.eq=this.value;render()" style="width:100%;margin-bottom:10px">' : "") + (list.length ? list.map(function (x) {
    var r = x.r, i = x.i;
    return '<div class="card" id="rq' + i + '" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;transition:all .3s">' +
      '<div style="flex:1;min-width:150px"><b>' + E(r[0]) + '</b><div class="sm">' + E(r[1]) + " · wants to join " +
      E(c.s) + '</div></div>' + '<button onclick="appr(' + i + ',false)">Decline</button>' + '<button class="p" onclick="appr(' +
      i + ',true)">Approve</button>' + '</div>';
  }).join("") : '<div class="card" style="text-align:center"><b>' + (c.req.length ? "No requests match" : "All caught up") +
    '</b><div class="sm">' + (c.req.length ? "Try a different search." : "No pending requests.") + '</div></div>');
}

function cpy() {
  var t = C().code;
  var ok = function () {
    toast("Code copied");
  };
  var no = function () {
    toast("Couldn’t copy. Select the code and copy it.");
  };
  var fb = function () {
    try {
      var a = D.createElement("textarea");
      a.value = t;
      a.style.cssText = "position:fixed;opacity:0";
      D.body.appendChild(a);
      a.select();
      var done = D.execCommand("copy");
      a.remove();
      done ? ok() : no();
    } catch (e) {
      no();
    }
  };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, fb);
  else fb();
}

function ncM() {
  var c = C();
  openM(mhead("Create a new code?") + '<p style="margin:12px 0 4px;line-height:1.6">The current code <b>' +
    E(c.code) + '</b> will stop working.</p>' + '<p class="sm" style="margin:0 0 14px">Students already enrolled are not affected. Share the new code with anyone still joining.</p>' +
    '<div style="display:flex;gap:8px;justify-content:flex-end"><button onclick="closeM()">Cancel</button><button class="p" onclick="newCode()">Create new code</button></div>');
}

function newCode() {
  var c = C();
  c.code = c.code.split("-")[0] + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();
  closeM();
  toast("New code created");
  render();
}

function tgOpen() {
  var c = C();
  c.open = !c.open;
  toast(c.open ? "Join requests are open" : "Join requests are closed");
  render();
}

function appr(i, ok) {
  var e = $("rq" + i);
  if (e) {
    e.style.opacity = 0;
    e.style.transform = "translateX(" + (ok ? 50 : -50) + "px)";
  }
  setTimeout(function () {
    var r = C().req.splice(i, 1)[0];
    if (ok) {
      C().st++;
      toast(r[0] + " added to the course");
    } else {
      toast("Request declined");
    }
    render();
  }, 300);
}

function apprAll() {
  var c = C(), n = c.req.length;
  c.st += n;
  c.req = [];
  S.eq = "";
  toast(n + " students added to the course");
  render();
}

function declM() {
  var n = C().req.length;
  openM(mhead("Decline all requests?") + '<p style="margin:12px 0 14px;line-height:1.6">Decline all <b>' +
    n + '</b> join requests for <b>' + E(C().s) + '</b>? Students can ask again with the code.</p>' + '<div style="display:flex;gap:8px;justify-content:flex-end"><button onclick="closeM()">Cancel</button><button class="dng solid" onclick="declAll()">Decline all</button></div>');
}

function declAll() {
  C().req = [];
  S.eq = "";
  closeM();
  toast("All requests declined");
  render();
}

/* ==========================================================================
       9. Insights
       ========================================================================== */
function ins() {
  var c = C(), f = c.live ? 1 : (S.rng === 7 ? 1 : 3.6);
  var N = function (n) {
    return Math.round(n * f);
  };
  var sr = cser(c, S.rng), T = sum(sr, function (x) {
    return x.t;
  }), M = sum(sr, function (x) {
    return x.m;
  });
  var tp = c.top, mx = Math.max.apply(null, tp.map(function (t) {
    return t[1];
  }).concat([1]));

  return chartCard(sr, S.ci, "Questions per day") + '<div class="cg" style="margin-bottom:12px">' + '<div class="card"><div class="sm">Questions asked</div><b style="font-size:24px">' +
    T + '</b></div>' + '<div class="card"><div class="sm">Answered from modules</div><b style="font-size:24px">' +
    (T ? Math.round(M / T * 100) : 0) + '%</b></div>' + '<div class="card"><div class="sm">Poor ratings</div><b style="font-size:24px">' +
    N(poorN(c)) + '</b></div>' + '</div>' + '<div class="card"><div style="display:flex;justify-content:space-between"><b>Most asked topics</b><span class="sm">Click for details</span></div><div style="margin-top:6px">' +
    (tp.length ? "" : '<p class="sm" style="margin:8px 0 0">No topics yet.</p>') + tp.map(function (t, i) {
    return '<button class="rowb" onclick="topM(' + i + ')"><span class="rl">' + E(t[0]) + '</span><span class="bar"><i style="width:' +
      (t[1] / mx * 100) + '%"></i></span><b class="rv">' + N(t[1]) + '</b><span class="ar">›</span></button>';
  }).join("") + '</div></div>' + '<div class="card"><b>Gaps: asked but not in your modules</b>' + (c.gaps.length ? c.gaps.map(function (g) {
    return '<div class="row"><span style="flex:1">' + E(g[0]) + ' <span class="sm">· ' + N(g[1]) + ' asks</span></span><button style="font-size:12px;padding:4px 10px" onclick="S.tab=\'mat\';render()">Add material</button></div>';
  }).join("") : '<p class="sm" style="margin:8px 0 0">No gaps found. Your modules cover what students ask.</p>') +
    '</div>' + '<div class="card"><div style="display:flex;justify-content:space-between"><b>Poorly rated answers</b>' +
    (c.poor.length ? '<span class="sm">Click for details</span>' : "") + '</div>' + (c.poor.length ? c.poor.map(function (r,
    i) {
    return '<button class="rowb" onclick="poorM(' + i + ')"><span style="flex:1;min-width:0">' + E(r[0]) +
      '</span><span class="chip fl">' + E(r[1]) + " · " + N(r[2]) + '</span><span class="ar">›</span></button>';
  }).join("") : '<p class="sm" style="margin:8px 0 0">No poorly rated answers. Nice work.</p>') + '</div>' +
    '<div class="card"><div style="display:flex;justify-content:space-between"><b>Module usage</b><span class="sm">Click to open a module</span></div><div style="margin-top:6px">' +
    c.use.map(function (u, i) {
    return '<button class="rowb" onclick="goMat(' + S.ci + "," + i + ')"><span class="rl">Module ' + (i +
      1) + '</span><span class="bar"><i style="width:' + (u * 2) + '%"></i></span><b class="rv">' + u + '%</b><span class="ar">›</span></button>';
  }).join("") + '</div></div>' + '<p class="sm">All insights are anonymous. You can’t see who asked what.</p>';
}

function topM(ti) {
  var c = C(), t = c.top[ti], f = c.live ? 1 : (S.rng === 7 ? 1 : 3.6), m = c.mods[t[2]] || c.mods[0];
  openM(mhead(t[0], '<div class="sm">Last ' + S.rng + " days · " + E(c.n) + " " + E(c.s) + "</div>") + '<div class="big2">' +
    Math.round(t[1] * f) + '</div><div class="sm">questions about this topic</div>' + '<div class="mh">Answered from</div>' +
    '<div class="card" style="margin:0"><b>' + E(m.t) + '</b><div style="margin-top:6px">' + (m.pub ? '<span class="chip ok">Published</span>' : '<span class="chip fl">Hidden from students</span>') +
    "</div></div>" + (m.pub ? "" : '<p class="sm" style="margin:10px 0 0">Students can’t get answers from this module until you publish it.</p>') +
    mfoot('<button onclick="testQ(\'' + "What is " + EA(t[0]) + '?\')">Test this question</button>', '<button class="p" onclick="goMat(' +
    S.ci + "," + t[2] + ')">Open module</button>'));
}

function poorM(pi) {
  var c = C(), p = c.poor[pi], f = c.live ? 1 : (S.rng === 7 ? 1 : 3.6), m = c.mods[p[3]] || c.mods[0];
  var tips = {
    "Missing source": "The answer didn’t point to a module. Check that the module covering this topic is published and its files have readable text.",
    "Doesn’t match my notes": "Compare the module text with your notes. If your notes are newer, upload the updated file and remove the old one.",
    "Answer was too short": "The module may not explain this in enough detail. Add a file that covers it more fully."
  };
  openM(mhead("Poorly rated answer", '<div class="sm">' + E(c.n) + " " + E(c.s) + "</div>") + '<p style="margin:12px 0 4px;font-size:16px;font-weight:700">“' +
    E(p[0]) + '”</p>' + '<div style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip fl">' + E(p[1]) +
    '</span><span class="chip">' + Math.round(p[2] * f) + " poor rating" + (Math.round(p[2] * f) === 1 ? "" : "s") +
    '</span></div>' + '<div class="mh">What you can do</div><p style="margin:0;line-height:1.6">' + E(tips[p[1]] ||
    "Open the related module and check that it answers this question clearly.") + "</p>" + '<div class="mh">Related module</div><div class="card" style="margin:0"><b>' +
    E(m.t) + '</b></div>' + '<p class="sm" style="margin:12px 0 0">Ratings are anonymous.</p>' + mfoot('<button onclick="testQ(\'' +
    EA(p[0]).replace(/&#39;/g, "\\'") + '\')">Test this question</button>', '<button class="p" onclick="goMat(' +
    S.ci + "," + p[3] + ')">Open module</button>'));
}

function testQ(q) {
  closeM();
  S.tab = "tst";
  ask(q);
}

/* ==========================================================================
       10. Test Chat
       ========================================================================== */
function tst() {
  var c = C();
  return '<div class="card" style="background:var(--bt);display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">' +
    '<span><b>Testing as a student</b><div class="sm" style="color:var(--wt)">Answers use only this course’s published modules.</div></span>' +
    (S.tc.length ? '<button onclick="S.tc=[];render()" style="font-size:12px;padding:4px 12px">Clear chat</button>' : "") +
    '</div>' + '<div id="msgs">' + S.tc.map(function (m) {
    var mm = m.m > -1 ? c.mods[m.m] : null, body;
    if (mm && mm.pub) {
      body = '<span class="chip">From your modules</span><p style="margin:8px 0;line-height:1.7">' + E(c.ans[m.m].join(" ")) +
        '</p><button class="chip pr" onclick="modOpen(' + m.m + ')">' + E(mm.t) + '</button>';
    } else if (mm) {
      body = '<span class="chip fl">Module hidden</span><p style="margin:8px 0">This topic is in “' + E(mm.t) +
        '”, but the module is hidden, so students would get no answer.</p><button style="font-size:12px;padding:4px 10px" onclick="togMod(' +
        m.m + ');render()">Publish module</button>';
    } else {
      body = '<span class="chip fl">No module matched</span><p style="margin:8px 0">The published modules don’t cover this. Add material to fill the gap.</p><button style="font-size:12px;padding:4px 10px" onclick="S.tab=\'mat\';render()">Add material</button>';
    }
    return '<div style="display:flex;justify-content:flex-end;margin:10px 0">' + '<div style="background:var(--s1);border-radius:16px;padding:8px 14px;max-width:80%">' +
      E(m.u) + '</div>' + '</div>' + '<div style="margin:10px 0">' + body + '</div>';
  }).join("") + (S.tc.length ? "" : '<p class="sm">Try one of these, or ask your own question.</p>') + '</div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">' + c.sug.map(function (q) {
    return '<button class="chip" data-q="' + EA(q) + '" onclick="ask(this.dataset.q)">' + E(q) + '</button>';
  }).join("") + '</div>' + '<div style="display:flex;gap:8px;margin-top:12px">' + '<input id="ti" placeholder="Ask like a student…" aria-label="Ask a question" style="flex:1" onkeydown="if(event.key===\'Enter\')ts()">' +
    '<button class="p" onclick="ts()">Ask</button>' + '</div>';
}

function ask(v) {
  v = (v || "").trim();
  if (!v) return;

  var c = C(), t = v.toLowerCase(), m = -1;
  var order = [1, 2, 3, 0].concat(c.kw.map(function (x, i) {
    return i;
  }).filter(function (i) {
    return i > 3;
  }));
  order.some(function (i) {
    if (c.kw[i] && c.kw[i].test(t)) {
      m = i;
      return true;
    }
    return false;
  });

  S.tc.push({ u: v, m: m });
  render();
  var sc = D.querySelector(".sc");
  if (sc) sc.scrollTop = sc.scrollHeight;
}

function ts() {
  var i = $("ti"), v = i.value;
  i.value = "";
  ask(v);
}

/* ==========================================================================
       11. Automatic Email Extension & Input Listener
       ========================================================================== */
document.addEventListener("input", function (e) {
  var target = e.target;
  if (target && (target.type === "email" || target.id.includes("email") || target.classList.contains("email-input"))) {
    var val = target.value;
    if (val.endsWith("@") && !val.toLowerCase().includes("bisu.edu.ph")) {
      target.value = val + "bisu.edu.ph";
    }
  }
});

/* ==========================================================================
       12. Render Pipeline & Focus Preservation
       ========================================================================== */
function render() {
  tipOff();
  var r = $("root");
  var k = [S.v, S.ci, S.tab, S.sb, S.currentUser.email].join("|");
  r.className = k !== window.K ? "enter" : "";
  window.K = k;
  r.innerHTML = app();
  var m = $("msgs");
  if (m) m.scrollTop = m.scrollHeight;
}

var _RR = render;
render = function () {
  var a = D.activeElement;
  var id = a && a.id;
  var ok = a && (a.tagName === "TEXTAREA" || (a.tagName === "INPUT" && a.type !== "file" && a.type !== "checkbox" &&
    a.type !== "range"));
  var v = ok ? a.value : null;
  var s1 = ok ? a.selectionStart : 0;
  var s2 = ok ? a.selectionEnd : 0;

  // Keep the page where the person was scrolled to, unless they moved to a different view
  var oldSc = D.querySelector(".sc");
  var oldTop = oldSc ? oldSc.scrollTop : 0;
  var oldK = window.K;

  if (typeof S !== "undefined" && S.scr === "reg" && typeof gather === "function") gather();

  _RR();

  var newSc = D.querySelector(".sc");
  if (newSc && window.K === oldK) newSc.scrollTop = oldTop;

  if (ok && id) {
    var n = $(id);
    if (n && n !== a) {
      n.value = v;
      n.focus();
      try {
        n.setSelectionRange(s1, s2);
      } catch (x) {}
    }
  }
};

/* ==========================================================================
       Real data: courses, modules and uploaded files come from the database (PHP API).
       If the server is not reachable (page opened on its own), the sample data above stays.
       Still sample data: the question statistics, enrollment/join requests and the Test chat answers.
       ========================================================================== */
var API = "/api/db/";

function api(path, body) {
  var o = body === undefined ? {} : {
    method: "POST",
    headers: { "X-Requested-With": "learnlink", "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
  return fetch(API + path, o).then(function (r) {
    return r.json().then(function (j) {
      if (!r.ok) throw j;
      return j;
    });
  });
}
var NOMATCH = /^\b$/;

// database course -> the shape this page already uses
function toCS(c) {
  return {
    id: c.id,
    n: c.name,
    s: c.college,
    st: c.students || 0,
    code: "",
    open: true,
    req: [],
    mods: c.modules.map(function (m) {
      return {
        id: m.id,
        t: "Module " + m.position + ": " + m.title,
        pub: m.published,
        f: m.files.map(function (f) {
          return { id: f.id, n: f.name, st: f.status === "ready" ? "ready" : "fail", err: f.error, size: f.size, src: +f.from_classroom ? "gc" : undefined };
        })
      };
    }),
    q7: [0, 0, 0, 0, 0, 0, 0],
    mp: 0,
    top: [],
    gaps: [],
    poor: [],
    use: c.modules.map(function () {
      return 0;
    }),
    ans: c.modules.map(function () {
      return [];
    }),
    kw: c.modules.map(function () {
      return NOMATCH;
    }),
    sug: []
  };
}
// reload from the server; keeps the open course and the other (sample) fields of each course
function refresh(done) {
  return api("courses").then(function (j) {
    var keep = CS.length ? C().id : null;
    CS = j.courses.map(toCS);
    var i = CS.findIndex(function (c) {
      return c.id === keep;
    });
    if (i > -1) S.ci = i;
    else if (S.ci >= CS.length) S.ci = 0;
    if (done) done();
  });
}

function oops(e) {
  toast(e && e.error ? "Server said: " + e.error : "Could not reach the server");
}

OKEXT = { pdf: 1, pptx: 1, docx: 1, md: 1, txt: 1 };

upload = function () {
  var c = C(), fl = [].slice.call($("fi").files), mi = +$("um").value, m = c.mods[mi], er = $("ue");
  if (!fl.length) {
    er.textContent = "Choose at least one file";
    return;
  }
  if (!$("rt").checked) {
    er.textContent = "Please confirm you can share these files";
    return;
  }
  var good = [], bad = [];
  fl.forEach(function (x) {
    if (!OKEXT[ext(x.name)]) bad.push(x.name + " (use PDF, PPTX, DOCX, MD or TXT)");
    else if (x.size > MAXMB * 1048576) bad.push(x.name + " (over " + MAXMB + " MB)");
    else good.push(x);
  });
  if (!good.length) {
    er.textContent = "Nothing uploaded: " + bad.join("; ");
    return;
  }
  er.textContent = bad.length ? "Skipped: " + bad.join("; ") : "";

  var fd = new FormData();
  fd.append("module_id", m.id);
  fd.append("rights", "1");
  good.forEach(function (x) {
    fd.append("files[]", x);
    m.f.push({ n: x.name, st: "proc" });
  });
  delete S.mc[S.ci + "-" + mi];
  $("fi").value = "";
  $("rt").checked = false;
  refM();
  fetch(API + "materials?action=upload", { method: "POST", headers: { "X-Requested-With": "learnlink" },
    body: fd }).then(function (r) {
    return r.json().then(function (j) {
      if (!r.ok) throw j;
      return j;
    });
  }).then(function (j) {
    var rej = j.files.filter(function (f) {
      return !f.ok;
    }).map(function (f) {
      return f.name + " (" + f.error + ")";
    });
    return refresh(function () {
      var e2 = $("ue");
      if (e2 && rej.length) e2.textContent = "Not saved: " + rej.join("; ");
      var n = j.files.filter(function (f) {
        return f.ok;
      }).length;
      toast(n + " file" + (n === 1 ? "" : "s") + " uploaded" + (j.kb ? "" : ". The AI server is not running; it will read them when it starts"));
      render();
    });
  }).catch (function (e) {
    refresh(render).then(function () {
      oops(e && e.error === "too_big_for_server" ? { error: "file is bigger than the PHP upload limit" } : e);
    }, function () {
      oops(e);
    });
  });
};

togMod = function (mi) {
  var x = C().mods[mi], want = !x.pub;
  api("courses?action=publish", { module_id: x.id, published: want }).then(function (j) {
    x.pub = want;
    var ready = x.f.some(function (f) {
      return f.st === "ready";
    });
    toast(want ? (ready ? "Module published" : "Published, but it has no ready files yet") : "Module hidden from students");
    refM();
  }, oops);
};

saveMod = function () {
  var c = C(), v = $("mn").value.trim();
  if (v.length < 3) {
    $("me").textContent = "Enter a module title (at least 3 letters)";
    return;
  }
  if (c.mods.some(function (m) {
    return m.t.replace(/^Module \d+:\s*/, "").toLowerCase() === v.toLowerCase();
  })) {
    $("me").textContent = "A module with that title already exists";
    return;
  }
  api("courses?action=add_module", { course_id: c.id, title: v }).then(function () {
    return refresh(function () {
      closeM();
      toast("Module added. It is hidden until you publish it.");
      render();
    });
  }, function (e) {
    $("me").textContent = "Server said: " + (e.error || "unreachable");
  });
};

rmFile = function (mi, fi) {
  var f = C().mods[mi].f[fi];
  api("materials?action=delete", { id: f.id }).then(function () {
    C().mods[mi].f.splice(fi, 1);
    closeM();
    toast("File removed");
    refM();
  }, function (e) {
    closeM();
    oops(e);
  });
};

rmMod = function (mi) {
  api("courses?action=delete_module", { module_id: C().mods[mi].id }).then(function () {
    S.mc = {};
    return refresh(function () {
      closeM();
      toast("Module deleted");
      render();
    });
  }, function (e) {
    closeM();
    oops(e);
  });
};

retry = function (mi, fi) {
  var o = C().mods[mi].f[fi];
  o.st = "proc";
  refM();
  api("materials?action=retry", { id: o.id }).then(function (j) {
    o.st = j.status === "ready" ? "ready" : "fail";
    o.err = j.error;
    if (o.st === "fail") toast(j.error || "Still no readable text");
    refM();
  }, function (e) {
    o.st = "fail";
    refM();
    oops(e);
  });
};

// open a stored file: show the text the AI reads from it, and a download link
var _fileOpen = fileOpen;
fileOpen = function (mi, fi) {
  var m = C().mods[mi], f = m.f[fi];
  if (!f || !f.id) return _fileOpen(mi, fi);
  var e = ext(f.n);
  (f.st === "ready" ? api("materials?action=text&id=" + f.id) : Promise.resolve({ text: "" })).then(function (t) {
    var body = f.st === "ready" ? '<div class="mh" style="margin-top:4px">Text LearnLink reads from this file (' +
      t.chars + ' characters)</div><div class="doc">' + E(t.text) + (t.chars > 4000 ? "…" : "") + '</div>' : '<div class="doc"><b>No readable text was found.</b><br>' +
      E(f.err || "This often happens with scanned pages.") + ' Upload a text-based version so students can get answers from it.</div>';
    openM(mhead(f.n, '<div class="sm">In ' + E(m.t) + "</div>") + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 12px"><span class="chip">' +
      E((e || "file").toUpperCase()) + '</span>' + (f.st === "ready" ? '<span class="chip ok">Ready</span>' : '<span class="chip fl">Failed</span>') +
      '<span class="chip ' + (m.pub ? "ok" : "fl") + '">' + (m.pub ? "Published" : "Hidden") + '</span></div>' +
      body + '<div style="margin-top:10px"><a class="btnl" href="' + API + 'materials?action=download&id=' +
      f.id + '">Download original</a></div>' + mfoot('<button onclick="modOpen(' + mi + ')">Back to module</button>',
      '<button class="dng" onclick="rmM(' + mi + "," + fi + ')">Remove file</button>'), true);
  }, oops);
};

// sign in state from the server, then the real course list.
// The sample data above is shown only in demo mode (?demo, see gate.js). Otherwise: real data, the login page, or an error.
if (window.LL_DEMO) render();
else api("auth?action=me").then(function (j) {
  if (!j.user || j.user.role === "student") return LL_toLogin();
  S.currentUser = { name: j.user.name, email: j.user.email };
  return refresh(function () { CS.length ? render() : noCourses(j.user); LL_ready(); });
}).catch (function (e) {
  LL_authError(e) ? LL_toLogin() : LL_fail();
});

// A teacher with no course assigned yet: say so instead of showing sample data.
function noCourses(u) {
  document.body.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--bg);color:var(--tx);font-family:inherit">' +
    '<div class="card" style="max-width:440px;text-align:center"><h2 style="margin:0 0 8px">No courses yet</h2>' +
    '<p style="margin:0 0 14px;line-height:1.6">Hi ' + E(u.name) + '! You are not the instructor of any course yet. Ask the admin to assign you in <b>Courses</b> → <b>Instructor</b>, then reload this page.</p>' +
    '<div style="display:flex;gap:8px;justify-content:center"><button onclick="location.reload()">Reload</button><button class="p" onclick="parent.postMessage(\'logout\',\'*\')">Log out</button></div></div></div>';
}


/* ==========================================================================
       Real statistics (api/stats.php): replace the sample numbers once the server answers.
       Questions per day, % answered from modules, most asked terms, gaps, poor ratings, module usage.
       ========================================================================== */
function loadStats() {
  return Promise.all(CS.map(function (c) {
    if (!c.id) return null;
    return api("stats?action=course&course_id=" + encodeURIComponent(c.id)).then(function (j) {
      c.live = { 7: j.w7, 30: j.w30 };
      c.q7 = j.w7.days.map(function (d) { return d.t; });
      var T = sum(j.w7.days, function (d) { return d.t; }), M = sum(j.w7.days, function (d) { return d.m; });
      c.mp = T ? Math.round(M / T * 100) : 0;
      useRange(c);
    }, function () {});
  }));
}
// top / gaps / poor / use follow the 7 or 30 day switch
function useRange(c) {
  if (!c.live) return;
  var w = c.live[S.rng === 30 ? 30 : 7];
  c.top = w.top; c.gaps = w.gaps; c.poor = w.poor; c.use = w.use;
}
var _cserSample = cser;
cser = function (c, n) {
  if (!c.live) return _cserSample(c, n);
  return c.live[n === 30 ? 30 : 7].days.map(function (x) {
    var p = x.d.split("-");
    return { d: new Date(+p[0], +p[1] - 1, +p[2]), t: x.t, m: x.m };
  });
};
var _insSample = ins;
ins = function () {
  useRange(C());
  return _insSample();
};
var _attnSample = attnItems;
attnItems = function () {
  CS.forEach(useRange);
  return _attnSample();
};
var _refreshBase = refresh;
refresh = function (done) {
  return _refreshBase().then(loadStats).then(function () {
    if (done) done();
  });
};
