/* LearnLink student app, part 1 of 9: shared helpers, sample data (?demo), app state, render().
   The parts share globals, so student.html must load them in order: core, signup, chat, ai, courses, db, settings, network, start. */
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
  last = null, T = [], cd = null;

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
  r.innerHTML = S.scr === "reg" ? reg() : app();
  after()
}

function after() {
  var m = $("msgs");
  if (m) m.scrollTop = m.scrollHeight;
}

function name() {
  return R.un || "maria_santos"
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
