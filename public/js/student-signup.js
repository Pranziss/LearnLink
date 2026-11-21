/* LearnLink student app, part 2: sign-up (Google or a code, then your details). */

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

function cin(el) {
  el.value = el.value.replace(/\D/g, "");
  var b = [].slice.call(D.querySelectorAll("#bx input")), i = b.indexOf(el);
  if (el.value && i < 5) b[i + 1].focus();
  if (b.every(function (x) {
    return x.value
  })) vfy()
}

var AGS = [
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

function dots() {
  var n = ["Verify your email", "Your details"];
  return '<div style="display:flex;gap:6px;margin-bottom:16px">' + n.map(function (x, i) {
    var d = i + 1 < S.st, c = i + 1 === S.st;
    return '<div style="flex:1;text-align:center;font-size:12px;color:' + (c ? "var(--ac)" : "var(--t3)") +
      '"><div style="height:4px;border-radius:2px;background:' + (d || c ? "var(--ac)" : "var(--bd)") + ';margin-bottom:4px"></div>' + x + "</div>";
  }).join("") + "</div>";
}

function gather() {
  ["nm", "sid", "em", "col", "prg", "yr", "sec", "pw", "pw2"].forEach(function (k) {
    var e = $(k);
    if (e) R[k] = e.value.trim();
  });
}

function reg() {
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
}

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

function vfy() {
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
}

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

