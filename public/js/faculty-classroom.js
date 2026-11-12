/* ==========================================================================
       Google Classroom sync
       Teachers post learning files in Google Classroom as Materials. When the campus server has internet,
       LearnLink copies new Materials in as drafts; the teacher reviews them here and publishes
       them into a module. Answering questions never needs the internet.
       With the server running this screen uses api/google.php ("live" block at the end).
       Opened on its own (no server), it shows the sample data below.
       ========================================================================== */
var GC = {
  online: true,          // does the campus server have internet right now (demo toggle)
  busy: false,           // a sync is running
  last: "Today, 7:42 AM",
  classes: ["Information Assurance · BSIT 3C", "Information Assurance · BSIT 3B", "Network Security · BSIT 4A", "IT Elective 3 · BSIT 2A"],
  c: {}                  // per course: { linked, drafts, skipped, hist }
};

function gkey(c) {
  return c.n + "|" + c.s;
}

// Sample data for one course. The first course starts linked with items to review; the others start unlinked.
function gcOf(c) {
  var k = gkey(c);
  if (GC.c[k]) return GC.c[k];
  var first = c === CS[0];
  var mt = function (i) {
    return c.mods[Math.min(i, c.mods.length - 1)] ? c.mods[Math.min(i, c.mods.length - 1)].t.replace(/^Module \d+:\s*/, "") : "Lesson";
  };
  GC.c[k] = {
    linked: first ? c.n + " · " + c.s : null,
    drafts: first ? [
      { n: "Week 9 – Incident Response.pptx", ty: "PPTX", on: "Oct 27", topic: "Week 9", mi: 2, sz: "18 slides · 1,240 words",
        tx: "Incident response is the organized way an organization handles a security breach. The six phases are preparation, identification, containment, eradication, recovery, and lessons learned. Containment limits the damage, while eradication removes the cause of the incident…" },
      { n: "CIA Triad Reviewer", ty: "Google Doc", on: "Oct 26", topic: "Midterm review", mi: 1, sz: "2 pages · 860 words",
        tx: "Confidentiality keeps data away from people who should not see it. Integrity keeps data accurate and unchanged without permission. Availability makes sure systems and data can be reached when needed. Example: a bank encrypts accounts (confidentiality)…" },
      { n: "Hashing vs Encryption.pdf", ty: "PDF", on: "Oct 25", topic: "Week 8", mi: 3, sz: "6 pages · 2,010 words",
        tx: "Encryption is reversible: with the right key, the original data comes back. Hashing is one-way: it produces a fixed-length fingerprint that cannot be turned back into the original. Hashes are used to check integrity and to store passwords…" }
    ] : [],
    skipped: first ? [
      { n: "Lecture recording: Risk Assessment", ty: "YouTube video", why: "Videos have no text LearnLink can read" },
      { n: "Quiz 3: Security Principles", ty: "Google Form", why: "Quizzes stay in Classroom" },
      { n: "Scanned handout p.1–4.pdf", ty: "PDF", why: "Scanned pages with no text layer. Post a text-based copy." }
    ] : [],
    hist: first ? [
      { ok: 1, t: "Today, 7:42 AM", d: "Found 6 new posts · 3 waiting for your review, 3 skipped" },
      { ok: 0, t: "Today, 7:12 AM", d: "Campus server had no internet. Student answers kept working; sync tried again later." },
      { ok: 1, t: "Yesterday, 4:30 PM", d: "1 new material · you published it to " + E(c.mods[1] ? c.mods[1].t : "a module") },
      { ok: 1, t: "Oct 25, 9:05 AM", d: "Linked to " + E(c.n + " · " + c.s) + " · imported 4 materials" }
    ] : [],
    gen: [
      { n: mt(0) + " – Lecture Notes.pdf", ty: "PDF", on: "Oct 27", topic: "Week 9", mi: 0, sz: "9 pages · 2,480 words", tx: "Sample text from the lecture notes on " + mt(0) + "…" },
      { n: mt(1) + " Slides", ty: "Google Slides", on: "Oct 24", topic: "Week 8", mi: 1, sz: "22 slides · 1,630 words", tx: "Sample text from the slides on " + mt(1) + "…" }
    ]
  };
  return GC.c[k];
}

function gcPending() {
  return sum(CS, function (c) {
    var g = gcOf(c);
    return g.linked ? g.drafts.length : 0;
  });
}

/* ---- the Classroom tab ---- */
var GICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M3 21v-5h5"/></svg>';

function gcTab() {
  var c = C(), g = gcOf(c), acct = S.currentUser.email;
  var net = GC.online ? '<span class="chip ok">Campus server online</span>' : '<span class="chip fl">No internet on campus server</span>';
  var h = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">' +
    '<div style="display:flex;gap:12px;align-items:flex-start;min-width:0"><span style="display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:var(--acb);color:var(--ac);flex-shrink:0">' +
    GICON + '</span><div style="min-width:0"><b style="font-size:16px">Google Classroom</b> <span class="chip" style="background:var(--s1);color:var(--t2)">Preview · sample data</span>' +
    '<div class="sm">Signed in as <b>' + E(acct) + '</b></div></div></div>' + net + '</div>';

  if (!g.linked) {
    h += '<div style="margin-top:14px;padding:14px;border-radius:14px;background:var(--s1)"><b>Link this course to a Classroom class</b>' +
      '<p class="sm" style="margin:2px 0 10px">Keep posting in Classroom as usual. New Materials (in Classroom: Create → Material) come here as drafts. Assignments and announcements are not read, and nothing reaches students until you publish it.</p>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><select id="gcl" aria-label="Classroom class" style="flex:1;min-width:200px">' +
      GC.classes.map(function (x) {
        return '<option' + (x === c.n + " · " + c.s ? " selected" : "") + '>' + E(x) + '</option>';
      }).join("") + '</select><button class="p" onclick="gcLink()">Link class</button></div></div></div>' + gcHow();
    return h;
  }

  h += '<div class="cg" style="margin:14px 0 0;grid-template-columns:repeat(auto-fit,minmax(160px,1fr))">' +
    '<div class="card" style="margin:0"><div class="sm">Linked class</div><b>' + E(g.linked) + '</b></div>' +
    '<div class="card" style="margin:0"><div class="sm">Last checked</div><b>' + (GC.busy ? "Checking now…" : E(GC.last)) + '</b></div>' +
    '<div class="card" style="margin:0"><div class="sm">Waiting for review</div><b>' + g.drafts.length + ' material' + (g.drafts.length === 1 ? "" : "s") + '</b></div></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="p" onclick="gcSync()"' + (GC.busy ? " disabled" : "") + '>' +
    (GC.busy ? "Checking Classroom…" : "Check for new materials") + '</button><button onclick="gcUnlink()">Unlink class</button></div>' +
    (GC.online ? "" : '<p class="sm" style="margin:10px 0 0;color:var(--er)">The campus server can’t reach the internet right now. Students can still ask questions; new Classroom Materials will come in when the connection is back.</p>') +
    '</div>';

  // drafts
  h += '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><span><b>New from Classroom</b><div class="sm">Choose the module for each one, then publish. Students only see what you publish.</div></span>' +
    (g.drafts.length > 1 ? '<button onclick="gcApproveAll()">Publish all ' + g.drafts.length + '</button>' : "") + '</div>';
  h += g.drafts.length ? g.drafts.map(function (d, i) {
    return '<div class="row" style="flex-wrap:wrap;gap:10px;align-items:center">' +
      '<span style="flex:1 1 240px;min-width:0"><button class="fl2" style="max-width:100%;font-weight:700" onclick="gcPrev(' + i + ')">' + E(d.n) + '</button>' +
      '<div class="sm">Posted ' + E(d.on) + ' · Topic “' + E(d.topic) + '” · ' + E(d.sz) + '</div></span>' +
      '<span class="chip" style="background:var(--s1);color:var(--t2)">' + E(d.ty) + '</span><span class="chip ok">Text ready</span>' +
      '<select aria-label="Module for ' + EA(d.n) + '" onchange="gcOf(C()).drafts[' + i + '].mi=+this.value" style="flex:1 1 200px;min-width:0">' +
      C().mods.map(function (m, mi) {
        return '<option value="' + mi + '"' + (mi === d.mi ? " selected" : "") + '>' + E(m.t) + '</option>';
      }).join("") + '</select>' +
      '<span style="display:flex;gap:6px"><button onclick="gcPrev(' + i + ')">Preview</button><button class="p" onclick="gcApprove(' + i + ')">Publish</button><button class="g" onclick="gcSkip(' + i + ')">Skip</button></span></div>';
  }).join("") : '<p class="sm" style="margin:10px 0 0">You’re all caught up. New Classroom Materials will show up here.</p>';
  h += '</div>';

  // skipped
  if (g.skipped.length) h += '<div class="card"><b>Not added</b><div class="sm">LearnLink can only answer from text. These stay in Classroom.</div>' +
    g.skipped.map(function (s) {
      return '<div class="row" style="flex-wrap:wrap;gap:8px"><span style="flex:1;min-width:180px"><b>' + E(s.n) + '</b><div class="sm">' + E(s.why) + '</div></span><span class="chip" style="background:var(--s1);color:var(--t2)">' + E(s.ty) + '</span></div>';
    }).join("") + '</div>';

  // history
  h += '<div class="card"><b>Sync history</b>' + g.hist.map(function (x) {
    return '<div class="row" style="gap:10px;align-items:flex-start"><span style="width:10px;height:10px;border-radius:50%;margin-top:6px;flex-shrink:0;background:' +
      (x.ok ? "var(--ok)" : "var(--er)") + '"></span><span style="flex:1"><b>' + E(x.t) + '</b><div class="sm">' + x.d + '</div></span></div>';
  }).join("") + '</div>' + gcHow();
  return h;
}

function gcHow() {
  return '<p class="sm" style="margin:4px 4px 0">How it works: LearnLink checks Classroom only when the campus server has internet. Student questions are always answered on the campus server, so they never need the internet. ' +
    '<a href="#" class="lnk" onclick="GC.online=!GC.online;render();return false">' + (GC.online ? "Demo: simulate no internet" : "Demo: internet is back") + '</a></p>';
}

/* ---- actions ---- */
function gcLink() {
  var g = gcOf(C());
  g.linked = $("gcl").value;
  g.drafts = g.gen.slice();
  g.hist = [{ ok: 1, t: "Just now", d: "Linked to " + E(g.linked) + " · found " + g.drafts.length + " materials to review" }];
  toast("Linked. " + g.drafts.length + " materials are waiting for your review.");
  render();
}

function gcUnlink() {
  var g = gcOf(C());
  g.linked = null;
  toast("Unlinked. Materials you already published stay in LearnLink.");
  render();
}

function gcSync() {
  if (!GC.online) {
    var g0 = gcOf(C());
    g0.hist.unshift({ ok: 0, t: "Just now", d: "Campus server had no internet. Student answers kept working; LearnLink will try again later." });
    toast("No internet on the campus server. Will try again later.");
    render();
    return;
  }
  GC.busy = true;
  render();
  setTimeout(function () {
    GC.busy = false;
    GC.last = "Just now";
    gcOf(C()).hist.unshift({ ok: 1, t: "Just now", d: "Up to date · no new materials" });
    toast("Classroom checked. No new materials.");
    render();
  }, 1400);
}

function gcPublish(d) {
  var c = C(), m = c.mods[d.mi];
  m.f.push({ n: d.n, st: "ready", src: "gc" });
  gcOf(c).hist.unshift({ ok: 1, t: "Just now", d: "You published “" + E(d.n) + "” to " + E(m.t) });
  return m;
}

function gcApprove(i) {
  var g = gcOf(C()), d = g.drafts.splice(i, 1)[0], m = gcPublish(d);
  closeM();
  toast(m.pub ? "Published to " + m.t + ". Students can ask about it now." : "Added to " + m.t + ". The module is hidden, so publish it when ready.");
  render();
}

function gcApproveAll() {
  var g = gcOf(C()), n = g.drafts.length;
  g.drafts.splice(0).forEach(gcPublish);
  toast("Published " + n + " materials.");
  render();
}

function gcSkip(i) {
  var g = gcOf(C()), d = g.drafts.splice(i, 1)[0];
  g.skipped.unshift({ n: d.n, ty: d.ty, why: "Skipped by you" });
  closeM();
  render();
}

function gcPrev(i) {
  var c = C(), d = gcOf(c).drafts[i];
  openM(mhead(d.n, '<div class="sm">From Google Classroom · posted ' + E(d.on) + ' · Topic “' + E(d.topic) + '”</div>') +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 12px"><span class="chip">' + E(d.ty) + '</span><span class="chip ok">Text ready</span><span class="chip pr">Draft · not visible to students</span></div>' +
    '<div class="mh">Text LearnLink will read</div><div class="doc">' + E(d.tx) + '</div>' +
    '<p class="sm" style="margin:8px 0 0">Will be added to <b>' + E(c.mods[d.mi].t) + '</b>.</p>' +
    mfoot('<button onclick="gcSkip(' + i + ')">Skip</button>', '<button class="p" onclick="gcApprove(' + i + ')">Publish</button>'), true);
}

/* ---- hook the tab into the course page, home banner and "Needs your attention" ---- */
tabs = function () {
  var c = C(), bad = issues(c), g = gcOf(c);
  return [
    ["mat", "Materials" + (bad ? " (" + bad + " failed)" : "")],
    ["gc", "Classroom" + (g.linked && g.drafts.length ? " (" + g.drafts.length + ")" : "")],
    // Join codes and requests exist only in the sample data (?demo); real class lists come from Google Classroom.
    window.LL_DEMO ? ["enr", "Enrollment" + (c.req.length ? " (" + c.req.length + ")" : "")] : null,
    ["ins", "Insights"],
    ["tst", "Test chat"]
  ].filter(Boolean).map(function (t) {
    return '<button class="' + (S.tab === t[0] ? "on" : "") + '" onclick="S.tab=\'' + t[0] + '\';render()">' + t[1] + '</button>';
  }).join("");
};

course = function () {
  var c = C();
  return '<div class="sc">' + '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' + '<button class="g" aria-label="Back" onclick="S.v=\'home\';render()">←</button>' +
    '<h2 style="font-size:20px">' + E(c.n) + '</h2>' + '<span class="chip">' + E(c.s) + '</span>' + '</div>' +
    '<div id="cs" style="margin-left:6px">' + csum() + '</div>' + '<div class="seg" id="tb">' + tabs() + '</div>' +
    (S.tab === "mat" ? mat() : S.tab === "gc" ? gcTab() : S.tab === "enr" ? enr() : S.tab === "ins" ? ins() : tst()) + '</div>';
};

var _gcAttn = attnItems;
attnItems = function () {
  var a = _gcAttn();
  CS.forEach(function (c, i) {
    var g = gcOf(c);
    if (g.linked && g.drafts.length) a.push({
      w: 80 + g.drafts.length,
      t: g.drafts.length + " new material" + (g.drafts.length > 1 ? "s" : "") + " from Google Classroom",
      sub: E(c.n) + " · " + E(c.s) + " · waiting for your review",
      tag: ["pr", "Review"],
      go: "openC(" + i + ",'gc')"
    });
  });
  return a.sort(function (x, y) {
    return y.w - x.w;
  }).slice(0, 5);
};

var _gcHome = home;
home = function () {
  var n = gcPending(), i = CS.findIndex(function (c) {
    var g = gcOf(c);
    return g.linked && g.drafts.length;
  });
  var banner = n ? '<div class="card" style="background:var(--acb);display:flex;justify-content:space-between;align-items:center;gap:10px">' +
    '<span style="display:flex;gap:10px;align-items:center"><span style="color:var(--ac)">' + GICON + '</span><span><b>' + n + ' new material' + (n > 1 ? "s" : "") +
    ' from Google Classroom</b><br><span class="sm">Copied in while the campus server was online. Review them before students can use them.</span></span></span>' +
    '<button class="p" onclick="openC(' + i + ',\'gc\')">Review</button></div>' : "";
  // put the banner right under the greeting
  return _gcHome().replace('<p style="color:var(--t2);margin:2px 0 14px">Here is how your course sections are doing.</p>',
    '<p style="color:var(--t2);margin:2px 0 14px">Here is how your course sections are doing.</p>' + banner);
};
render();

// Appearance chosen in the student Settings (System / Light / Dark), saved on this device
try { (function (t) { if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t) })(localStorage.getItem("ll_theme")) } catch (e) {}

/* ==========================================================================
       Live mode: real Google Classroom sync through api/google.php
       ========================================================================== */
GC.live = false;   // true once the server answers
GC.st = null;      // { configured, connected, email, redirect, online, every }
GC.d = {};         // per course id: { link, items, log, published }
GC.pend = {};      // drafts waiting, per course id
GC.cls = null;     // the teacher's Classroom classes (for linking)

var GCMSG = {
  connected: "Google account connected. Now link a course to a Classroom class.",
  denied: "Google access was not allowed, so nothing was connected.",
  expired: "That sign-in took too long. Please try again.",
  domain: "Use your BISU Google account (@bisu.edu.ph).",
  offline: "The server has no internet right now. Try again when it is back.",
  failed: "Google sign-in did not finish. Please try again.",
  login: "Log in to LearnLink first, then connect your Google account."
};

function gcWhen(s) {
  if (!s) return "Never";
  var d = new Date(String(s).replace(" ", "T")), now = new Date(), y = new Date(now - 864e5);
  var t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return "Today, " + t;
  if (d.toDateString() === y.toDateString()) return "Yesterday, " + t;
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + ", " + t;
}

function gcFail(e) {
  var m = { offline: "The server has no internet right now. Try again later.", google_expired: "Google access expired. Reconnect your Google account.", not_your_class: "That class is not one you teach in Classroom." };
  toast(m[e && e.error] || (e && e.error ? "Server said: " + e.error : "Could not reach the server"));
}

function gcLoadStatus() {
  return api("google?action=status").then(function (j) { GC.live = true; GC.st = j; });
}
function gcLoadPending() {
  return api("google?action=pending").then(function (j) { GC.pend = j.pending || {}; }, function () {});
}
function gcLoad(cid) {
  return api("google?action=items&course_id=" + encodeURIComponent(cid)).then(function (j) { GC.d[cid] = j; GC.pend[cid] = j.items.filter(function (x) { return x.status === "draft"; }).length; });
}
function gcReload() {
  var cid = C().id;
  return Promise.all([gcLoad(cid), gcLoadStatus()]).then(render, gcFail);
}

var _gcOfSample = gcOf;
gcOf = function (c) {
  if (!GC.live) return _gcOfSample(c);
  var n = GC.pend[c.id] || 0;
  return { linked: n > 0, drafts: { length: n } };   // only used for counters in live mode
};

var _gcTabSample = gcTab;
gcTab = function () {
  if (!GC.live) return _gcTabSample();
  var c = C(), st = GC.st, d = GC.d[c.id];
  if (!d) { gcLoad(c.id).then(render, gcFail); return '<div class="card"><p class="sm">Loading Classroom…</p></div>'; }
  var net = st.online ? '<span class="chip ok">Server online</span>' : '<span class="chip fl">No internet on server</span>';
  var h = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap">' +
    '<div style="display:flex;gap:12px;align-items:flex-start;min-width:0"><span style="display:grid;place-items:center;width:40px;height:40px;border-radius:12px;background:var(--acb);color:var(--ac);flex-shrink:0">' +
    GICON + '</span><div style="min-width:0"><b style="font-size:16px">Google Classroom</b><div class="sm">' +
    (st.connected ? 'Signed in as <b>' + E(st.email) + '</b> · <a href="#" class="lnk" onclick="gcDisconnect();return false">Disconnect</a>' : st.configured ? "Not connected yet" : "Not set up on this server") +
    '</div></div></div>' + net + '</div>';

  if (!st.configured) {
    h += '<div style="margin-top:14px;padding:14px;border-radius:14px;background:var(--s1)"><b>Classroom sync is not set up yet</b><p class="sm" style="margin:2px 0 0">The person running the LearnLink server adds a Google client ID and secret to the <b>.env</b> file (see the README, “Google Classroom sync”). Until then, upload files in the Materials tab.</p></div></div>';
    return h + gcHowLive();
  }
  if (!st.connected) {
    var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname), needLocal = /\/\/(localhost|127\.0\.0\.1)[:/]/.test(st.redirect || "");
    h += '<div style="margin-top:14px;padding:14px;border-radius:14px;background:var(--s1)"><b>Connect your BISU Google account</b>' +
      '<p class="sm" style="margin:2px 0 10px">LearnLink will only read the classes you teach and the Materials you post in them (not assignments or announcements). Keep posting in Classroom as usual.</p>' +
      (needLocal && !local ? '<p class="sm" style="margin:0 0 10px;color:var(--er)">Google only allows this step on the LearnLink server itself. Open <b>http://localhost:' + E(location.port || "3000") + '</b> on the server PC, log in, and connect once. After that, everything works from any device.</p>' : "") +
      '<button class="p" onclick="gcConnect()"' + (needLocal && !local ? " disabled" : "") + '>Connect Google account</button></div></div>';
    if (!d.link) return h + gcHowLive();
  }

  if (!d.link) {
    if (!GC.cls) { api("google?action=classes").then(function (j) { GC.cls = j.classes; render(); }, function (e) { GC.cls = []; gcFail(e); render(); }); }
    h += '<div style="margin-top:14px;padding:14px;border-radius:14px;background:var(--s1)"><b>Link this course to a Classroom class</b>' +
      '<p class="sm" style="margin:2px 0 10px">New Materials (in Classroom: Create → Material) come here as drafts. Assignments and announcements are not read, and nothing reaches students until you publish it.</p>' +
      (!GC.cls ? '<p class="sm">Loading your classes…</p>' : !GC.cls.length ? '<p class="sm">No active Classroom classes found where you are a teacher.</p>' :
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><select id="gcl" aria-label="Classroom class" style="flex:1;min-width:200px">' + GC.cls.map(function (x) {
        return '<option value="' + EA(x.id) + '"' + (x.name.toLowerCase().indexOf(c.n.toLowerCase()) > -1 ? " selected" : "") + '>' + E(x.name) + '</option>';
      }).join("") + '</select><button class="p" onclick="gcLinkLive()"' + (GC.busy ? " disabled" : "") + '>' + (GC.busy ? "Linking and checking…" : "Link class") + '</button></div>') + '</div></div>';
    return h + gcHowLive();
  }

  var drafts = d.items.filter(function (x) { return x.status === "draft"; }), off = d.items.filter(function (x) { return x.status !== "draft"; });
  h += (st.connected ? "" : '<p class="sm" style="margin:12px 0 0;color:var(--er)">Your Google account is not connected, so this class is not being checked. Connect it again above.</p>') +
    '<div class="cg" style="margin:14px 0 0;grid-template-columns:repeat(auto-fit,minmax(160px,1fr))">' +
    '<div class="card" style="margin:0"><div class="sm">Linked class</div><b>' + E(d.link.gc_course_name) + '</b></div>' +
    '<div class="card" style="margin:0"><div class="sm">Last checked</div><b>' + (GC.busy ? "Checking now…" : E(gcWhen(d.link.last_sync_at))) + '</b><div class="sm">Every ' + st.every + ' minutes while online</div></div>' +
    '<div class="card" style="margin:0"><div class="sm">Waiting for review</div><b>' + drafts.length + ' material' + (drafts.length === 1 ? "" : "s") + '</b><div class="sm">' + d.published + ' published so far</div></div></div>' +
    '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="p" onclick="gcSyncLive()"' + (GC.busy || !st.connected ? " disabled" : "") + '>' +
    (GC.busy ? "Checking Classroom…" : "Check for new materials") + '</button><button onclick="gcUnlinkLive()">Unlink class</button></div>' +
    (st.online ? "" : '<p class="sm" style="margin:10px 0 0;color:var(--er)">The server can’t reach the internet right now. Students can still ask questions; new Classroom Materials will come in when the connection is back.</p>') + '</div>';

  h += '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><span><b>New from Classroom</b><div class="sm">Choose the module for each one, then publish. Students only see what you publish.</div></span>' +
    (drafts.length > 1 && c.mods.length ? '<button onclick="gcPublishAll()">Publish all ' + drafts.length + '</button>' : "") + '</div>';
  if (drafts.length && !c.mods.length) h += '<p class="sm" style="margin:10px 0 0;color:var(--er)">Add a module in the Materials tab first, so these have somewhere to go.</p>';
  h += drafts.length ? drafts.map(function (x) {
    return '<div class="row" style="flex-wrap:wrap;gap:10px;align-items:center">' +
      '<span style="flex:1 1 240px;min-width:0"><button class="fl2" style="max-width:100%;font-weight:700" onclick="gcPrevLive(' + x.id + ')">' + E(x.title) + '</button>' +
      '<div class="sm">' + (x.posted_at ? "Posted " + E(gcWhen(x.posted_at).replace(/^(Today|Yesterday), .*/, "$1").replace(/, \d.*$/, "")) : "From Classroom") + (x.topic ? ' · Topic “' + E(x.topic) + '”' : "") + ' · ' + Number(x.chars || 0).toLocaleString() + ' characters of text</div></span>' +
      '<span class="chip" style="background:var(--s1);color:var(--t2)">' + E(x.kind) + '</span><span class="chip ok">Text ready</span>' +
      '<select id="gm' + x.id + '" aria-label="Module for ' + EA(x.title) + '" onchange="gcSetModule(' + x.id + ',+this.value)" style="flex:1 1 200px;min-width:0">' +
      c.mods.map(function (m) { return '<option value="' + m.id + '"' + (m.id === x.module_id ? " selected" : "") + '>' + E(m.t) + (m.pub ? "" : " (hidden)") + '</option>'; }).join("") + '</select>' +
      '<span style="display:flex;gap:6px"><button onclick="gcPrevLive(' + x.id + ')">Preview</button><button class="p" onclick="gcPublishLive(' + x.id + ')"' + (c.mods.length ? "" : " disabled") + '>Publish</button><button class="g" onclick="gcSkipLive(' + x.id + ')">Skip</button></span></div>';
  }).join("") : '<p class="sm" style="margin:10px 0 0">You’re all caught up. New Classroom Materials will show up here.</p>';
  h += '</div>';

  if (off.length) h += '<div class="card"><b>Not added</b><div class="sm">LearnLink can only answer from text. These stay in Classroom.</div>' + off.map(function (x) {
    return '<div class="row" style="flex-wrap:wrap;gap:8px;align-items:center"><span style="flex:1;min-width:180px"><b>' + E(x.title) + '</b><div class="sm">' + E(x.reason || "") + '</div></span><span class="chip" style="background:var(--s1);color:var(--t2)">' + E(x.kind) + '</span>' +
      (x.status === "skipped" ? '<button style="font-size:12px;padding:3px 12px" onclick="gcRestore(' + x.id + ')">Restore</button>' : "") + '</div>';
  }).join("") + '</div>';

  if (d.log.length) h += '<div class="card"><b>Sync history</b>' + d.log.map(function (x) {
    return '<div class="row" style="gap:10px;align-items:flex-start"><span style="width:10px;height:10px;border-radius:50%;margin-top:6px;flex-shrink:0;background:' + (+x.ok ? "var(--ok)" : "var(--er)") + '"></span><span style="flex:1"><b>' + E(gcWhen(x.created_at)) + '</b><div class="sm">' + E(x.message) + '</div></span></div>';
  }).join("") + '</div>';
  return h + gcHowLive();
};

function gcHowLive() {
  return '<p class="sm" style="margin:4px 4px 0">How it works: LearnLink checks Classroom only when the server has internet. Student questions are always answered on the campus server, so they never need the internet.</p>';
}

/* ---- live actions ---- */
function gcConnect() {
  try { localStorage.setItem("ll_gc_course", C().id); } catch (e) {}
  (window.top || window).location.href = "/api/db/google?action=connect";
}
function gcDisconnect() {
  if (!confirm("Disconnect your Google account? Linked classes stop syncing until you connect again. Published materials stay.")) return;
  api("google?action=disconnect", {}).then(function () { GC.cls = null; toast("Google account disconnected."); return gcReload(); }, gcFail);
}
function gcLinkLive() {
  var cid = C().id, gid = $("gcl").value;
  GC.busy = true; render();
  api("google?action=link", { course_id: cid, gc_course_id: gid }).then(function (j) {
    GC.busy = false; toast(j.sync && j.sync.message || "Linked."); return gcReload();
  }, function (e) { GC.busy = false; render(); gcFail(e); });
}
function gcUnlinkLive() {
  if (!confirm("Unlink this class? Drafts waiting for review are removed. Published materials stay.")) return;
  api("google?action=unlink", { course_id: C().id }).then(function () { toast("Unlinked. Published materials stay in LearnLink."); return gcReload(); }, gcFail);
}
function gcSyncLive() {
  GC.busy = true; render();
  api("google?action=sync", { course_id: C().id }).then(function (j) {
    GC.busy = false; toast(j.message); return Promise.all([gcReload(), refresh()]).then(render);
  }, function (e) { GC.busy = false; render(); gcFail(e); });
}
function gcSetModule(id, mid) {
  api("google?action=set_module", { item_id: id, module_id: mid }).then(function () {
    var it = GC.d[C().id].items.filter(function (x) { return x.id === id; })[0]; if (it) it.module_id = mid;
  }, gcFail);
}
function gcModFor(id) {
  var el = $("gm" + id); return el ? +el.value : 0;
}
function gcAfterPublish(msg) {
  closeM(); toast(msg);
  return Promise.all([refresh(), gcLoad(C().id)]).then(render);
}
function gcPublishLive(id) {
  var mid = gcModFor(id), m = C().mods.filter(function (x) { return x.id === mid; })[0];
  api("google?action=publish", { item_id: id, module_id: mid }).then(function () {
    return gcAfterPublish(m && !m.pub ? "Added to " + m.t + ". The module is hidden, so publish it when ready." : "Published to " + (m ? m.t : "the module") + ". Students can ask about it now.");
  }, gcFail);
}
function gcPublishAll() {
  var items = GC.d[C().id].items.filter(function (x) { return x.status === "draft"; }).map(function (x) { return { item_id: x.id, module_id: gcModFor(x.id) || x.module_id }; });
  api("google?action=publish_all", { course_id: C().id, items: items }).then(function () { return gcAfterPublish("Published " + items.length + " materials."); }, gcFail);
}
function gcSkipLive(id) {
  api("google?action=skip", { item_id: id }).then(function () { closeM(); return gcReload(); }, gcFail);
}
function gcRestore(id) {
  api("google?action=restore", { item_id: id }).then(gcReload, gcFail);
}
function gcPrevLive(id) {
  var c = C(), x = GC.d[c.id].items.filter(function (y) { return y.id === id; })[0];
  if (!x) return;
  api("google?action=text&id=" + id).then(function (t) {
    var m = c.mods.filter(function (y) { return y.id === gcModFor(id); })[0];
    openM(mhead(x.title, '<div class="sm">From Google Classroom' + (x.topic ? ' · Topic “' + E(x.topic) + '”' : "") + '</div>') +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 12px"><span class="chip">' + E(x.kind) + '</span><span class="chip ok">Text ready</span><span class="chip pr">Draft · not visible to students</span></div>' +
      '<div class="mh">Text LearnLink will read' + (t.chars > 4000 ? " (first 4,000 of " + t.chars.toLocaleString() + " characters)" : "") + '</div><div class="doc" style="white-space:pre-wrap;max-height:45vh;overflow:auto">' + E(t.text) + '</div>' +
      (m ? '<p class="sm" style="margin:8px 0 0">Will be added to <b>' + E(m.t) + '</b>.</p>' : "") +
      mfoot('<button onclick="gcSkipLive(' + id + ')">Skip</button>', '<button class="p" onclick="gcPublishLive(' + id + ')">Publish</button>'), true);
  }, gcFail);
}

// Start: if the server answers, switch to live mode. Back from Google's sign-in, show the result and open the Classroom tab.
gcLoadStatus().then(function () {
  return gcLoadPending();
}).then(function () {
  var r = /[?&]gc=(\w+)/.exec(location.search);
  if (r) {
    toast(GCMSG[r[1]] || "Back from Google.");
    var want = null; try { want = localStorage.getItem("ll_gc_course"); localStorage.removeItem("ll_gc_course"); } catch (e) {}
    var go = function () { var i = CS.findIndex(function (c) { return c.id === want; }); openC(i > -1 ? i : 0, "gc"); };
    var tries = 0, wait = setInterval(function () { if (CS.length && CS[0].id || ++tries > 20) { clearInterval(wait); go(); } }, 150);
    try { history.replaceState(null, "", location.pathname); } catch (e) {}
  }
  render();
}, function () { /* no server: sample mode */ });
