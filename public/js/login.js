var SRC = {
  student: "apps/student.html?start=app",
  register: "apps/student.html?start=register",
  faculty: "apps/faculty.html",
  admin: "apps/admin.html"
};
var LLC = { gen: true, lv: 3 }, $ = function (i) {
  return document.getElementById(i)
};

// One login for everyone: the account itself says whether it is a student, faculty or admin.
function view() {
  var h = '<div style="display:flex;justify-content:center;margin-bottom:6px">' + bot(64) + '</div><h1>LearnLink</h1><p class="sub">Study smarter from your own course modules</p>' +
    '<label for="em">BISU email</label><input id="em" type="email" autocomplete="username" placeholder="name@bisu.edu.ph" style="width:100%" onkeydown="if(event.key===\'Enter\')$(\'pw\').focus()" onblur="var v=this.value.trim();if(v&&v.indexOf(\'@\')<0)this.value=v+\'@bisu.edu.ph\'">' +
    '<label for="pw">Password</label><div style="position:relative"><input id="pw" type="password" autocomplete="current-password" style="width:100%;padding-right:64px" onkeydown="if(event.key===\'Enter\')go()"><button type="button" onclick="var p=$(\'pw\');p.type=p.type===\'password\'?\'text\':\'password\';this.textContent=p.type===\'password\'?\'Show\':\'Hide\'" style="position:absolute;right:4px;top:4px;padding:5px 10px;font-size:12px;border:none">Show</button></div>' +
    '<p style="margin:6px 0 0;text-align:right;font-size:13px"><a href="#" onclick="forgot();return false" style="color:var(--ac);font-weight:700">Forgot password?</a></p>' +
    '<p class="er" id="er">' + E(MSG) + '</p><button class="p" id="lgb" style="width:100%" onclick="go()">Log in</button>' + gBtn() +
    '<p class="sub" style="margin:14px 0 0">New student? <a href="#" onclick="launch(\'register\');return false" style="color:var(--ac);font-weight:700">Create an account</a></p>' +
    '<p class="sub" style="margin:6px 0 0;font-size:12px">Teachers: the admin makes your account.</p>';
  $("card").innerHTML = h;
  $("card").style.animation = "none";
  void $("card").offsetWidth;
  $("card").style.animation = "";
}

function bot(s) {
  return '<svg width="' + s + '" height="' + Math.round(s * 1.1) + '" viewBox="0 0 40 44" style="flex-shrink:0;display:block" role="img" aria-label="LearnLink AI"><line x1="20" y1="8.5" x2="20" y2="4" stroke="#FFB800" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="3.6" r="2.6" fill="#FFB800" stroke="#fff" stroke-width="1"/><path d="M3 26A17 17 0 0 1 37 26Z" fill="#002583"/><path d="M3 26A17 17 0 0 0 37 26Z" fill="#FFB800"/><circle cx="20" cy="26" r="17" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="14" cy="22" r="3.6" fill="#fff"/><circle cx="26" cy="22" r="3.6" fill="#fff"/><circle cx="14.8" cy="22.6" r="1.9" fill="#0A1A45"/><circle cx="26.8" cy="22.6" r="1.9" fill="#0A1A45"/><circle cx="15.4" cy="21.8" r=".7" fill="#fff"/><circle cx="27.4" cy="21.8" r=".7" fill="#fff"/><circle cx="9.5" cy="31.5" r="2.2" fill="#F08A24" opacity=".55"/><circle cx="30.5" cy="31.5" r="2.2" fill="#F08A24" opacity=".55"/><path d="M15.5 31Q20 35.5 24.5 31" fill="none" stroke="#0A1A45" stroke-width="2.2" stroke-linecap="round"/></svg>'
}


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
var E = function (s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
}, OPTS = null, MSG = "";
// "Continue with Google": shown only where Google can send people back (the address set in GOOGLE_SIGNIN_REDIRECT_URI)
function gOk() {
  if (!OPTS || !OPTS.google) return false;
  try { return new URL(OPTS.redirect).origin === location.origin } catch (e) { return false }
}
function gBtn() {
  if (!gOk()) return "";
  return '<div style="display:flex;align-items:center;gap:10px;margin:14px 0 10px;color:var(--t2);font-size:12px"><span style="flex:1;height:1px;background:currentColor;opacity:.3"></span>or<span style="flex:1;height:1px;background:currentColor;opacity:.3"></span></div>' +
    '<button onclick="location.href=\'/api/db/auth?action=google_start\'" style="width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:11px;font-weight:700;background:#fff;color:#1f1f1f;border:1px solid #dadce0;border-radius:14px;cursor:pointer">' +
    '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>' +
    'Continue with Google</button><p style="margin:6px 0 0;font-size:11px;text-align:center;color:var(--t2)">Needs internet. Email and password work on campus Wi‑Fi anytime.</p>'
}
var GSMSG = {
  denied: "Google sign-in was cancelled.",
  expired: "That sign-in took too long. Please try again.",
  offline: "The campus server has no internet right now. Log in with your email and password instead.",
  domain: "Use your BISU Google account (@bisu.edu.ph).",
  disabled: "This account is disabled. Ask the admin.",
  roster: "Your email isn’t on any class list linked to LearnLink yet. Ask your teacher.",
  off: "Google sign-in isn’t set up on this server.",
  failed: "Google sign-in didn’t work. Try again, or use your email and password."
};
var LOGIN_ERR = {
  bad_login: "Wrong email or password.",
  account_disabled: "This account is disabled. Ask the admin.",
  php_unreachable: "Cannot reach the database. In Laragon, click Start All (Apache and MySQL), then try again.",
  server_error: "The server could not read the database. Did you run php database/setup.php?"
};

/* ---- Forgot password ----
   1. email  2. 6-digit code (emailed when the server has internet; otherwise the admin or teacher reads it out)
   3. new password. Then back to the login with the email filled in. */
var FP = { em: "" };
var FP_ERR = {
  bad_email: "Use your BISU email (@bisu.edu.ph).",
  code_expired: "That code has expired. Ask for a new one.",
  too_many_tries: "Too many wrong tries. Ask for a new code.",
  bad_code: "That code isn’t right. Check it and try again.",
  weak_password: "Use at least 8 characters with a letter and a number.",
  reset_first: "That took too long. Start again.",
  account_disabled: "This account is disabled. Ask the admin.",
  php_unreachable: "Cannot reach the server."
};
function fpCard(h) {
  $("card").innerHTML = '<div style="display:flex;justify-content:center;margin-bottom:6px">' + bot(52) + '</div><h1 style="font-size:22px">Forgot password</h1>' + h +
    '<p class="sub" style="margin:14px 0 0"><a href="#" onclick="MSG=\'\';view();return false" style="color:var(--ac);font-weight:700">Back to log in</a></p>';
}
function forgot() {
  var e = ($("em") && $("em").value.trim()) || FP.em;
  fpCard('<p class="sub">Enter your BISU email. We’ll give you a code to set a new password.</p>' +
    '<label for="fe">BISU email</label><input id="fe" type="email" autocomplete="username" placeholder="name@bisu.edu.ph" style="width:100%" value="' + E(e) + '" onkeydown="if(event.key===\'Enter\')fpStart()">' +
    '<p class="er" id="fer"></p><button class="p" id="fb" style="width:100%" onclick="fpStart()">Get a code</button>');
  $("fe").focus();
}
function fpStart() {
  var e = $("fe").value.trim();
  if (e && e.indexOf("@") < 0) e += "@bisu.edu.ph";
  if (!e) { $("fer").textContent = "Enter your BISU email"; return; }
  $("fb").textContent = "Please wait…";
  api("auth?action=reset_start", { email: e }).then(function (j) {
    FP.em = j.email;
    fpCode(j.mail);
  }, function (x) { $("fb").textContent = "Get a code"; $("fer").textContent = FP_ERR[x && x.error] || "Cannot reach the server."; });
}
function fpCode(mail) {
  fpCard('<div class="sub" style="text-align:left;background:var(--acb,rgba(0,37,131,.08));border-radius:12px;padding:10px 12px;margin:8px 0 12px;line-height:1.5"><b>If ' + E(FP.em) + ' has an account, a code is ready.</b><br>' +
    (mail ? "We emailed it to your BISU inbox. No email or no internet? " : "") + 'Ask the admin or your teacher for it, and bring your school ID. It works for 2 hours.</div>' +
    '<label for="fc">6-digit code</label><input id="fc" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" style="width:100%;letter-spacing:6px;font-size:20px;text-align:center" onkeydown="if(event.key===\'Enter\')fpVerify()">' +
    '<p class="er" id="fer"></p><button class="p" id="fb" style="width:100%" onclick="fpVerify()">Verify</button>' +
    '<p class="sub" style="margin:10px 0 0;font-size:13px"><a href="#" onclick="forgot();return false" style="color:var(--ac)">Use a different email</a> · <a href="#" onclick="fpAgain();return false" style="color:var(--ac)">Ask again</a></p>');
  $("fc").focus();
}
function fpAgain() {
  api("auth?action=reset_start", { email: FP.em }).then(function (j) { fpCode(j.mail); $("fer").textContent = "If you asked over a minute ago, a new code is ready."; }, function () {});
}
function fpVerify() {
  var c = $("fc").value.replace(/\D/g, "");
  if (c.length !== 6) { $("fer").textContent = "Enter the 6-digit code"; return; }
  $("fb").textContent = "Checking…";
  api("auth?action=reset_verify", { email: FP.em, code: c }).then(fpNew, function (x) {
    $("fb").textContent = "Verify";
    $("fer").textContent = (FP_ERR[x && x.error] || "Cannot reach the server.") + (x && x.left > 0 ? " " + x.left + " tries left." : "");
  });
}
function fpNew() {
  fpCard('<p class="sub">Set a new password for <b>' + E(FP.em) + '</b>.</p>' +
    '<label for="np">New password</label><input id="np" type="password" autocomplete="new-password" style="width:100%">' +
    '<p class="sub" style="margin:4px 0 0;font-size:12px;text-align:left">At least 8 characters with a letter and a number.</p>' +
    '<label for="np2">Confirm new password</label><input id="np2" type="password" autocomplete="new-password" style="width:100%" onkeydown="if(event.key===\'Enter\')fpFinish()">' +
    '<p class="er" id="fer"></p><button class="p" id="fb" style="width:100%" onclick="fpFinish()">Save new password</button>');
  $("np").focus();
}
function fpFinish() {
  var a = $("np").value, b = $("np2").value;
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(a)) { $("fer").textContent = FP_ERR.weak_password; return; }
  if (a !== b) { $("fer").textContent = "The passwords don’t match."; return; }
  $("fb").textContent = "Saving…";
  api("auth?action=reset_finish", { password: a }).then(function () {
    MSG = "";
    view();
    $("em").value = FP.em;
    $("er").style.color = "var(--ok,#1f7a4a)";
    $("er").textContent = "Password changed. Log in with your new password.";
    $("pw").focus();
  }, function (x) {
    $("fb").textContent = "Save new password";
    $("fer").textContent = FP_ERR[x && x.error] || "Cannot reach the server.";
    if (x && x.error === "reset_first") setTimeout(forgot, 1500);
  });
}

function go() {
  var e = $("em").value.trim(), p = $("pw").value;
  if (e && e.indexOf("@") < 0) e += "@bisu.edu.ph";
  if (!e || !p) {
    $("er").textContent = "Enter your email and password";
    return
  }
  $("er").textContent = "";
  $("er").style.color = "";
  $("lgb").textContent = "Logging in…";
  api("auth?action=login", { email: e, password: p }).then(function (j) {
    launch(j.user.role)
  }, function (x) {
    $("lgb").textContent = "Log in";
    $("er").textContent = LOGIN_ERR[x && x.error] || "Cannot reach the server."
  })
}

async function relay(m) {
  var f = $("fr"), send = function (o) {
    if (f.contentWindow) f.contentWindow.postMessage({ llmr: o }, "*")
  };
  try {
    var r = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: m.q, scope: (typeof m.ctx === "string" ? m.ctx : m.scope) || null, gen: LLC.gen !== false,
        lv: LLC.lv })
    }), j = await r.json().catch (function () {
      return { error: "no_server" }
    });
    if (!r.ok || j.error) throw new Error(j.error || "error");
    send({ id: m.id, text: j.text, data: j })
  } catch (x) {
    send({ id: m.id, err: String(x && x.message || x) })
  }
}
async function relayStream(m) {
  var f = $("fr"), send = function (o) {
    if (f.contentWindow) f.contentWindow.postMessage({ llmr: o }, "*")
  };
  try {
    var r = await fetch("/api/ai/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: m.q, scope: m.scope || null, history: m.history || [], gen: LLC.gen !== false,
        lv: LLC.lv })
    });
    if (!r.ok || !r.body) {
      var j = await r.json().catch (function () {
        return { error: "no_server" }
      });
      throw new Error(j.error || "error")
    }
    var rd = r.body.getReader(), dc = new TextDecoder(), buf = "";
    for (;;) {
      var x = await rd.read();
      if (x.done) break;
      buf += dc.decode(x.value, { stream: true });
      var ls = buf.split("\n");
      buf = ls.pop();
      ls.forEach(function (l) {
        if (l.trim()) {
          try {
            send({ id: m.id, ev: JSON.parse(l) })
          } catch (e) {}
        }
      })
    }
  } catch (x) {
    send({ id: m.id, err: String(x && x.message || x) })
  }
}

function launch(k) {
  var f = $("fr");
  window.LLCFG = LLC;
  // back from Google's sign-in (/login.html?gc=...): pass the result on to the faculty page
  var gc = /[?&]gc=(\w+)/.exec(location.search);
  f.src = SRC[k] + (gc ? (SRC[k].indexOf("?") > -1 ? "&" : "?") + "gc=" + gc[1] : "");
  if (gc) try { history.replaceState(null, "", location.pathname) } catch (e) {}
  f.className = "show";
  $("login").style.display = "none";

}
window.addEventListener("message", function (e) {
  if (e.source === $("fr").contentWindow && e.data && e.data.llm) relay(e.data.llm);
  if (e.source === $("fr").contentWindow && e.data && e.data.llms) relayStream(e.data.llms);
  if (e.source === $("fr").contentWindow && e.data && e.data.cfg) LLC = e.data.cfg;
  if (e.source === $("fr").contentWindow && e.data === "logout") {
    api("auth?action=logout", {}).catch (function () {});
    var f = $("fr");
    f.className = "";
    f.src = "about:blank";
    $("login").style.display = "";
    MSG = "";
    view()
  }
});
// back from "Continue with Google" (/login.html?gs=...)
var GS0 = (/[?&]gs=(\w+)/.exec(location.search) || [])[1];
if (GS0) {
  try { history.replaceState(null, "", location.pathname) } catch (e) {}
  MSG = GSMSG[GS0] || "";
}
view();
api("auth?action=options").then(function (o) {
  OPTS = o;
  if ($("login").style.display !== "none") view()
}, function () {});
api("auth?action=me").then(function (j) {
  if (j.user) launch(j.user.role);
  else if (GS0 === "signup") launch("register")
}, function () {});

// Appearance chosen in the student Settings (System / Light / Dark), saved on this device
try { (function (t) { if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t) })(localStorage.getItem("ll_theme")) } catch (e) {}
