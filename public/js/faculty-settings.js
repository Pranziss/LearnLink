/* Faculty Settings page: profile photo, About you, Appearance, Password, privacy note, Log out.
   Loaded after faculty.js. Opened from the sidebar "Settings" button or "My profile" in the top-right menu. */
var FS = { me: null, ph: "" };

function fsKey() { return "ll_photo_" + (S.currentUser.email || ""); }
function fsLoadPh() { try { FS.ph = localStorage.getItem(fsKey()) || ""; } catch (e) { FS.ph = ""; } }
fsLoadPh();

function openSet() {
  S.v = "settings"; S.pm = false; mob(); fsLoadPh(); render();
  if (!FS.me) api("auth?action=me").then(function (j) { if (j.user) { FS.me = j.user; if (S.v === "settings") render(); } }, function () {});
}

/* ---- photo (kept on this device, per account) ---- */
function fsAv(sz) {
  var ini = E(getInitials(S.currentUser.name));
  return '<div style="width:' + sz + 'px;height:' + sz + 'px;border-radius:50%;margin:0 auto 14px;display:grid;place-items:center;overflow:hidden;background:var(--acb);color:var(--ac);font-size:' +
    Math.round(sz / 3) + 'px;font-weight:800;border:4px solid var(--s2);box-shadow:0 0 0 3px var(--ac),0 12px 24px -12px rgba(0,37,131,.5)">' +
    (FS.ph ? '<img src="' + FS.ph + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block">' : ini) + "</div>";
}
function fsPick(inp) {
  var f = inp.files[0], er = $("fse");
  if (!f) return;
  if (f.size > 2e6) { er.textContent = "Choose a photo under 2 MB"; return; }
  var r = new FileReader();
  r.onload = function () {
    // shrink to 256 px so it fits in browser storage
    var im = new Image();
    im.onload = function () {
      var c = document.createElement("canvas"), k = Math.min(1, 256 / Math.max(im.width, im.height));
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      FS.ph = c.toDataURL("image/jpeg", .85);
      try { localStorage.setItem(fsKey(), FS.ph); } catch (e) {}
      render();
    };
    im.src = r.result;
  };
  r.readAsDataURL(f);
}
function fsRmPh() { FS.ph = ""; try { localStorage.removeItem(fsKey()); } catch (e) {} render(); }

/* ---- appearance (same setting as the student page: ll_theme on this device) ---- */
var FS_THEMES = [["system", "System"], ["light", "Light"], ["dark", "Dark"]];
function fsTheme() { try { return localStorage.getItem("ll_theme") || "system"; } catch (e) { return "system"; } }
function fsThemeSet(t) {
  try { localStorage.setItem("ll_theme", t); } catch (e) {}
  [document, (function () { try { return parent !== window ? parent.document : null; } catch (e) { return null; } })()].forEach(function (d) {
    if (!d) return;
    if (t === "system") d.documentElement.removeAttribute("data-theme"); else d.documentElement.setAttribute("data-theme", t);
  });
  render();
}

/* ---- password ---- */
function fsPw() {
  var f = $("fpf"), m = $("fpm"), b = $("fpb");
  if (f.style.display === "none") { f.style.display = ""; b.textContent = "Save new password"; b.className = "p"; $("fp0").focus(); m.textContent = ""; return; }
  var a = $("fp0").value, n = $("fp1").value, c = $("fp2").value;
  m.style.color = "var(--er)";
  if (!a) { m.textContent = "Enter your current password."; return; }
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(n)) { m.textContent = "Use at least 8 characters with a letter and a number."; return; }
  if (n !== c) { m.textContent = "The new passwords don’t match."; return; }
  b.textContent = "Saving…";
  fetch("/api/db/auth?action=change_password", { method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "learnlink" },
    body: JSON.stringify({ current: a, password: n }) }).then(function (r) {
    return r.json().catch(function () { return { error: "server" }; }).then(function (j) { if (!r.ok || j.error) throw j; return j; });
  }).then(function () {
    f.style.display = "none"; ["fp0", "fp1", "fp2"].forEach(function (i) { $(i).value = ""; });
    b.textContent = "Change password"; b.className = "";
    m.style.color = "var(--ok,#1f7a4a)"; m.textContent = "Password changed. Use it next time you log in.";
  }, function (e) {
    b.textContent = "Save new password";
    m.textContent = (typeof PW_ERR !== "undefined" && PW_ERR[e && e.error]) || "Could not reach the server.";
  });
}

function fsDate(s) {
  if (!s) return "";
  var d = new Date(String(s).replace(" ", "T"));
  return isNaN(d) ? s : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function fsPage() {
  var u = FS.me || {}, user = S.currentUser;
  var mine = CS.map(function (c) { return c.n + (c.s ? " (" + c.s + ")" : ""); });
  var rows = [["Email", u.email || user.email], ["Username", u.username || "—"], ["Role", "Faculty"],
    ["Courses you teach", mine.length ? mine.join("\n") : "None yet"]];
  if (u.created_at) rows.push(["Member since", fsDate(u.created_at)]);
  var cur = fsTheme();
  return '<div class="sc"><div style="max-width:560px;margin:0 auto">' +
    '<div style="text-align:center;margin:14px 0 20px">' + fsAv(96) +
    '<label class="p" style="display:inline-block;cursor:pointer;padding:8px 16px;border-radius:14px;font-weight:700;font-size:14px">' +
    (FS.ph ? "Choose another" : "Choose a photo") + '<input type="file" accept="image/*" hidden onchange="fsPick(this)"></label>' +
    (FS.ph ? ' <button onclick="fsRmPh()" style="margin-left:6px">Remove</button>' : "") +
    '<p class="er" id="fse" style="text-align:center"></p><h2 style="margin:2px 0 6px;font-size:26px">' + E(u.name || user.name) +
    '</h2><span class="chip">Faculty</span></div>' +

    '<div class="card"><b>About you</b>' + rows.map(function (r, i) {
      return '<div style="display:flex;justify-content:space-between;gap:16px;padding:10px 0;' + (i ? "border-top:1px solid var(--bd)" : "") +
        '"><span class="sm">' + r[0] + '</span><span style="text-align:right;font-weight:700;word-break:break-word;white-space:pre-line">' + E(r[1]) + "</span></div>";
    }).join("") + '<p class="sm" style="margin:8px 0 0">Your name, email and courses are set by the admin. Ask them if something is wrong.</p></div>' +

    '<div class="card"><b>Appearance</b><p class="sm" style="margin:2px 0 0">Choose how LearnLink looks on this device. System follows your phone or computer.</p><div class="seg" role="radiogroup" aria-label="Theme">' +
    FS_THEMES.map(function (x) {
      return '<button role="radio" aria-checked="' + (cur === x[0]) + '" class="' + (cur === x[0] ? "on" : "") + '" onclick="fsThemeSet(\'' + x[0] + '\')">' + x[1] + "</button>";
    }).join("") + "</div></div>" +

    '<div class="card"><b>Password</b><p class="sm" style="margin:2px 0 10px">Change the password you use to log in.</p>' +
    '<div id="fpf" style="display:none"><label class="sm" for="fp0">Current password</label><input id="fp0" type="password" autocomplete="current-password" style="width:100%;margin:4px 0 10px">' +
    '<label class="sm" for="fp1">New password</label><input id="fp1" type="password" autocomplete="new-password" style="width:100%;margin:4px 0 2px">' +
    '<div class="sm" style="margin:0 0 10px">At least 8 characters with a letter and a number.</div>' +
    '<label class="sm" for="fp2">Confirm new password</label><input id="fp2" type="password" autocomplete="new-password" style="width:100%;margin:4px 0 8px" onkeydown="if(event.key===\'Enter\')fsPw()"></div>' +
    '<button id="fpb" onclick="fsPw()">Change password</button><p class="sm" id="fpm" style="margin:8px 0 0"></p></div>' +

    '<div class="card"><b>Student privacy</b><p class="sm" style="margin:2px 0 0">You see anonymous summaries of what students ask (common topics, gaps, ratings). Student chats stay private to each student and are never shown to faculty or the admin.</p></div>' +

    '<div class="card"><button style="width:100%;color:var(--er)" onclick="localStorage.removeItem(\'learnlink_user\');parent.postMessage(\'logout\',\'*\')">Log out</button></div>' +
    "</div></div>";
}

// course() is what the main area shows when the view is not "home": show Settings instead when asked.
var _fsCourse = course;
course = function () { return S.v === "settings" ? fsPage() : _fsCourse(); };

// the round initials button in the top bar shows the photo too
var _fsApp = app;
app = function () {
  var h = _fsApp();
  if (FS.ph) h = h.replace(/(<button class="g" aria-label="Profile"[^>]*>)<span style="([^"]*)">[^<]*<\/span>/,
    '$1<span style="$2;overflow:hidden"><img src="' + FS.ph + '" alt="" style="width:100%;height:100%;object-fit:cover"></span>');
  return h;
};
