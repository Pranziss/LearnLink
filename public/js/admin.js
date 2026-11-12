var D = document, $ = function (i) {
  return D.getElementById(i)
}, E = function (s) {
  return String(s).replace(/</g, "&lt;")
};
var EA = function (s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
};
var CID = 6, TERMS = ["1st Semester", "2nd Semester", "Summer"];
/* one entry per course module folder on the server; s = sections, each with an instructor (fac) and class size (stu) */
var CRS = [
  {
    id: 1,
    n: "Information Assurance",
    c: "IA",
    col: "CCIS",
    term: "1st Semester",
    st: "active",
    mod: 4,
    s: [{ sec: "BSIT 3C", fac: "Ramon Dizon", stu: 41 }, { sec: "BSIT 3B", fac: "Ramon Dizon", stu: 38 }]
  },
  {
    id: 2,
    n: "Research Methods",
    c: "RM",
    col: "CCIS",
    term: "1st Semester",
    st: "active",
    mod: 4,
    s: [{ sec: "BSIT 3C", fac: "Carmela Reyes", stu: 41 }]
  },
  {
    id: 3,
    n: "Prof Elec 2",
    c: "PE2",
    col: "CCIS",
    term: "1st Semester",
    st: "active",
    mod: 4,
    s: [{ sec: "BSIT 3C", fac: "Jomar Villareal", stu: 41 }]
  },
  {
    id: 4,
    n: "GE PPC",
    c: "PPC",
    col: "GE",
    term: "1st Semester",
    st: "active",
    mod: 4,
    s: [{ sec: "BSCRIM 1B", fac: "Andrea Mae Salazar", stu: 44 }, { sec: "BSET 1A", fac: "Andrea Mae Salazar",
      stu: 36 }]
  },
  {
    id: 5,
    n: "GE Ethics",
    c: "ETH",
    col: "GE",
    term: "1st Semester",
    st: "active",
    mod: 4,
    s: [{ sec: "BSCRIM 4A", fac: "Rico Mendoza", stu: 39 }]
  },
  {
    id: 6,
    n: "IT 313",
    c: "IT313",
    col: "CCIS",
    term: "1st Semester",
    st: "active",
    mod: 4,
    s: [{ sec: "BSIT 3B", fac: "", stu: 35 }]
  }
];
var REQ = [
  { n: "Ana Reyes", t: "Delete my data", d: "Oct 20", st: "new" },
  { n: "Mika Tan", t: "Export my data", d: "Oct 21", st: "new" }
];
var AU = [
  ["Oct 21, 3:40 PM", "Admin", "Assigned Carmela Reyes to Research Methods BSIT 3C"],
  ["Oct 20, 10:05 AM", "Admin", "Added faculty account jomar.villareal"],
  ["Oct 19, 9:12 AM", "Admin", "Changed match level to 3"]
];
var LB = ["Very loose", "Loose", "Balanced", "Strict", "Very strict"], TH = [.3, .45, .6, .75, .85], NAV = [
  ["home", "Overview"],
  ["users", "Users"],
  ["crs", "Courses"],
  ["ai", "AI settings"],
  ["pv", "Privacy"],
  ["an", "Analytics"]
];
var S = {
  cx: {},
  v: "home",
  sb: innerWidth > 760,
  pm: false,
  uf: "All",
  q: "",
  pt: "req",
  lv: 3,
  gen: true,
  pv: null,
  rng: 7,
  ret: "180 days",
  web: true
};

function toast(t) {
  var e = $("toast");
  e.textContent = t;
  e.className = "show";
  clearTimeout(toast.t);
  toast.t = setTimeout(function () {
    e.className = ""
  }, 1900)
}

function log(t) {
  AU.unshift(["Just now", "Admin", t])
}

function go(v) {
  S.v = v;
  if (innerWidth <= 760) S.sb = false;
  render()
}

function pend() {
  return REQ.filter(function (r) {
    return r.st === "new"
  }).length
}

function render() {
  tipOff();
  fdClose();
  var r = $("root"), k = [S.v, S.sb, S.pt, S.rng, S.uf, S.pv && 1].join("|");
  r.className = k !== window.K ? "enter" : "";
  window.K = k;
  r.innerHTML = app()
}

function app() {
  var side = S.sb ? '<aside id="sb"><div style="font-weight:800;font-size:16px;padding:4px 10px 12px">LearnLink <span class="chip pr">Admin</span></div>' +
    NAV.map(function (n) {
    return '<button class="it' + (S.v === n[0] ? " on" : "") + '" onclick="go(\'' + n[0] + '\')"><span>' +
      n[1] + "</span>" + (n[0] === "pv" && pend() ? '<span class="nb">' + pend() + "</span>" : "") + "</button>"
  }).join("") + '</aside>' : "";
  var tb = '<div class="top"><div style="display:flex;align-items:center;gap:8px"><button class="g" aria-label="Menu" onclick="S.sb=!S.sb;render()" style="font-size:18px">☰</button><b>' +
    (NAV.filter(function (n) {
    return n[0] === S.v
  })[0][1]) + '</b></div><button class="g" aria-label="Profile" onclick="event.stopPropagation();S.pm=!S.pm;render()" style="padding:2px"><span style="display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--acb);color:var(--ac);font-weight:800;font-size:12px">AD</span></button></div>';
  var dd = S.pm ? '<div class="dd"><div style="cursor:default"><b>Admin</b><br><span class="sm">admin@bisu.edu.ph</span></div><div onclick="doLogout()" style="color:var(--er)">Log out</div></div>' : "";
  var b = { home: home, users: users, crs: crs, ai: ai, pv: pv, an: an }[S.v]();
  return '<div id="app" onclick="if(S.pm){S.pm=false;render()}">' + side + "<main>" + tb + '<div class="sc">' +
    b + "</div></main>" + dd + "</div>"
}
/* ===== navigation helpers ===== */
function nav(v, fn) {
  closeM();
  go(v);
  if (fn) setTimeout(fn, 30)
}

function goUsers(f) {
  UF = Object.assign({ q: "", col: "all", role: "all", st: "all", rg: "all", from: "", to: "" }, f || {});
  nav("users")
}

function goCrs(f) {
  CF = Object.assign({ q: "", col: "all", fac: "all", st: "all", att: false, sort: "name" }, f || {});
  nav("crs")
}

function goCourse(id) {
  CF = { q: "", col: "all", fac: "all", st: "all", att: false, sort: "name" };
  S.cx[id] = true;
  nav("crs", function () {
    flashC(id)
  })
}

function flashC(id) {
  var e = $("c" + id);
  if (!e) return;
  e.scrollIntoView({ behavior: "smooth", block: "center" });
  e.classList.add("flash");
  setTimeout(function () {
    e.classList.remove("flash")
  }, 1900)
}

function mfoot(l, r) {
  return '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:18px"><button onclick="closeM()">Close</button>' +
    (l || "") + (r || "") + "</div>"
}

function bars(items, total) {
  return items.map(function (it) {
    return '<button class="rowb" onclick="' + it[2] + '"><span class="rl">' + it[0] + '</span><span class="bar"><i style="width:' +
      (total ? it[1] / total * 100 : 0) + '%"></i></span><b class="rv">' + it[1].toLocaleString() + '</b><span class="ar">›</span></button>'
  }).join("")
}

function barsD(items, total) {
  return items.map(function (it) {
    return '<div class="rowb rowd"><span class="rl">' + it[0] + '</span><span class="bar"><i style="width:' +
      (total ? it[1] / total * 100 : 0) + '%"></i></span><b class="rv">' + it[1].toLocaleString() + "</b></div>"
  }).join("")
}

function colName(k) {
  return "<b>" + k + '</b><div class="sm">' + E(COLG[k] ? COLG[k][0] : k === "GE" ? "General Education" : "") + "</div>"
}

/* ===== questions-per-day data (last 7 days is the source of truth; 30 days is built around it) ===== */
/* headline counts; the live block (admin-live.js) replaces them with database numbers */
var ADM = { stu: 1186, stuW: 38, fac: 38, facW: 2, active: 610 };
var Q7 = [[201, 83], [243, 85], [262, 84], [284, 86], [236, 83], [302, 82], [312, 84]];
var ACR = [
  ["Information Assurance", 88, 560],
  ["Research Methods", 81, 410],
  ["Prof Elec 2", 76, 380],
  ["GE Ethics", 72, 300]
];
var SS = { active: 1121, pending: 41, inactive: 24 }, SC = { CCIS: 612, CCJ: 298, CTAS: 276 }, FS = { active: 34,
  pending: 3, inactive: 1 }, FC = { CCIS: 18, CCJ: 8, CTAS: 12 };
var QSRC = [["Answered from modules", 262], ["Web search", 38], ["General knowledge", 7], ["Offline (closest passages)",
  5]], QH = [3, 9, 22, 35, 41, 33, 19, 27, 38, 34, 24, 13, 7, 4, 2, 1], QT = [
  ["CIA triad", 38],
  ["Risk management", 27],
  ["Cryptography basics", 22],
  ["Research methodology", 19],
  ["Flexbox and grid", 15]
];

function DAYS(n) {
  var now = new Date(), a = [], i, mk = function (t, m, k) {
    return { d: new Date(now.getFullYear(), now.getMonth(), now.getDate() - k), t: t, m: m }
  };
  if (n === 7) {
    for (i = 0; i < 7; i++) a.push(mk(Q7[i][0], Math.round(Q7[i][0] * Q7[i][1] / 100), 6 - i));
    return a
  }
  var raw = [], tot = 0, x;
  for (i = 0; i < 23; i++) {
    x = 256 + 48 * Math.sin(i * .7) + 18 * Math.cos(i * 1.9);
    raw.push(x);
    tot += x
  }
  var v = raw.map(function (y) {
    return Math.round(y * 5888 / tot)
  }), df = 5888 - v.reduce(function (p, q) {
    return p + q
  }, 0);
  v[11] += df;
  for (i = 0; i < 23; i++) a.push(mk(v[i], Math.round(v[i] * (82 + (i * 5) % 6) / 100), 29 - i));
  for (i = 0; i < 7; i++) a.push(mk(Q7[i][0], Math.round(Q7[i][0] * Q7[i][1] / 100), 6 - i));
  return a
}

function tsum(a, k) {
  return a.reduce(function (s, x) {
    return s + x[k]
  }, 0)
}

function pc(x) {
  return x.t ? Math.round(x.m / x.t * 100) : 0
}

function dl(d) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

function rngSeg() {
  return '<div class="seg" style="margin:0">' + [7, 30].map(function (n) {
    return '<button class="' + (S.rng === n ? "on" : "") + '" onclick="S.rng=' + n + ';render()">Last ' +
      n + " days</button>"
  }).join("") + "</div>"
}

/* ===== the chart: stacked bars, hover for a tooltip, click for that day's details ===== */
function qchart(n) {
  var d = DAYS(n), mx = Math.max.apply(null, d.map(function (x) {
    return x.t
  })), st = mx <= 20 ? 4 : mx <= 200 ? 40 : 400, ym = Math.max(st, Math.ceil(mx / st) * st), big = n > 7, gap = big ? 3 : 10, g = "", y = "", h = "", xl = "",
    i;
  for (i = 0; i <= 4; i++) {
    g += '<div class="qg" style="bottom:' + i * 25 + '%"></div>';
    y += '<span style="bottom:' + i * 25 + '%">' + ym / 4 * i + "</span>"
  }
  d.forEach(function (x, i) {
    var o = x.t - x.m, show = big ? (d.length - 1 - i) % 5 === 0 : true;
    h += '<button class="qcol" aria-label="' + EA(dl(x.d)) + ": " + x.t + " questions, " + pc(x) + '% from modules. Open details" onmouseenter="tipOn(event,' +
      i + ')" onmousemove="tipMv(event)" onmouseleave="tipOff()" onclick="dayM(' + i + ')"><span class="qs" style="height:' +
      (x.t / ym * 100).toFixed(1) + "%;width:" + (big ? 80 : 70) + '%"><i style="height:' + (o / x.t * 100).toFixed(1) +
      '%;background:var(--sh)"></i><i style="height:' + (x.m / x.t * 100).toFixed(1) + '%;background:var(--ac)"></i></span></button>';
    xl += "<span>" + (show ? (i === d.length - 1 ? "Today" : x.d.toLocaleDateString("en-US", big ? { month: "short",
      day: "numeric" } : { weekday: "short" })) : "") + "</span>"
  });
  return '<div class="qc" style="--qgap:' + gap + 'px"><div class="qy">' + y + '</div><div class="qp">' +
    g + '<div class="qb">' + h + '</div></div></div><div class="qx" style="--qgap:' + gap + 'px"><div style="width:30px;flex-shrink:0"></div><div class="qxl">' +
    xl + "</div></div>"
}

function tipOn(e, i) {
  var x = DAYS(S.rng)[i], t = $("tip");
  t.innerHTML = "<b>" + dl(x.d) + "</b><br>" + x.t + " questions · " + pc(x) + "% from modules";
  t.style.opacity = 1;
  tipMv(e)
}

function tipMv(e) {
  var t = $("tip");
  t.style.left = Math.max(6, Math.min(e.clientX + 12, innerWidth - t.offsetWidth - 6)) + "px";
  t.style.top = (e.clientY > 70 ? e.clientY - 54 : e.clientY + 18) + "px"
}

function tipOff() {
  var t = $("tip");
  if (t) t.style.opacity = 0
}

function achart() {
  var d = DAYS(S.rng), T = tsum(d, "t"), M = tsum(d, "m");
  return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><b style="font-size:16px">Questions per day</b><div class="sm">' +
    T.toLocaleString() + " questions · " + Math.round(T / d.length) + "/day average · " + (T ? Math.round(M / T * 100) : 0) +
    '% answered from modules</div></div>' + rngSeg() + "</div>" + qchart(S.rng) + '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px"><div style="display:flex;gap:14px;flex-wrap:wrap"><span class="lg"><i style="background:var(--ac)"></i>Answered from modules</span><span class="lg"><i style="background:var(--sh)"></i>Web, general and offline</span></div><span class="sm">Click a bar for that day’s details</span></div></div>'
}

function crsRates() {
  return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>Answered from modules, by course</b><span class="sm">Click for details</span></div><div style="margin-top:6px">' +
    ACR.map(function (c, i) {
    return '<button class="rowb" onclick="crsStat(' + i + ')"><span class="rl">' + E(c[0]) + '</span><span class="bar"><i style="width:' +
      c[1] + '%"></i></span><b class="rv">' + c[1] + '%</b><span class="ar">›</span></button>'
  }).join("") + "</div></div>"
}

function recentAct() {
  return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><b>Recent activity</b><button class="lnk" onclick="S.pt=\'log\';nav(\'pv\')">View audit log →</button></div>' +
    AU.slice(0, 5).map(function (a) {
    return '<div class="row"><span class="sm" style="width:104px">' + a[0] + '</span><span style="flex:1;min-width:140px">' +
      E(a[2]) + "</span></div>"
  }).join("") + "</div>"
}

/* ===== detail modals ===== */
function dayM(i) {
  var d = DAYS(S.rng), x = d[i], p = d[i - 1], today = i === d.length - 1, o = x.t - x.m, cmp = "";
  if (p) {
    var df = p.t ? Math.round((x.t - p.t) / p.t * 100) : 0;
    cmp = '<div class="' + (df < 0 ? "dl neg" : "dl") + '" style="margin-top:2px">' + (df >= 0 ? "▲ " : "▼ ") +
      Math.abs(df) + "% vs the day before (" + p.t + ")</div>"
  }
  openM(mhead(dl(x.d) + (today ? " · Today" : ""), '<div class="sm">Questions students asked LearnLink</div>') +
    '<div class="big2">' + x.t + "</div>" + cmp + '<div class="mh">Where the answers came from</div>' + barsD([["From modules",
    x.m], ["Outside the modules", o]], x.t).replace(/<b class="rv">(\d+)<\/b>/g, function (m, n) {
    return '<b class="rv">' + n + " · " + Math.round(n / x.t * 100) + "%</b>"
  }) + '<p class="sm" style="margin:12px 0 0">Totals only. No individual student activity is shown.</p>' +
    mfoot('<button class="p" onclick="nav(\'an\')">Open analytics</button>'))
}

function crsStat(i) {
  var a = ACR[i], f = S.live ? 1 : (S.rng === 7 ? 1 : 4.2), q = Math.round(a[2] * f), m = Math.round(q * a[1] / 100), c = CRS.filter(function (x) {
    return x.n === a[0]
  })[0];
  openM(mhead(a[0], '<div class="sm">Last ' + S.rng + " days</div>") + '<div style="display:flex;align-items:baseline;gap:8px"><div class="big2">' +
    a[1] + '%</div><span class="sm">answered from modules</span></div><div class="bar" style="margin:12px 0"><i style="width:' +
    a[1] + '%"></i></div>' + barsD([["Questions asked", q], ["Answered from modules", m], ["Outside the modules",
    q - m]], q) + '<p class="sm" style="margin:12px 0 0">A low rate usually means students are asking about topics the modules don’t cover yet. Ask the instructor to add module content, or adjust the match level in AI settings.</p>' +
    mfoot('<button onclick="nav(\'ai\')">AI settings</button>', c ? '<button class="p" onclick="goCourse(' +
    c.id + ')">Open course</button>' : ""))
}

function stuM() {
  var rec = U.filter(function (u) {
    return u.r === "Student"
  }).sort(function (a, b) {
    return a.j < b.j ? 1 : -1
  }).slice(0, 4);
  openM(mhead("Students", '<div class="sm">Everyone registered as a student</div>') + '<div class="big2">' + ADM.stu.toLocaleString() + '</div><div class="dl">+' + ADM.stuW + ' joined this week</div><div class="mh">By status</div>' +
    bars([
    ["Active", SS.active, "goUsers({role:'Student',st:'active'})"],
    ["Pending verification", SS.pending, "goUsers({role:'Student',st:'pending'})"],
    ["Inactive", SS.inactive, "goUsers({role:'Student',st:'inactive'})"]
  ], ADM.stu) + '<div class="mh">By college</div>' + bars(Object.keys(SC).map(function (k) {
    return [colName(k), SC[k], "goUsers({role:'Student',col:'" + k + "'})"]
  }), ADM.stu) + '<div class="mh">Recently joined</div>' + rec.map(function (u) {
    return '<button class="rowb" onclick="editU(' + u.id + ')"><span style="flex:1;min-width:0"><b>' + E(u.n) +
      '</b><div class="sm">' + E(u.prg || "") + " · Joined " + fmtD(u.j) + "</div></span>" + stChip(u.st) +
      '<span class="ar">›</span></button>'
  }).join("") + mfoot('<button onclick="nav(\'users\',function(){addU(\'Student\')})">+ Add student</button>',
    '<button class="p" onclick="goUsers({role:\'Student\'})">View all students</button>'), true)
}

function facLoad(n) {
  var s = 0, cs = [];
  CRS.forEach(function (c) {
    var k = c.s.filter(function (x) {
      return x.fac === n
    }).length;
    if (k) {
      s += k;
      cs.push(c.c)
    }
  });
  return s ? s + " section" + (s > 1 ? "s" : "") + " · " + cs.join(", ") : "No sections assigned"
}

function facM() {
  var F = U.filter(function (u) {
    return u.r === "Faculty"
  });
  openM(mhead("Faculty", '<div class="sm">Everyone registered as faculty</div>') + '<div class="big2">' + ADM.fac + '</div><div class="dl">+' + ADM.facW + ' joined this week</div><div class="mh">By college</div>' +
    bars(Object.keys(FC).map(function (k) {
    return [colName(k), FC[k], "goUsers({role:'Faculty',col:'" + k + "'})"]
  }), ADM.fac) + '<div class="mh">By status</div>' + bars([
    ["Active", FS.active, "goUsers({role:'Faculty',st:'active'})"],
    ["Pending verification", FS.pending, "goUsers({role:'Faculty',st:'pending'})"],
    ["Inactive", FS.inactive, "goUsers({role:'Faculty',st:'inactive'})"]
  ], ADM.fac) + '<div class="mh">Teaching load</div>' + F.map(function (u) {
    return '<button class="rowb" onclick="editU(' + u.id + ')"><span style="flex:1;min-width:0"><b>' + E(u.n) +
      '</b><div class="sm">' + E(facLoad(u.n)) + "</div></span>" + stChip(u.st) + '<span class="ar">›</span></button>'
  }).join("") + mfoot('<button onclick="nav(\'users\',function(){addU(\'Faculty\')})">+ Add faculty</button>',
    '<button class="p" onclick="goUsers({role:\'Faculty\'})">View all faculty</button>'), true)
}

function crsM() {
  var sec = CRS.reduce(function (a, c) {
    return a + c.s.length
  }, 0), stu = CRS.reduce(function (a, c) {
    return a + cStu(c)
  }, 0), nc = CRS.filter(cAtt).length;
  openM(mhead("Courses", '<div class="sm">Click a course to open it</div>') + '<div class="big2">' + CRS.length +
    '</div><div class="sm">' + sec + " sections · " + stu.toLocaleString() + " students enrolled · " + (nc ? '<b style="color:var(--er)">' +
    nc + " need attention</b>" : "all sections have an instructor") + "</div>" + '<div class="mh">All courses</div>' +
    (CRS.length ? CRS.map(function (c) {
    var ins = cFac(c);
    return '<button class="rowb" onclick="goCourse(' + c.id + ')"><span style="flex:1;min-width:0"><b>' +
      E(c.n) + '</b> <span class="chip">' + E(c.c) + '</span><div class="sm">' + c.s.length + " section" + (c.s.length === 1 ? "" : "s") +
      " · " + cStu(c) + " students · " + (ins.length ? E(ins.join(", ")) : "No instructor") + "</div></span>" +
      (c.st === "archived" ? '<span class="chip fl">Archived</span>' : cAtt(c) ? '<span class="chip pr">Needs attention</span>' : "") +
      '<span class="ar">›</span></button>'
  }).join("") : '<p class="sm">No courses yet.</p>') + mfoot('<button onclick="nav(\'crs\',function(){addC()})">+ Create course</button>',
    '<button class="p" onclick="goCrs()">Manage courses</button>'), true)
}

function qM() {
  var hr = function (i) {
    var h = 6 + i;
    return (h % 12 || 12) + (h < 12 ? "a" : "p")
  }, mx = Math.max.apply(null, QH), pk = QH.indexOf(mx), td = DAYS(7)[6];
  openM(mhead("Questions today", '<div class="sm">Where today’s ' + td.t + " questions were answered</div>") +
    '<div class="big2">' + td.t + '</div><div class="mh">Answer source</div>' + barsD(QSRC, td.t) + '<div class="mh">Busiest hours</div><div style="display:flex;align-items:flex-end;gap:3px;height:80px;margin-top:6px">' +
    QH.map(function (v, i) {
    return '<div title="' + hr(i) + ": " + v + ' questions" style="flex:1;height:' + v / mx * 100 + "%;border-radius:4px 4px 2px 2px;background:" +
      (i === pk ? "var(--ac)" : "var(--bd2)") + '"></div>'
  }).join("") + '</div><div style="display:flex;gap:3px">' + QH.map(function (v, i) {
    return '<span class="sm" style="flex:1;text-align:center;font-size:10px">' + (i % 3 === 0 ? hr(i) : "") +
      "</span>"
  }).join("") + '</div><div class="sm" style="margin-top:6px">Busiest hour: ' + hr(pk) + " (" + mx + " questions)</div>" +
    '<div class="mh">Most asked topics</div>' + barsD(QT, QT[0][1]) + '<p class="sm" style="margin:12px 0 0">Totals only. No individual student activity is shown.</p>' +
    mfoot('<button class="p" onclick="nav(\'an\')">Open analytics</button>'), true)
}

/* ===== overview page ===== */
function home() {
  var nc = CRS.filter(cAtt).length, w = DAYS(7), td = w[6], yd = w[5], dq = yd.t ? Math.round((td.t - yd.t) / yd.t * 100) : 0,
    secs = CRS.reduce(function (a, c) {
    return a + c.s.length
  }, 0);
  var stat = function (fn, l, v, sub) {
    return '<button class="card stat" onclick="' + fn + '()"><div class="sm">' + l + '</div><div class="big">' +
      v + "</div>" + sub + '<div class="hint">View details</div></button>'
  };
  return '<h2 style="font-size:22px;margin-top:6px">Welcome back, Admin ✨</h2><p style="color:var(--t2);margin:2px 0 14px">Here is how LearnLink is doing today.</p>' +
    (pend() ? '<div class="card" style="background:var(--bt);display:flex;justify-content:space-between;align-items:center;gap:10px"><span><b>' +
    pend() + " data request" + (pend() > 1 ? "s" : "") + ' waiting</b><br><span class="sm" style="color:var(--wt)">Students asked to export or delete their data.</span></span><button class="p" onclick="S.pt=\'req\';go(\'pv\')">Review</button></div>' : "") +
    (nc ? '<div class="card" style="background:var(--erb);display:flex;justify-content:space-between;align-items:center;gap:10px"><span><b>' +
    nc + " course" + (nc > 1 ? "s" : "") + ' need' + (nc > 1 ? "" : "s") + ' attention</b><br><span class="sm" style="color:var(--er)">Some sections have no active instructor, so no one can upload materials.</span></span><button class="p" onclick="goCrs({att:true})">Fix now</button></div>' : "") +
    '<div class="cg">' + stat("stuM", "Students", ADM.stu.toLocaleString(), '<div class="dl">+' + ADM.stuW + ' this week</div>') + stat("facM",
    "Faculty", ADM.fac, '<div class="dl">+' + ADM.facW + ' this week</div>') + stat("crsM", "Courses", CRS.length, '<div class="sm">' +
    secs + " section" + (secs === 1 ? "" : "s") + "</div>") + stat("qM", "Questions today", td.t, '<div class="' +
    (dq < 0 ? "dl neg" : "dl") + '">' + (dq >= 0 ? "+" : "") + dq + "% vs yesterday</div>") + "</div>" + '<div class="card"><b>Quick actions</b><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button onclick="nav(\'users\',function(){addU(\'Student\')})">Add student</button><button onclick="nav(\'users\',function(){addU(\'Faculty\')})">Add faculty</button><button onclick="nav(\'crs\',function(){addC()})">Create course</button><button onclick="go(\'ai\')">AI settings</button><button onclick="go(\'an\')">View analytics</button></div></div>' +
    achart() + '<div class="two">' + crsRates() + recentAct() + "</div>"
}
/* users */
var COLG = {
  CCIS: ["College of Computing and Information Sciences", ["BS Information Technology", "BS Computer Science"]],
  CCJ: ["College of Criminal Justice", ["BS Criminology"]],
  CTAS: [
    "College of Technology and Allied Sciences",
    ["BSIT major in Food Preparation Services Management", "BS Electrical Technology", "BS Electronics Technology"]
  ]
}, POS = ["Instructor", "Assistant Professor", "Associate Professor", "Professor"], UID = 100;

function ago(d) {
  var x = new Date();
  x.setDate(x.getDate() - d);
  return x.toISOString().slice(0, 10)
}
var U = [
  {
    id: 1,
    n: "Ramon Dizon",
    e: "ramon.dizon@bisu.edu.ph",
    r: "Faculty",
    st: "active",
    col: "CCIS",
    eid: "F-2019-014",
    pos: "Associate Professor",
    j: ago(900)
  },
  {
    id: 2,
    n: "Carmela Reyes",
    e: "carmela.reyes@bisu.edu.ph",
    r: "Faculty",
    st: "active",
    col: "CCIS",
    eid: "F-2020-031",
    pos: "Assistant Professor",
    j: ago(700)
  },
  {
    id: 3,
    n: "Jomar Villareal",
    e: "jomar.villareal@bisu.edu.ph",
    r: "Faculty",
    st: "active",
    col: "CCIS",
    eid: "F-2021-007",
    pos: "Instructor",
    j: ago(520)
  },
  {
    id: 4,
    n: "Andrea Mae Salazar",
    e: "andrea.salazar@bisu.edu.ph",
    r: "Faculty",
    st: "active",
    col: "CTAS",
    eid: "F-2018-022",
    pos: "Professor",
    j: ago(1000)
  },
  {
    id: 5,
    n: "Rico Mendoza",
    e: "rico.mendoza@bisu.edu.ph",
    r: "Faculty",
    st: "pending",
    col: "CCJ",
    eid: "F-2026-010",
    pos: "Instructor",
    j: ago(2)
  },
  {
    id: 6,
    n: "Maria Santos",
    e: "maria.santos@bisu.edu.ph",
    r: "Student",
    st: "active",
    col: "CCIS",
    prg: "BS Information Technology",
    yr: "3rd year",
    sec: "C",
    sid: "2024-00123",
    un: "maria_santos",
    j: ago(400)
  },
  {
    id: 7,
    n: "Ana Reyes",
    e: "ana.reyes@bisu.edu.ph",
    r: "Student",
    st: "active",
    col: "CCIS",
    prg: "BS Computer Science",
    yr: "2nd year",
    sec: "B",
    sid: "2024-00311",
    un: "ana_reyes",
    j: ago(210)
  },
  {
    id: 8,
    n: "Jose Dela Cruz",
    e: "jose.delacruz@bisu.edu.ph",
    r: "Student",
    st: "active",
    col: "CCJ",
    prg: "BS Criminology",
    yr: "4th year",
    sec: "A",
    sid: "2022-00287",
    un: "jose_dc",
    j: ago(120)
  },
  {
    id: 9,
    n: "Mika Tan",
    e: "mika.tan@bisu.edu.ph",
    r: "Student",
    st: "inactive",
    col: "CTAS",
    prg: "BS Electronics Technology",
    yr: "1st year",
    sec: "C",
    sid: "2025-00342",
    un: "mika_tan",
    j: ago(60)
  },
  {
    id: 10,
    n: "Lia Gomez",
    e: "lia.gomez@bisu.edu.ph",
    r: "Student",
    st: "active",
    col: "CCIS",
    prg: "BS Information Technology",
    yr: "3rd year",
    sec: "B",
    sid: "2023-00298",
    un: "lia_gomez",
    j: ago(25)
  },
  {
    id: 11,
    n: "Paolo Ramos",
    e: "paolo.ramos@bisu.edu.ph",
    r: "Student",
    st: "pending",
    col: "CTAS",
    prg: "BS Electrical Technology",
    yr: "2nd year",
    sec: "A",
    sid: "2024-00415",
    un: "paolo_r",
    j: ago(5)
  },
  {
    id: 12,
    n: "Grace Villanueva",
    e: "grace.villanueva@bisu.edu.ph",
    r: "Student",
    st: "active",
    col: "CCJ",
    prg: "BS Criminology",
    yr: "1st year",
    sec: "B",
    sid: "2025-00501",
    un: "grace_v",
    j: ago(14)
  },
  {
    id: 13,
    n: "Dennis Alvarez",
    e: "dennis.alvarez@bisu.edu.ph",
    r: "Student",
    st: "active",
    col: "CTAS",
    prg: "BSIT major in Food Preparation Services Management",
    yr: "3rd year",
    sec: "C",
    sid: "2023-00377",
    un: "dennis_a",
    j: ago(9)
  }
];
var UF = { q: "", col: "all", role: "all", st: "all", rg: "all", from: "", to: "" };

function fmtD(s) {
  return new Date(s + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function filt() {
  var q = UF.q.toLowerCase(), cut = null;
  if (UF.rg !== "all" && UF.rg !== "custom") {
    var c = new Date();
    c.setDate(c.getDate() - (+UF.rg));
    cut = c.toISOString().slice(0, 10)
  }
  return U.filter(function (u) {
    return (UF.col === "all" || u.col === UF.col) && (UF.role === "all" || u.r === UF.role) && (UF.st === "all" ||
      u.st === UF.st) && (!cut || u.j >= cut) && (UF.rg !== "custom" || ((!UF.from || u.j >= UF.from) && (!UF.to ||
      u.j <= UF.to))) && (u.n + " " + u.e + " " + (u.sid || u.eid || "")).toLowerCase().indexOf(q) > -1
  })
}

function stChip(s) {
  return '<span class="chip ' + (s === "active" ? "ok" : s === "pending" ? "pr" : "fl") + '">' + (s === "active" ? "Active" : s === "pending" ? "Pending" : "Inactive") +
    "</span>"
}

function ulist() {
  var a = filt();
  if (!a.length) return '<p class="sm" style="padding:8px 0">No users match these filters.</p>';
  return '<div style="overflow-x:auto"><table class="tb"><thead><tr><th>User</th><th>Role</th><th>College</th><th>Date joined</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead><tbody>' +
    a.map(function (u) {
    return '<tr><td><b>' + E(u.n) + '</b><div class="sm">' + E(u.e) + " · " + E(u.sid || u.eid || "") + '</div></td><td><span class="chip' +
      (u.r === "Faculty" ? "" : " pr") + '">' + u.r + '</span></td><td title="' + E(COLG[u.col] ? COLG[u.col][0] : u.col || "") + '">' +
      u.col + "</td><td>" + fmtD(u.j) + "</td><td>" + stChip(u.st) + '</td><td style="text-align:right;white-space:nowrap"><button style="font-size:12px;padding:4px 12px" onclick="editU(' +
      u.id + ')">Edit</button> <button class="dng" style="font-size:12px;padding:4px 12px" onclick="delU(' +
      u.id + ')">Delete</button></td></tr>'
  }).join("") + "</tbody></table></div>"
}

function refUL() {
  $("ul").innerHTML = ulist();
  $("uc").textContent = "Showing " + filt().length + " of " + U.length + " users"
}

function clrF() {
  UF = { q: "", col: "all", role: "all", st: "all", rg: "all", from: "", to: "" };
  render()
}

function users() {
  var o = function (v, l, c) {
    return '<option value="' + v + '"' + (c === v ? " selected" : "") + ">" + l + "</option>"
  };
  return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px"><div><b style="font-size:18px">Users</b><div class="sm" id="uc">Showing ' +
    filt().length + " of " + U.length + ' users</div></div><div style="display:flex;gap:8px"><button onclick="addU(\'Student\')">+ Add student</button><button class="p" onclick="addU(\'Faculty\')">+ Add faculty</button></div></div>' +
    '<div class="card" style="padding:12px 14px"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input aria-label="Search users" placeholder="Search name, email, or ID" value="' +
    E(UF.q) + '" style="flex:2;min-width:180px" oninput="UF.q=this.value;refUL()">' + '<select aria-label="College or department" style="flex:1;min-width:140px" onchange="UF.col=this.value;refUL()">' +
    o("all", "All colleges", UF.col) + Object.keys(COLG).map(function (k) {
    return o(k, k + " · " + COLG[k][0], UF.col)
  }).join("") + "</select>" + '<select aria-label="Role" style="flex:1;min-width:110px" onchange="UF.role=this.value;refUL()">' +
    o("all", "All roles", UF.role) + o("Faculty", "Faculty", UF.role) + o("Student", "Student", UF.role) +
    "</select>" + '<select aria-label="Status" style="flex:1;min-width:110px" onchange="UF.st=this.value;refUL()">' +
    o("all", "All statuses", UF.st) + o("active", "Active", UF.st) + o("inactive", "Inactive", UF.st) + o("pending",
    "Pending", UF.st) + "</select>" + '<select aria-label="Date joined" style="flex:1;min-width:130px" onchange="UF.rg=this.value;render()">' +
    o("all", "Any date joined", UF.rg) + o("7", "Last 7 days", UF.rg) + o("30", "Last 30 days", UF.rg) + o("180",
    "Last 6 months", UF.rg) + o("custom", "Custom range…", UF.rg) + "</select>" + (UF.rg === "custom" ? '<input type="date" aria-label="Joined from" value="' +
    UF.from + '" onchange="UF.from=this.value;refUL()"><span class="sm">to</span><input type="date" aria-label="Joined to" value="' +
    UF.to + '" onchange="UF.to=this.value;refUL()">' : "") + '<button class="g" onclick="clrF()">Clear filters</button></div></div><div class="card" id="ul">' +
    ulist() + "</div>"
}
/* user modals */
function openM(h, w) {
  tipOff();
  $("mdh").innerHTML = '<div class="mdb" onclick="if(event.target===this)closeM()"><div class="mdl' + (w ? " wide" : "") +
    '" role="dialog" aria-modal="true" tabindex="-1">' + h + "</div></div>";
  var f = $("mdh").querySelector("input,select") || $("mdh").querySelector(".mdl");
  if (f) f.focus()
}

function closeM() {
  $("mdh").innerHTML = ""
}
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closeM()
});

function opt(l, c, ph) {
  return (ph ? '<option value="">' + ph + "</option>" : "") + l.map(function (x) {
    return "<option" + (x === c ? " selected" : "") + ">" + x + "</option>"
  }).join("")
}

function fld2(id, l, v, ph, ty) {
  return '<label class="fl2" for="' + id + '">' + l + '</label><input id="' + id + '" type="' + (ty || "text") +
    '" value="' + EA(v || "") + '" placeholder="' + EA(ph || "") + '" style="width:100%" oninput="$(\'me\').textContent=\'\'">'
}

function sel2(id, l, h, ch) {
  return '<label class="fl2" for="' + id + '">' + l + '</label><select id="' + id + '" style="width:100%"' +
    (ch ? ' onchange="' + ch + '"' : "") + ">" + h + "</select>"
}

function colOpts(c) {
  return '<option value="">Select college</option>' + Object.keys(COLG).map(function (k) {
    return '<option value="' + k + '"' + (k === c ? " selected" : "") + ">" + COLG[k][0] + " (" + k + ")</option>"
  }).join("")
}

function progUp(p, cur) {
  var c = $(p + "col").value, s = $(p + "prg");
  if (!s) return;
  s.innerHTML = '<option value="">' + (c ? "Select program" : "Select a college first") + "</option>" +
    ((c && COLG[c][1]) || []).map(function (x) {
    return "<option" + (x === cur ? " selected" : "") + ">" + x + "</option>"
  }).join("");
  if (c && !cur && COLG[c][1].length === 1) s.value = COLG[c][1][0]
}

function emIn(el) {
  $("me").textContent = "";
  var v = el.value;
  if (v.indexOf("@") === v.length - 1 && v.length > 1) el.value = v + "bisu.edu.ph"
}

function emDone(el) {
  var v = el.value.trim();
  if (v && v.indexOf("@") < 0) el.value = v + "@bisu.edu.ph"
}

function emFld(id, v) {
  return '<label class="fl2" for="' + id + '">BISU email</label><input id="' + id + '" type="email" placeholder="name@bisu.edu.ph" value="' +
    E(v || "") + '" style="width:100%" oninput="emIn(this)" onblur="emDone(this)"><div class="sm">Only @bisu.edu.ph emails are accepted.</div>'
}

function schoolF(role, p, u) {
  u = u || {};
  return role === "Student" ? sel2(p + "col", "College", colOpts(u.col), "progUp(\'" + p + "\')") + sel2(p +
    "prg", "Program", '<option value="">Select a college first</option>') + '<div class="g2">' + sel2(p +
    "yr", "Year level", opt(["1st year", "2nd year", "3rd year", "4th year"], u.yr, "Select")) + sel2(p +
    "sec", "Section", opt(["A", "B", "C", "D", "E", "F"], u.sec, "Select")) + "</div>" : sel2(p + "col", "College / department",
    colOpts(u.col)) + sel2(p + "pos", "Position (optional)", opt(POS, u.pos, "Select"))
}

function readF(role, p) {
  var g = function (k) {
    var e = $(p + k);
    return e ? e.value.trim() : ""
  };
  return {
    n: g("n"),
    e: g("e"),
    col: g("col"),
    prg: g("prg"),
    yr: g("yr"),
    sec: g("sec"),
    pos: g("pos"),
    sid: role === "Student" ? g("id") : "",
    eid: role === "Faculty" ? g("id") : "",
    un: g("un")
  }
}

function check(role, v, self) {
  if (v.n.length < 3) return "Enter the full name";
  if (role === "Student") {
    if (!/^\w{4,20}$/.test(v.un || "x_x_")) return "Username needs 4 to 20 letters, numbers, or underscores";
    if (!/^[0-9A-Za-z-]{5,}$/.test(v.sid)) return "Enter the student ID, like 2024-00123"
  } else if (v.eid.length < 3) return "Enter the employee ID";
  if (!/^[^\s@]+@bisu\.edu\.ph$/i.test(v.e)) return "Only BISU emails are accepted. Use name@bisu.edu.ph";
  if (U.some(function (u) {
    return u.e.toLowerCase() === v.e.toLowerCase() && u.id !== self
  })) return "That email already has an account";
  if (!v.col) return "Select a college";
  if (role === "Student" && (!v.prg || !v.yr || !v.sec)) return "Select the program, year level, and section";
  return ""
}

function mhead(t, x) {
  return '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><h3 style="font-size:18px">' +
    t + '</h3><button class="g" aria-label="Close" onclick="closeM()">✕</button></div>' + (x || "")
}

function addU(role) {
  var s = role === "Student";
  openM(mhead("Add user", '<div class="seg" style="margin:10px 0 0"><button class="' + (s ? "on" : "") +
    '" onclick="addU(\'Student\')">Student</button><button class="' + (s ? "" : "on") + '" onclick="addU(\'Faculty\')">Faculty</button></div>') +
    '<div class="mh">Personal details</div>' + fld2("a_n", "Full name", "", "Maria Santos") + '<div class="mh">Account</div>' +
    (s ? fld2("a_un", "Username", "", "maria_santos") + fld2("a_id", "Student ID", "", "2024-00123") : fld2("a_id",
    "Employee ID", "", "F-2026-001")) + emFld("a_e") + '<div class="mh">' + (s ? "School information" : "Work information") +
    "</div>" + schoolF(role, "a_") + '<p class="er" id="me"></p><p class="sm" style="margin:0 0 12px">They get a verification email and can only sign in after they verify. Until then the account stays Pending.</p><div style="display:flex;gap:8px;justify-content:flex-end"><button onclick="closeM()">Cancel</button><button class="p" onclick="saveAdd(\'' +
    role + '\')">Send invite</button></div>');
  if (s) progUp("a_")
}

function saveAdd(role) {
  var v = readF(role, "a_");
  v.sid = role === "Student" ? $("a_id").value.trim() : "";
  v.eid = role === "Faculty" ? $("a_id").value.trim() : "";
  var er = check(role, v);
  if (er) {
    $("me").textContent = er;
    return
  }
  var u = { id: ++ UID, n: v.n, e: v.e.toLowerCase(), r: role, st: "pending", col: v.col, j: ago(0) };
  if (role === "Student") {
    u.prg = v.prg;
    u.yr = v.yr;
    u.sec = v.sec;
    u.sid = v.sid;
    u.un = v.un
  } else {
    u.eid = v.eid;
    u.pos = v.pos
  }
  U.unshift(u);
  UF = { q: "", col: "all", role: "all", st: "all", rg: "all", from: "", to: "" };
  log("Added " + role.toLowerCase() + " account " + u.e);
  closeM();
  toast("Verification email sent to " + u.e);
  render()
}

function editU(id) {
  var u = U.filter(function (x) {
    return x.id === id
  })[0], s = u.r === "Student", pd = u.st === "pending";
  openM(mhead("Edit user", '<div style="margin-top:6px"><span class="chip' + (s ? " pr" : "") + '">' + u.r +
    '</span> <span class="sm">Joined ' + fmtD(u.j) + "</span></div>") + '<div class="mh">Personal details</div>' +
    fld2("u_n", "Full name", u.n) + '<div class="mh">Account</div>' + (s ? fld2("u_un", "Username", u.un) +
    fld2("u_id", "Student ID", u.sid) : fld2("u_id", "Employee ID", u.eid)) + emFld("u_e", u.e) + '<div class="mh">' +
    (s ? "School information" : "Work information") + "</div>" + schoolF(u.r, "u_", u) + '<div class="mh">Account status</div><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><b>Active</b><div class="sm">' +
    (pd ? "Pending: they can sign in after they verify their email." : "Inactive users can’t sign in. Their records are kept.") +
    '</div></div><button id="u_sw" class="sw' + (u.st === "active" ? " on" : "") + '" aria-label="Active" ' +
    (pd ? "disabled " : "") + 'onclick="this.classList.toggle(\'on\')"></button></div>' + (pd ? '<button style="margin-top:8px;font-size:12px;padding:4px 12px" onclick="log(\'Resent verification email to ' +
    u.e + '\');toast(\'Verification email sent again\')">Resend verification email</button>' : "") + '<p class="er" id="me"></p><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px"><button onclick="closeM()">Cancel</button><button class="p" onclick="saveEdit(' +
    id + ')">Save changes</button></div>');
  if (s) progUp("u_", u.prg)
}

function saveEdit(id) {
  var u = U.filter(function (x) {
    return x.id === id
  })[0], s = u.r === "Student", v = readF(u.r, "u_");
  v.sid = s ? $("u_id").value.trim() : "";
  v.eid = s ? "" : $("u_id").value.trim();
  var er = check(u.r, v, id);
  if (er) {
    $("me").textContent = er;
    return
  }
  u.n = v.n;
  u.e = v.e.toLowerCase();
  u.col = v.col;
  if (s) {
    u.prg = v.prg;
    u.yr = v.yr;
    u.sec = v.sec;
    u.sid = v.sid;
    u.un = v.un
  } else {
    u.eid = v.eid;
    u.pos = v.pos
  }
  var msg = "Edited user " + u.e;
  if (u.st !== "pending") {
    var ns = $("u_sw").classList.contains("on") ? "active" : "inactive";
    if (ns !== u.st) {
      msg += ns === "active" ? " and reactivated the account" : " and deactivated the account";
      u.st = ns
    }
  }
  log(msg);
  closeM();
  toast("Changes saved");
  render()
}

function delU(id) {
  var u = U.filter(function (x) {
    return x.id === id
  })[0];
  openM(mhead("Delete this user?") + '<p style="margin:12px 0 4px;line-height:1.6">Are you sure you want to delete <b>' +
    E(u.n) + '</b> (' + E(u.e) + ')?</p><p class="sm" style="margin:0 0 14px">This removes their account and chat history and can’t be undone. To keep their records, set them to Inactive instead.</p><div style="display:flex;gap:8px;justify-content:flex-end"><button onclick="closeM()">Cancel</button><button class="dng solid" onclick="confDel(' +
    id + ')">Confirm delete</button></div>')
}

function confDel(id) {
  var u = U.filter(function (x) {
    return x.id === id
  })[0];
  U = U.filter(function (x) {
    return x.id !== id
  });
  log("Deleted user " + u.e);
  closeM();
  toast("User deleted");
  render()
}
/* courses */
var CF = { q: "", col: "all", fac: "all", st: "all", att: false, sort: "name" };

function fac() {
  return U.filter(function (u) {
    return u.r === "Faculty" && u.st === "active"
  })
}

function gc(id) {
  return CRS.filter(function (c) {
    return c.id === id
  })[0]
}

function colLbl(k) {
  return k === "GE" ? "General Education" : COLG[k] ? COLG[k][0] : k || "No college"
}

function facOk(n) {
  return !!n && fac().some(function (f) {
    return f.n === n
  })
}

function cAtt(c) {
  return c.st === "active" && (!c.s.length || c.s.some(function (s) {
    return !facOk(s.fac)
  }))
}

function cStu(c) {
  return c.s.reduce(function (a, s) {
    return a + s.stu
  }, 0)
}

function cFac(c) {
  var m = {};
  c.s.forEach(function (s) {
    if (facOk(s.fac)) m[s.fac] = 1
  });
  return Object.keys(m)
}

function facOpts(sel) {
  return '<option value="">Select instructor…</option>' + fac().map(function (f) {
    return '<option value="' + EA(f.n) + '"' + (f.n === sel ? " selected" : "") + ">" + E(f.n) + "</option>"
  }).join("")
}

function cfilt() {
  var q = CF.q.toLowerCase().trim(), so = {
    name: function (x, y) {
      return x.n.localeCompare(y.n)
    },
    stu: function (x, y) {
      return cStu(y) - cStu(x)
    },
    sec: function (x, y) {
      return y.s.length - x.s.length
    },
    newest: function (x, y) {
      return y.id - x.id
    }
  };
  return CRS.filter(function (c) {
    if (CF.col !== "all" && c.col !== CF.col) return false;
    if (CF.st !== "all" && c.st !== CF.st) return false;
    if (CF.fac !== "all" && !c.s.some(function (s) {
      return s.fac === CF.fac
    })) return false;
    if (CF.att && !cAtt(c)) return false;
    if (q && (c.n + " " + c.c + " " + c.term + " " + colLbl(c.col) + " " + c.s.map(function (s) {
      return s.sec + " " + s.fac
    }).join(" ")).toLowerCase().indexOf(q) < 0) return false;
    return true
  }).sort(so[CF.sort] || so.name)
}

function ccount() {
  return "Showing " + cfilt().length + " of " + CRS.length + " course" + (CRS.length === 1 ? "" : "s")
}

function cstats() {
  var sec = CRS.reduce(function (a, c) {
    return a + c.s.length
  }, 0), stu = CRS.reduce(function (a, c) {
    return a + cStu(c)
  }, 0), nc = CRS.filter(cAtt).length;
  return '<button class="card stat" onclick="clrC()"><div class="sm">Courses</div><div class="big">' + CRS.length +
    '</div><div class="sm">Click to show all</div></button><div class="card"><div class="sm">Sections</div><div class="big">' +
    sec + '</div><div class="sm">across all courses</div></div><div class="card"><div class="sm">Students enrolled</div><div class="big">' +
    stu.toLocaleString() + '</div><div class="sm">in listed sections</div></div><button class="card stat' +
    (CF.att ? " on" : "") + '" onclick="CF.att=!CF.att;render()"><div class="sm">Needs attention</div><div class="big" style="color:' +
    (nc ? "var(--er)" : "var(--ok)") + '">' + nc + '</div><div class="sm">' + (nc ? (CF.att ? "Showing only these. Click to undo" : "No instructor assigned. Click to filter") : "Every section has an instructor") +
    "</div></button>"
}

function clist() {
  var a = cfilt();
  if (!CRS.length) return '<div class="card" style="text-align:center;padding:28px"><b>No courses yet</b><p class="sm">Create the first course, then add sections and assign instructors.</p><button class="p" onclick="addC()">+ Create course</button></div>';
  if (!a.length) return '<div class="card" style="text-align:center;padding:28px"><b>No courses match these filters</b><p class="sm">Try a different search, or clear the filters.</p><button onclick="clrC()">Clear filters</button></div>';
  return a.map(ccard).join("")
}

function refC() {
  if (!$("cl")) return;
  fdClose();
  $("cl").innerHTML = clist();
  $("cs").innerHTML = cstats();
  $("ccount").textContent = ccount()
}

function clrC() {
  CF = { q: "", col: "all", fac: "all", st: "all", att: false, sort: "name" };
  render()
}

function crs() {
  var o = function (v, l, c) {
    return '<option value="' + EA(v) + '"' + (c === v ? " selected" : "") + ">" + E(l) + "</option>"
  }, names = {};
  CRS.forEach(function (c) {
    c.s.forEach(function (s) {
      if (s.fac) names[s.fac] = 1
    })
  });
  var ins = Object.keys(names).sort();
  if (CF.fac !== "all" && !names[CF.fac]) CF.fac = "all";
  var allOpen = CRS.some(function (c) {
    return S.cx[c.id] !== false
  });
  return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px"><div><b style="font-size:18px">Courses</b><div class="sm" id="ccount">' +
    ccount() + '</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button onclick="tgAll()">' +
    (allOpen ? "Collapse all" : "Expand all") + '</button><button onclick="expC()" title="Downloads the courses currently shown">Export CSV</button><button class="p" onclick="addC()">+ Create course</button></div></div>' +
    '<div class="cg" id="cs">' + cstats() + "</div>" + '<div class="card" style="padding:12px 14px"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input id="cq" aria-label="Search courses" placeholder="Search courses, sections, instructors" value="' +
    EA(CF.q) + '" style="flex:2;min-width:200px" oninput="CF.q=this.value;refC()">' + '<select aria-label="College" style="flex:1;min-width:130px" onchange="CF.col=this.value;refC()">' +
    o("all", "All colleges", CF.col) + ["GE"].concat(Object.keys(COLG)).map(function (k) {
    return o(k, k + " · " + colLbl(k), CF.col)
  }).join("") + "</select>" + '<select aria-label="Instructor" style="flex:1;min-width:140px" onchange="CF.fac=this.value;refC()">' +
    o("all", "All instructors", CF.fac) + ins.map(function (n) {
    return o(n, n, CF.fac)
  }).join("") + "</select>" + '<select aria-label="Status" style="flex:1;min-width:110px" onchange="CF.st=this.value;refC()">' +
    o("all", "All statuses", CF.st) + o("active", "Active", CF.st) + o("archived", "Archived", CF.st) + "</select>" +
    '<select aria-label="Sort by" style="flex:1;min-width:130px" onchange="CF.sort=this.value;refC()">' +
    o("name", "Sort: Name A–Z", CF.sort) + o("stu", "Sort: Most students", CF.sort) + o("sec", "Sort: Most sections",
    CF.sort) + o("newest", "Sort: Newest", CF.sort) + "</select>" + '<button class="g" onclick="clrC()">Clear filters</button></div></div><div id="cl">' +
    clist() + "</div>"
}

function ccard(c) {
  var open = S.cx[c.id] !== false, att = cAtt(c), arch = c.st === "archived", ins = cFac(c), sb = 'style="font-size:12px;padding:4px 12px"';
  var h = '<div class="card' + (arch ? " arch" : "") + '" id="c' + c.id + '"><div class="chd"><button class="g chv" aria-expanded="' +
    open + '" aria-label="' + (open ? "Collapse " : "Expand ") + EA(c.n) + '" onclick="tgC(' + c.id + ')">' +
    (open ? "▾" : "▸") + '</button><div style="flex:1;min-width:160px"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="font-size:16px">' +
    E(c.n) + '</b><span class="chip">' + E(c.c) + "</span>" + (arch ? '<span class="chip fl">Archived</span>' : '<span class="chip ok">Active</span>') +
    (att ? '<span class="chip pr">Needs attention</span>' : "") + '</div><div class="sm">' + E(colLbl(c.col)) +
    " · " + E(c.term) + '</div></div><div class="cact"><button ' + sb + ' onclick="editC(' + c.id + ')">Edit</button><button ' +
    sb + ' onclick="arch(' + c.id + ')">' + (arch ? "Restore" : "Archive") + '</button><button class="dng" ' +
    sb + ' onclick="delC(' + c.id + ')">Delete</button></div></div>' + '<div class="cst"><span><b>' + c.s.length +
    "</b> section" + (c.s.length === 1 ? "" : "s") + "</span><span><b>" + cStu(c) + "</b> students</span><span><b>" +
    ins.length + "</b> instructor" + (ins.length === 1 ? "" : "s") + "</span><span><b>" + c.mod + "</b> module" +
    (c.mod === 1 ? "" : "s") + "</span></div>";
  if (!open) return h + "</div>";
  if (!c.s.length) h += '<p class="sm" style="margin:12px 0 4px">No sections yet. Add one below, then choose an instructor.</p>';
  c.s.forEach(function (s, si) {
    var bad = !facOk(s.fac);
    h += '<div class="row"><span style="width:96px;font-weight:700">' + E(s.sec) + '</span><span class="sm" style="width:96px">' +
      (s.stu ? s.stu + " students" : "No students yet") + '</span>' + fsel("", bad ? "" : s.fac, "Instructor for " +
      c.n + " " + s.sec, bad, 'data-m="sec" data-c="' + c.id + '" data-s="' + si + '"') + '<button class="g dng" aria-label="Remove section ' +
      EA(s.sec) + '" onclick="delS(' + c.id + "," + si + ')" style="padding:4px 10px">✕</button></div>' + (bad &&
      s.fac ? '<div class="er" style="margin:-2px 0 6px">' + E(s.fac) + " is not an active faculty account. Choose another instructor.</div>" : "")
  });
  return h + '<div class="row"><input id="ns' + c.id + '" aria-label="New section" placeholder="New section, like BSIT 4A" style="flex:1;min-width:150px" onkeydown="if(event.key===\'Enter\')addS(' +
    c.id + ')">' + fsel("nf" + c.id, "", "Instructor for the new section", false, 'data-m="new"') + '<button onclick="addS(' +
    c.id + ')">Add section</button></div><p class="er" id="ne' + c.id + '"></p></div>'
}

function fsel(id, val, aria, bad, data) {
  return '<button type="button" class="fsel' + (val ? "" : " ph") + '"' + (id ? ' id="' + id + '"' : "") +
    ' value="' + EA(val) + '" aria-haspopup="listbox" aria-expanded="false" aria-label="' + EA(aria) + '" ' +
    data + ' onclick="fdOpen(this)" style="flex:1;min-width:170px' + (bad ? ";border-color:var(--er)" : "") +
    '"><span>' + (val ? E(val) : "Select instructor…") + "</span><i>▾</i></button>"
}
var FD = null;

function fdClose() {
  var p = $("fdp");
  if (p) p.remove();
  if (FD && FD.b) {
    FD.b.setAttribute("aria-expanded", "false")
  }
  FD = null
}

function fdOpen(b) {
  if (FD && FD.b === b) {
    fdClose();
    return
  }
  fdClose();
  FD = { b: b, items: [], i: 0, t: Date.now() };
  b.setAttribute("aria-expanded", "true");
  var p = D.createElement("div");
  p.id = "fdp";
  p.innerHTML = '<input id="fdq" type="text" placeholder="Search faculty…" aria-label="Search faculty" autocomplete="off" oninput="fdFill(this.value)" onkeydown="fdKey(event)"><div id="fdl" role="listbox"></div>';
  D.body.appendChild(p);
  fdFill("");
  fdPos();
  $("fdq").focus({ preventScroll: true })
}

function fdFill(q) {
  if (!FD) return;
  q = q.toLowerCase().trim();
  var cur = FD.b.value, a = fac().filter(function (f) {
    return (f.n + " " + (f.pos || "") + " " + f.col + " " + f.e).toLowerCase().indexOf(q) > -1
  }).map(function (f) {
    return { n: f.n, sub: [f.pos, f.col].filter(Boolean).join(" · ") }
  });
  FD.items = (q ? [] : [{ n: "", sub: "", none: 1 }]).concat(a);
  FD.i = Math.max(0, FD.items.map(function (x) {
    return x.n
  }).indexOf(cur));
  if (q) FD.i = 0;
  fdDraw();
  fdPos()
}

function fdDraw() {
  var l = $("fdl");
  if (!l || !FD) return;
  var cur = FD.b.value;
  l.innerHTML = FD.items.length ? FD.items.map(function (x, i) {
    return '<div class="fo' + (i === FD.i ? " on" : "") + (x.n === cur && !x.none ? " cur" : "") + '" role="option" onmousedown="event.preventDefault()" onclick="fdPick(' +
      i + ')" onmousemove="if(FD.i!==(' + i + ')){FD.i=' + i + ';fdDraw()}">' + (x.none ? '<span class="sm">No instructor</span>' : "<b>" +
      E(x.n) + '</b><div class="sm">' + E(x.sub) + "</div>") + "</div>"
  }).join("") : '<div class="fe">No faculty match “' + E($("fdq").value) + "”.</div>";
  var on = l.querySelector(".on");
  if (on) on.scrollIntoView({ block: "nearest" })
}

function fdPos() {
  var p = $("fdp");
  if (!p || !FD) return;
  var r = FD.b.getBoundingClientRect(), w = Math.min(Math.max(r.width, 280), innerWidth - 16);
  p.style.width = w + "px";
  p.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + "px";
  var h = p.offsetHeight, below = innerHeight - r.bottom - 8;
  p.style.top = (below < h && r.top > below ? Math.max(8, r.top - h - 4) : r.bottom + 4) + "px"
}

function fdKey(e) {
  if (!FD) return;
  var n = FD.items.length;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (n) {
      FD.i = (FD.i + 1) % n;
      fdDraw()
    }
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    if (n) {
      FD.i = (FD.i - 1 + n) % n;
      fdDraw()
    }
  } else if (e.key === "Enter") {
    e.preventDefault();
    if (n) fdPick(FD.i)
  } else if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    var b = FD.b;
    fdClose();
    b.focus()
  } else if (e.key === "Tab") fdClose()
}

function fdPick(i) {
  var x = FD.items[i], b = FD.b, d = b.dataset;
  fdClose();
  if (!x) return;
  if (d.m === "sec") {
    var c = gc(+d.c);
    if (c.s[+d.s].fac !== x.n) setFac(+d.c, +d.s, x.n)
  } else {
    b.value = x.n;
    b.firstChild.textContent = x.n || "Select instructor…";
    b.classList.toggle("ph", !x.n)
  }
}
D.addEventListener("mousedown", function (e) {
  if (FD && !$("fdp").contains(e.target) && !FD.b.contains(e.target)) fdClose()
});
addEventListener("scroll", function (e) {
  if (FD && e.target.id !== "fdl" && Date.now() - FD.t > 400) fdClose()
}, true);
addEventListener("resize", fdClose);

function tgC(id) {
  S.cx[id] = S.cx[id] === false;
  refC()
}

function tgAll() {
  var o = CRS.some(function (c) {
    return S.cx[c.id] !== false
  });
  CRS.forEach(function (c) {
    S.cx[c.id] = !o
  });
  render()
}

function addS(id) {
  var c = gc(id), v = $("ns" + id).value.trim(), f = $("nf" + id).value, e = $("ne" + id);
  if (v.length < 2) {
    e.textContent = "Enter a section name, like BSIT 4A";
    return
  }
  if (c.s.some(function (s) {
    return s.sec.toLowerCase() === v.toLowerCase()
  })) {
    e.textContent = v + " already exists in this course";
    return
  }
  c.s.push({ sec: v, fac: f, stu: 0 });
  log("Added section " + v + " to " + c.n + (f ? " with " + f : ""));
  toast(f ? "Section added" : "Section added. Choose an instructor.");
  refC()
}

function setFac(id, si, f) {
  var c = gc(id), s = c.s[si];
  s.fac = f;
  log(f ? "Assigned " + f + " to " + c.n + " " + s.sec : "Removed the instructor from " + c.n + " " + s.sec);
  toast(f ? f + " can now upload materials" : "Instructor removed");
  refC()
}

function arch(id) {
  var c = gc(id);
  c.st = c.st === "active" ? "archived" : "active";
  log((c.st === "archived" ? "Archived" : "Restored") + " course " + c.n);
  toast(c.st === "archived" ? "Course archived" : "Course restored");
  refC()
}

function delS(id, si) {
  var c = gc(id), s = c.s[si];
  openM(mhead("Remove this section?") + '<p style="margin:12px 0 4px;line-height:1.6">Remove <b>' + E(s.sec) +
    "</b> from <b>" + E(c.n) + '</b>?</p><p class="sm" style="margin:0 0 14px">The instructor can no longer upload materials for this section. This can’t be undone.</p><div style="display:flex;gap:8px;justify-content:flex-end"><button onclick="closeM()">Cancel</button><button class="dng solid" onclick="confS(' +
    id + "," + si + ')">Remove section</button></div>')
}

function confS(id, si) {
  var c = gc(id), s = c.s.splice(si, 1)[0];
  log("Removed section " + s.sec + " from " + c.n);
  closeM();
  toast("Section removed");
  refC()
}

function delC(id) {
  var c = gc(id);
  openM(mhead("Delete this course?") + '<p style="margin:12px 0 4px;line-height:1.6">Are you sure you want to delete <b>' +
    E(c.n) + "</b> (" + E(c.c) + ")?</p><p class=\"sm\" style=\"margin:0 0 14px\">This removes its " + c.s.length +
    " section" + (c.s.length === 1 ? "" : "s") + " and all instructor assignments. It can’t be undone. To keep the records, archive the course instead.</p>" +
    '<div style="display:flex;gap:8px;justify-content:flex-end"><button onclick="closeM()">Cancel</button><button class="dng solid" onclick="confC(' +
    id + ')">Confirm delete</button></div>')
}

function confC(id) {
  var c = gc(id);
  CRS = CRS.filter(function (x) {
    return x.id !== id
  });
  log("Deleted course " + c.n);
  closeM();
  toast("Course deleted");
  render()
}

function cform(c) {
  c = c || {};
  var ks = ["GE"].concat(Object.keys(COLG));
  return fld2("c_n", "Course name", c.n, "Information Assurance") + fld2("c_c", "Course code", c.c, "IA") +
    sel2("c_col", "College", '<option value="">Select college</option>' + ks.map(function (k) {
    return '<option value="' + k + '"' + (k === c.col ? " selected" : "") + ">" + (k === "GE" ? "General Education (GE)" : E(COLG[k][0]) +
      " (" + k + ")") + "</option>"
  }).join("")) + sel2("c_t", "Term", opt(TERMS, c.term || TERMS[0])) + (c.id ? sel2("c_st", "Status", '<option value="active"' +
    (c.st === "active" ? " selected" : "") + '>Active</option><option value="archived"' + (c.st === "archived" ? " selected" : "") +
    ">Archived</option>") : "") + '<p class="er" id="me"></p>'
}

function addC() {
  openM(mhead("Create a course", '<div class="sm">You can add sections and instructors right after.</div>') +
    cform() + '<div style="display:flex;gap:8px;justify-content:flex-end"><button onclick="closeM()">Cancel</button><button class="p" onclick="saveC(0)">Create course</button></div>')
}

function editC(id) {
  var c = gc(id);
  openM(mhead("Edit course") + cform(c) + '<div style="display:flex;gap:8px;justify-content:flex-end"><button onclick="closeM()">Cancel</button><button class="p" onclick="saveC(' +
    id + ')">Save changes</button></div>')
}

function saveC(id) {
  var n = $("c_n").value.trim(), c = $("c_c").value.trim().toUpperCase().replace(/\s+/g, ""), col = $("c_col").value,
    t = $("c_t").value, er = "";
  if (n.length < 3) er = "Enter the course name (at least 3 letters)";
  else if (!/^[A-Z0-9-]{2,8}$/.test(c)) er = "The code needs 2 to 8 letters or numbers, like IA or PE2";
  else if (!col) er = "Select a college";
  else if (CRS.some(function (x) {
    return x.id !== id && x.n.toLowerCase() === n.toLowerCase()
  })) er = "A course with that name already exists";
  else if (CRS.some(function (x) {
    return x.id !== id && x.c === c
  })) er = "That course code is already used";
  if (er) {
    $("me").textContent = er;
    return
  }
  if (id) {
    var k = gc(id);
    k.n = n;
    k.c = c;
    k.col = col;
    k.term = t;
    k.st = $("c_st").value;
    log("Edited course " + n);
    closeM();
    toast("Changes saved");
    render()
  } else {
    var m = { id: ++ CID, n: n, c: c, col: col, term: t, st: "active", mod: 0, s: [] };
    CRS.unshift(m);
    S.cx[m.id] = true;
    CF = { q: "", col: "all", fac: "all", st: "all", att: false, sort: "name" };
    log("Created course " + n);
    closeM();
    toast("Course created. Add a section next.");
    render();
    setTimeout(function () {
      flashC(m.id)
    }, 40)
  }
}

function expC() {
  var rows = [["Course", "Code", "College", "Term", "Status", "Section", "Instructor", "Students"]], a = cfilt(),
    safe = function (x) {
    x = String(x);
    return '"' + (/^[=+\-@]/.test(x) ? "'" : "") + x.replace(/"/g, '""') + '"'
  };
  a.forEach(function (c) {
    (c.s.length ? c.s : [{ sec: "", fac: "", stu: "" }]).forEach(function (s) {
      rows.push([c.n, c.c, colLbl(c.col), c.term, c.st, s.sec, s.fac, s.stu])
    })
  });
  var l = D.createElement("a");
  l.href = URL.createObjectURL(new Blob([
    "\ufeff" + rows.map(function (r) {
      return r.map(safe).join(",")
    }).join("\r\n")
  ], { type: "text/csv" }));
  l.download = "learnlink-courses.csv";
  D.body.appendChild(l);
  l.click();
  l.remove();
  log("Exported " + a.length + " course" + (a.length === 1 ? "" : "s") + " to CSV");
  toast("Exported " + a.length + " course" + (a.length === 1 ? "" : "s"))
}
/* ai */
function sco(t) {
  t = t.toLowerCase();
  return /cia|confidential|integrity|availab/.test(t)?.82: /risk|threat/.test(t)?.66: /encrypt|hash/.test(t)?.55: .18
}

function ai() {
  var p = S.pv, h = "";
  if (p) {
    var ok = p.s >= TH[S.lv - 1];
    h = '<div class="card" style="background:var(--s1)"><div class="sm">Match score for “' + E(p.q) + '”</div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><div class="bar" style="flex:1"><i style="width:' +
      p.s * 100 + '%"></i></div><b>' + p.s.toFixed(2) + '</b></div><span class="chip ' + (ok ? "ok" : (S.web ||
      S.gen) ? "pr" : "fl") + '">' + (ok ? "Answered from modules" : S.web ? "Web search, links shown" : S.gen ? "General answer, labeled" : "Blocked: asks student to rephrase") +
      '</span><div class="sm" style="margin-top:6px">Needs ' + TH[S.lv - 1].toFixed(2) + " or higher to use the modules.</div></div>"
  }
  return '<div class="card"><b>Match level</b><p class="sm" style="margin:2px 0 10px">How closely a question must match the modules before the AI answers from them.</p><input type="range" min="1" max="5" value="' +
    S.lv + '" oninput="$(\'lt\').textContent=LB[this.value-1]" onchange="S.lv=+this.value;S.pv=S.pv&&{q:S.pv.q,s:S.pv.s};render()"><div style="display:flex;justify-content:space-between;margin-top:6px"><span class="sm">Loose</span><b id="lt" style="color:var(--ac)">' +
    LB[S.lv - 1] + '</b><span class="sm">Strict</span></div></div><div class="card"><div class="row" style="border:none"><div style="flex:1"><b>General answers</b><div class="sm">When no module matches, let the local AI model answer from general knowledge, with a label.</div></div><button class="sw' +
    (S.gen ? " on" : "") + '" aria-label="Toggle general answers" onclick="S.gen=!S.gen;render()"></button></div></div><div class="card"><b>Try a question</b><div style="display:flex;gap:8px;margin-top:10px"><input id="pq" placeholder="Try: What is the CIA triad?" style="flex:1" onkeydown="if(event.key===\'Enter\')pr()"><button onclick="pr()">Preview</button></div></div>' +
    h + '<button class="p" onclick="sv()">Save settings</button>'
}

function pr() {
  var q = $("pq").value.trim();
  if (!q) return;
  S.pv = { q: q, s: sco(q) };
  render()
}

function sv() {
  log("Set match level to " + S.lv + " (" + LB[S.lv - 1] + "), general answers " + (S.gen ? "on" : "off"));
  parent.postMessage({ cfg: { gen: S.gen, lv: S.lv } }, "*");
  toast("Saved. Recorded in the audit log.");
  render()
}
/* privacy */
function pv() {
  var h = '<div class="seg">' + [["req", "Data requests"], ["log", "Audit log"]].map(function (t) {
    return '<button class="' + (S.pt === t[0] ? "on" : "") + '" onclick="S.pt=\'' + t[0] + '\';render()">' +
      t[1] + "</button>"
  }).join("") + "</div>";
  if (S.pt === "req") return h + REQ.map(function (r, i) {
    return '<div class="card" id="rq' + i + '" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;transition:all .3s"><div style="flex:1;min-width:160px"><b>' +
      r.n + '</b><div class="sm">' + r.t + " · " + r.d + "</div></div>" + (r.st === "new" ? '<button onclick="rq(' +
      i + ',0)">Decline</button><button class="p" onclick="rq(' + i + ',1)">Verify and run</button>' : '<span class="chip ' +
      (r.st === "done" ? "ok" : "fl") + '">' + (r.st === "done" ? "Done. Student emailed" : "Declined") + "</span>") +
      "</div>"
  }).join("") + '<div class="card"><b>Retention</b><p class="sm" style="margin:2px 0 8px">Delete student chats automatically after:</p><select onchange="S.ret=this.value;log(\'Set chat retention to \'+this.value);toast(\'Retention updated\')">' +
    ["90 days", "180 days", "1 year"].map(function (o) {
    return "<option" + (S.ret === o ? " selected" : "") + ">" + o + "</option>"
  }).join("") + '</select></div>';
  return h + '<div class="card"><p class="sm" style="margin:0 0 4px">Actions only. Chat content is never logged.</p>' +
    AU.map(function (a) {
    return '<div class="row"><span class="sm" style="width:120px">' + a[0] + '</span><span style="flex:1;min-width:160px">' +
      E(a[2]) + '</span><span class="chip">' + a[1] + "</span></div>"
  }).join("") + "</div>"
}

function rq(i, ok) {
  var e = $("rq" + i);
  e.style.opacity = 0;
  e.style.transform = "translateX(" + (ok ? 50 : -50) + "px)";
  setTimeout(function () {
    var r = REQ[i];
    r.st = ok ? "done" : "no";
    log((ok ? "Completed “" : "Declined “") + r.t + "” for " + r.n);
    toast(ok ? "Done. " + r.n + " was emailed." : "Request declined");
    render()
  }, 300)
}
/* analytics */
function an() {
  var n = S.rng, f = n === 7 ? 1 : 4.2, d = DAYS(n), T = tsum(d, "t"), M = tsum(d, "m");
  return '<div style="margin-bottom:14px">' + rngSeg() + '</div><div class="cg"><div class="card"><div class="sm">Questions asked</div><div class="big">' +
    T.toLocaleString() + '</div></div><div class="card"><div class="sm">Answered from modules</div><div class="big">' +
    (T ? Math.round(M / T * 100) : 0) + '%</div></div><div class="card"><div class="sm">Active students</div><div class="big">' +
    (S.live ? (n === 7 ? ADM.active7 : ADM.active30) : Math.round(ADM.active * f)).toLocaleString() + "</div></div></div>" + '<div class="card"><b>Questions per day</b>' +
    qchart(n) + '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px"><div style="display:flex;gap:14px;flex-wrap:wrap"><span class="lg"><i style="background:var(--ac)"></i>Answered from modules</span><span class="lg"><i style="background:var(--sh)"></i>Web, general and offline</span></div><span class="sm">Click a bar for that day’s details</span></div></div>' +
    crsRates() + '<p class="sm">Totals only. No individual student activity is shown.</p>'
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

function doLogout() {
  if (window.parent !== window) parent.postMessage("logout", "*");
  else location.href = "../login.html"
}
render();

// Appearance chosen in the student Settings (System / Light / Dark), saved on this device
try { (function (t) { if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t) })(localStorage.getItem("ll_theme")) } catch (e) {}
