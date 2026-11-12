/* ==========================================================================
       Admin page on the database (loaded after admin.js).
       When the server answers, users, courses, statistics and the audit log come from MySQL through
       the PHP API, and every change is saved there. Opened on its own (no server), the sample data stays.
       Not stored in the database yet: course terms, sections, archiving, and the AI settings.
       ========================================================================== */
S.live = false;
var OV = null, ACR7 = [], ACR30 = [];

function aapi(path, body) {
  return fetch("/api/db/" + path, body === undefined ? {} : {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Requested-With": "learnlink" },
    body: JSON.stringify(body)
  }).then(function (r) {
    return r.json().catch(function () { return { error: "php_unreachable" }; }).then(function (j) {
      if (!r.ok || j.error) throw j;
      return j;
    });
  });
}
var AERR = {
  email_taken: "That email already has an account", username_taken: "That username is taken", bad_email: "Only @bisu.edu.ph emails are accepted",
  cannot_delete_self: "You can’t delete your own account", cannot_disable_self: "You can’t deactivate your own account",
  course_exists: "A course with that name already exists", bad_course: "Check the course name", missing_fields: "Fill in the name and email"
};
function aFail(e) {
  toast(AERR[e && e.error] || (e && e.error ? "Server said: " + e.error : "Could not reach the server"));
}

// "College of Computing and Information Sciences (CCIS)" or "CCIS" -> "CCIS"
function colCode(s) {
  if (!s) return "";
  var m = /\(([A-Z]+)\)\s*$/.exec(s);
  if (m) return m[1];
  if (COLG[s] || s === "GE") return s;
  for (var k in COLG) if (COLG[k][0] === s) return k;
  return s;
}
function colFull(k) {
  return COLG[k] ? COLG[k][0] + " (" + k + ")" : k;
}
function initials(n) {
  return (n.match(/\b[A-Za-z]|\d+/g) || [n]).join("").toUpperCase().slice(0, 8);
}
function slug(n) {
  return n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}
function whenTxt(s) {
  var d = new Date(String(s).replace(" ", "T"));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/* ---- load everything ---- */
function loadAll() {
  return Promise.all([aapi("auth?action=users"), aapi("courses"), aapi("stats?action=overview"), aapi("auth?action=audit")]).then(function (r) {
    var users = r[0].users, courses = r[1].courses, wk = ago(7);
    OV = r[2];
    U = users.filter(function (x) { return x.role !== "admin"; }).map(function (x) {
      var stu = x.role === "student";
      return { id: +x.id, n: x.name, e: x.email, r: stu ? "Student" : "Faculty", st: x.status === "active" ? "active" : "inactive", col: colCode(x.college),
        prg: x.program || "", yr: x.year_level || "", sec: x.section || "", sid: stu ? x.student_id || "" : "", eid: stu ? "" : x.student_id || "",
        un: x.username || "", j: String(x.created_at || "").slice(0, 10) };
    });
    var cnt = function (role, f) { return U.filter(function (u) { return u.r === role && (!f || f(u)); }).length; };
    ADM.stu = cnt("Student"); ADM.stuW = cnt("Student", function (u) { return u.j >= wk; });
    ADM.fac = cnt("Faculty"); ADM.facW = cnt("Faculty", function (u) { return u.j >= wk; });
    ADM.active7 = OV.active7; ADM.active30 = OV.active30;
    SS = { active: cnt("Student", function (u) { return u.st === "active"; }), pending: 0, inactive: cnt("Student", function (u) { return u.st !== "active"; }) };
    FS = { active: cnt("Faculty", function (u) { return u.st === "active"; }), pending: 0, inactive: cnt("Faculty", function (u) { return u.st !== "active"; }) };
    SC = {}; FC = {};
    Object.keys(COLG).forEach(function (k) {
      SC[k] = cnt("Student", function (u) { return u.col === k; });
      FC[k] = cnt("Faculty", function (u) { return u.col === k; });
    });
    CRS = courses.map(function (c, i) {
      return { id: i + 1, dbid: c.id, n: c.name, c: initials(c.name), col: c.college, term: "Current term", st: "active", mod: c.modules.length,
        s: [{ sec: "Instructor", fac: c.instructor || "", stu: c.students || 0 }] };
    });
    var rates = function (per) {
      return Object.keys(per).filter(function (k) { return per[k].t > 0; }).map(function (k) {
        return [OV.names[k] || k, Math.round(per[k].m / per[k].t * 100), per[k].t];
      }).sort(function (a, b) { return b[2] - a[2]; });
    };
    ACR7 = rates(OV.courses7); ACR30 = rates(OV.courses);
    QSRC = [["Answered from modules", OV.modes.grounded], ["General answer (labeled)", OV.modes.general], ["Not in the modules", OV.modes.none]];
    QH = OV.hours;
    QT = OV.terms.length ? OV.terms : [["No questions yet", 0]];
    REQ = [];
    AU = r[3].log.map(function (a) { return [whenTxt(a.created_at), a.actor.split(" · ")[0], a.actor.split(" · ")[1] ? a.actor.split(" · ")[1] + ": " + a.action : a.action]; });
    S.live = true;
    render();
  });
}

/* ---- statistics ---- */
var _DAYSsample = DAYS;
DAYS = function (n) {
  if (!S.live) return _DAYSsample(n);
  return OV.days.slice(-n).map(function (x) {
    var p = x.d.split("-");
    return { d: new Date(+p[0], +p[1] - 1, +p[2]), t: x.t, m: x.m };
  });
};
var _crsRates = crsRates;
crsRates = function () {
  if (S.live) ACR = S.rng === 30 ? ACR30 : ACR7;
  if (S.live && !ACR.length) return '<div class="card"><b>Answered from modules, by course</b><p class="sm" style="margin:8px 0 0">No questions in the last ' + S.rng + ' days yet.</p></div>';
  return _crsRates();
};

/* ---- users ---- */
var _log = log;
log = function (t) { if (!S.live) _log(t); };      // live: the server writes the audit log

var _addU = addU;
addU = function (role) {
  _addU(role);
  if (!S.live) return;
  var m = $("mdh");
  [].slice.call(m.querySelectorAll("p.sm")).forEach(function (p) {
    if (/verification email/.test(p.textContent)) p.textContent = "LearnLink creates the account with a temporary password. You’ll see it once, so give it to them privately.";
  });
  [].slice.call(m.querySelectorAll("button")).forEach(function (b) { if (b.textContent === "Send invite") b.textContent = "Create account"; });
};
var _saveAdd = saveAdd;
saveAdd = function (role) {
  if (!S.live) return _saveAdd(role);
  var v = readF(role, "a_"), s = role === "Student";
  v.sid = s ? $("a_id").value.trim() : "";
  v.eid = s ? "" : $("a_id").value.trim();
  var er = check(role, v);
  if (er) { $("me").textContent = er; return; }
  aapi("auth?action=create_user", { role: role.toLowerCase(), name: v.n, email: v.e.toLowerCase(), username: v.un, student_id: s ? v.sid : v.eid,
    college: colFull(v.col), program: v.prg, year_level: v.yr, section: v.sec }).then(function (j) {
    openM(mhead("Account created") + '<p style="margin:12px 0 4px;line-height:1.6"><b>' + E(v.n) + '</b> can now log in with <b>' + E(v.e.toLowerCase()) +
      '</b> and this temporary password:</p><div class="card" style="text-align:center;font-size:22px;font-weight:800;letter-spacing:2px;margin:8px 0">' + E(j.temp_password) +
      '</div><p class="sm" style="margin:0 0 14px">It is shown only once. Give it to them privately.</p><div style="display:flex;justify-content:flex-end"><button class="p" onclick="closeM()">Done</button></div>');
    UF = { q: "", col: "all", role: "all", st: "all", rg: "all", from: "", to: "" };
    return loadAll();
  }, function (e) { $("me").textContent = AERR[e && e.error] || "Could not save: " + (e && e.error || "server unreachable"); });
};
var _saveEdit = saveEdit;
saveEdit = function (id) {
  if (!S.live) return _saveEdit(id);
  var u = U.filter(function (x) { return x.id === id; })[0], s = u.r === "Student", v = readF(u.r, "u_");
  v.sid = s ? $("u_id").value.trim() : "";
  v.eid = s ? "" : $("u_id").value.trim();
  var er = check(u.r, v, id);
  if (er) { $("me").textContent = er; return; }
  aapi("auth?action=update_user", { id: id, name: v.n, email: v.e.toLowerCase(), college: colFull(v.col), program: v.prg, year_level: v.yr, section: v.sec,
    student_id: s ? v.sid : v.eid, status: $("u_sw").classList.contains("on") ? "active" : "disabled" }).then(function () {
    closeM(); toast("Changes saved"); return loadAll();
  }, function (e) { $("me").textContent = AERR[e && e.error] || "Could not save: " + (e && e.error || "server unreachable"); });
};
// Edit user: "Reset password" sets a new temporary password (shown once) for someone who forgot theirs.
var _editU = editU;
editU = function (id) {
  _editU(id);
  if (!S.live) return;
  var me = $("me");
  if (!me) return;
  var d = document.createElement("div");
  d.innerHTML = '<div class="mh">Password</div><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div class="sm">Forgot their password? Give them a new temporary one. Their old password stops working.</div>' +
    '<button style="flex-shrink:0" onclick="resetPw(' + id + ')">Reset password</button></div>';
  me.parentNode.insertBefore(d, me);
};
function resetPw(id) {
  var u = U.filter(function (x) { return x.id === id; })[0];
  openM(mhead("Reset password?") + '<p style="margin:12px 0;line-height:1.6"><b>' + E(u.n) + '</b> (' + E(u.e) + ') will get a new temporary password. Their current password will stop working.</p>' +
    '<div style="display:flex;gap:8px;justify-content:flex-end"><button onclick="editU(' + id + ')">Cancel</button><button class="p" onclick="doResetPw(' + id + ')">Reset password</button></div>');
}
function doResetPw(id) {
  var u = U.filter(function (x) { return x.id === id; })[0];
  aapi("auth?action=reset_password", { id: id }).then(function (j) {
    openM(mhead("Password reset") + '<p style="margin:12px 0 4px;line-height:1.6"><b>' + E(u.n) + '</b> can now log in with <b>' + E(u.e) +
      '</b> and this temporary password:</p><div class="card" style="text-align:center;font-size:22px;font-weight:800;letter-spacing:2px;margin:8px 0">' + E(j.temp_password) +
      '</div><p class="sm" style="margin:0 0 14px">It is shown only once. Check their school ID, then give it to them privately.</p><div style="display:flex;justify-content:flex-end"><button class="p" onclick="closeM()">Done</button></div>');
    return loadAll();
  }, aFail);
}
var _confDel = confDel;
confDel = function (id) {
  if (!S.live) return _confDel(id);
  aapi("auth?action=delete_user", { id: id }).then(function () { closeM(); toast("User deleted"); return loadAll(); }, aFail);
};

/* ---- courses: one instructor per course in the database ---- */
var _setFac = setFac;
setFac = function (id, si, name) {
  if (!S.live) return _setFac(id, si, name);
  var c = gc(id), f = U.filter(function (u) { return u.r === "Faculty" && u.n === name; })[0];
  aapi("courses?action=assign", { course_id: c.dbid, faculty_id: f ? f.id : null }).then(function () {
    toast(f ? f.n + " can now upload materials for " + c.n : "Instructor removed"); return loadAll();
  }, aFail);
};
var _ccard = ccard;
ccard = function (c) {
  var h = _ccard(c);
  if (!S.live) return h;
  return h.replace(/<button [^>]*onclick="arch\(\d+\)">[^<]*<\/button>/, "")
    .replace(/<span><b>1<\/b> section<\/span><span><b>\d+<\/b> students<\/span>/, "")
    .replace(/<span class="sm" style="width:96px">(\d+ students|No students yet)<\/span>/g, "")
    .replace(/<button class="g dng" aria-label="Remove section[^>]*>✕<\/button>/g, "")
    .replace(/<div class="row"><input id="ns\d+"[\s\S]*<p class="er" id="ne\d+"><\/p>/, "");
};
// one instructor per course: show instructors instead of sections, and count students once
var _cstats = cstats;
cstats = function () {
  var h = _cstats();
  if (!S.live) return h;
  var withFac = CRS.filter(function (c) { return facOk(c.s[0].fac); }).length;
  return h.replace(/<div class="sm">Sections<\/div><div class="big">\d+<\/div><div class="sm">across all courses<\/div>/,
      '<div class="sm">Instructors assigned</div><div class="big">' + withFac + '</div><div class="sm">of ' + CRS.length + ' courses</div>')
    .replace(/<div class="sm">Students enrolled<\/div><div class="big">[\d,]+<\/div><div class="sm">in listed sections<\/div>/,
      '<div class="sm">Students</div><div class="big">' + ADM.stu.toLocaleString() + '</div><div class="sm">every course is open to all students</div>')
    .replace("Every section has an instructor", "Every course has an instructor").replace("No instructor assigned. Click to filter", "No instructor yet. Click to filter");
};
var _cform = cform;
cform = function (c) {
  var h = _cform(c);
  if (!S.live) return h;
  return h.replace(/<label class="fl2" for="c_c">[\s\S]*?<\/label><input id="c_c"[^>]*>/, "")
    .replace(/<label class="fl2" for="c_t">[\s\S]*?<\/select>/, "")
    .replace(/<label class="fl2" for="c_st">[\s\S]*?<\/select>/, "");
};
var _addC = addC;
addC = function () {
  _addC();
  if (S.live) { var x = $("mdh").querySelector(".sm"); if (x) x.textContent = "Choose its instructor right after."; }
};
var _saveC = saveC;
saveC = function (id) {
  if (!S.live) return _saveC(id);
  var n = $("c_n").value.trim(), col = $("c_col").value, er = "";
  if (n.length < 3) er = "Enter the course name (at least 3 letters)";
  else if (!col) er = "Select a college";
  else if (slug(n).length < 2) er = "Use letters or numbers in the name";
  if (er) { $("me").textContent = er; return; }
  var done = function (msg) { closeM(); toast(msg); return loadAll(); }, bad = function (e) { $("me").textContent = AERR[e && e.error] || "Could not save: " + (e && e.error || "server unreachable"); };
  if (id) aapi("courses?action=update_course", { course_id: gc(id).dbid, name: n, college: col }).then(function () { return done("Changes saved"); }, bad);
  else aapi("courses?action=create_course", { id: slug(n), name: n, college: col }).then(function () { return done("Course created. Choose its instructor next."); }, bad);
};
var _confC = confC;
confC = function (id) {
  if (!S.live) return _confC(id);
  aapi("courses?action=delete_course", { course_id: gc(id).dbid }).then(function () { closeM(); toast("Course deleted"); return loadAll(); }, aFail);
};
var _delC = delC;
delC = function (id) {
  _delC(id);
  if (!S.live) return;
  var p = $("mdh").querySelector("p.sm");
  if (p) p.textContent = "This removes its modules, uploaded files and chat statistics from LearnLink. It can’t be undone.";
};

var _home = home;
home = function () {
  var h = _home();
  if (!S.live) return h;
  var withFac = CRS.filter(function (c) { return facOk(c.s[0].fac); }).length;
  return h.replace(/<div class="sm">\d+ sections?<\/div>/, '<div class="sm">' + withFac + ' with an instructor</div>');
};

/* ---- privacy: students download or delete their own data in Settings ---- */
var _pv = pv;
pv = function () {
  if (!S.live || S.pt !== "req") return _pv();
  return _pv().replace(/<div class="card"><b>Retention<\/b>[\s\S]*$/, "") +
    '<div class="card"><b>Students handle their own data</b><p class="sm" style="margin:2px 0 0">Under the Data Privacy Act, students can download everything LearnLink keeps about them, or delete their chats, from their own Settings page. Each download and deletion is recorded in the audit log, so there are no requests to approve here.</p></div>';
};

loadAll().catch(function () { /* no server: keep the sample data */ });
