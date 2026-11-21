/* LearnLink student app, part 7: Settings (photo, appearance, password, my data). */

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
