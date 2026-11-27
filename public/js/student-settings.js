/* =====================================================================================================================
   LearnLink student app: Settings (profile, photo, appearance, password, my data)
   ===================================================================================================================== */

function settingsView() {
  // ?demo has no account: the sample student is shown instead
  var rows = [
    ["Email", ME.email || "maria.santos@bisu.edu.ph"],
    ["Student ID", ME.studentId || "2024-00123"],
    ["College", ME.college || "College of Computing and Information Sciences (CCIS)"],
    ["Program", ME.program || "BS Information Technology"],
    ["Year level", ME.year || "3rd year"],
    ["Section", ME.section || "C"]
  ];
  var about = '<div class="card"><b>About you</b>' + rows.map(function (r, i) {
    return '<div style="display:flex;justify-content:space-between;gap:16px;padding:10px 0;' + (i ? "border-top:1px solid var(--bd)" : "") + '">' +
      '<span class="sm">' + r[0] + '</span><span style="text-align:right;font-weight:700;word-break:break-word">' + esc(r[1]) + "</span></div>"
  }).join("") + "</div>";
  return {
    main: '<div class="sc"><div style="max-width:560px;margin:0 auto">' +
      '<div style="text-align:center;margin:8px 0 20px">' + photoCircle(96) + photoButtons() + '<p class="er" id="photoError" style="text-align:center"></p>' +
      '<h2 style="margin:2px 0 6px;font-size:26px">' + esc(displayName()) + '</h2><span class="chip">Student</span></div>' +
      about + themeCard() + passwordCard() + myDataCard() +
      '<div class="card"><button style="width:100%;color:var(--er)" onclick="leaveGuard(logOut)">Log out</button></div></div></div>'
  }
}

/* ---------- photo (kept on this page only, not uploaded) ---------- */
function photoCircle(size) {
  var inside = ME.photo ? '<img src="' + ME.photo + '" alt="" style="width:100%;height:100%;object-fit:cover;display:block">' : esc(displayName().slice(0, 2).toUpperCase());
  return '<div style="width:' + size + "px;height:" + size + "px;border-radius:50%;margin:0 auto 14px;display:grid;place-items:center;overflow:hidden;background:var(--acb);color:var(--ac);font-size:" +
    Math.round(size / 3) + 'px;font-weight:800;border:4px solid var(--s2);box-shadow:0 0 0 3px var(--sh),0 12px 24px -12px rgba(0,37,131,.5)">' + inside + "</div>"
}
function photoButtons() {
  return '<label class="p" style="display:inline-block;cursor:pointer;padding:8px 16px;border-radius:14px;font-weight:700;margin:0;font-size:14px;color:var(--bg)">' +
    (ME.photo ? "Choose another" : "Choose a photo") + '<input type="file" accept="image/*" hidden onchange="pickPhoto(this)"></label>' +
    (ME.photo ? ' <button onclick="ME.photo=\'\';render()" style="margin-left:6px">Remove</button>' : "")
}
function pickPhoto(input) {
  var f = input.files[0];
  if (!f) return;
  if (f.size > 2e6) { $("photoError").textContent = "Choose a photo under 2 MB"; return }
  var r = new FileReader();
  r.onload = function () { ME.photo = r.result; render() };
  r.readAsDataURL(f)
}

/* ---------- appearance: System / Light / Dark (saved on this device only) ---------- */
var THEMES = [["system", "System"], ["light", "Light"], ["dark", "Dark"]];

function themeGet() {
  try { return localStorage.getItem("ll_theme") || "system" } catch (e) { return "system" }
}
// Applied to this page and to login.html around it.
function themeApply(t) {
  var outer = null;
  try { outer = LIVE ? parent.document : null } catch (e) {}
  [document, outer].forEach(function (d) {
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
  return '<div class="card"><b>Appearance</b><p class="sm" style="margin:2px 0 10px">Choose how LearnLink looks on this device. System follows your phone or computer.</p>' +
    '<div class="seg" role="radiogroup" aria-label="Theme">' + THEMES.map(function (x) {
      return '<button role="radio" aria-checked="' + (cur === x[0]) + '" class="' + (cur === x[0] ? "on" : "") + '" onclick="themeSet(\'' + x[0] + "')\">" + x[1] + "</button>"
    }).join("") + "</div></div>"
}

/* ---------- password: change it with the current one (forgot it? "Forgot password?" on the login page) ---------- */
// The form is drawn hidden and opened by the first tap, without a redraw, so typed passwords never go through render().
function passwordCard() {
  return '<div class="card"><b>Password</b><p class="sm" style="margin:2px 0 10px">Change the password you use to log in.</p>' +
    '<div id="pwForm" style="display:none">' +
    '<label class="sm" for="pwCurrent">Current password</label><input id="pwCurrent" type="password" autocomplete="current-password" style="width:100%;margin:4px 0 10px">' +
    '<label class="sm" for="pwNew">New password</label><input id="pwNew" type="password" autocomplete="new-password" style="width:100%;margin:4px 0 2px">' +
    '<div class="sm" style="margin:0 0 10px">At least 8 characters with a letter and a number.</div>' +
    '<label class="sm" for="pwConfirm">Confirm new password</label><input id="pwConfirm" type="password" autocomplete="new-password" style="width:100%;margin:4px 0 8px" onkeydown="if(event.key===\'Enter\')changePassword()">' +
    "</div>" +
    '<button id="pwButton" onclick="changePassword()">Change password</button><p class="sm" id="pwMessage" style="margin:8px 0 0"></p></div>'
}
var PASSWORD_ERRORS = {
  wrong_password: "Your current password is wrong.",
  weak_password: "Use at least 8 characters with a letter and a number.",
  same_password: "Choose a password different from your current one."
};
function changePassword() {
  var form = $("pwForm"), msg = $("pwMessage"), button = $("pwButton");
  if (form.style.display === "none") {   // first tap: show the form
    form.style.display = "";
    button.textContent = "Save new password";
    button.className = "p";
    $("pwCurrent").focus();
    msg.textContent = "";
    return
  }
  var current = $("pwCurrent").value, next = $("pwNew").value, again = $("pwConfirm").value;
  msg.style.color = "var(--er)";
  if (!current) { msg.textContent = "Enter your current password."; return }
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(next)) { msg.textContent = PASSWORD_ERRORS.weak_password; return }
  if (next !== again) { msg.textContent = "The new passwords don’t match."; return }
  button.textContent = "Saving…";
  api("auth?action=change_password", { current: current, password: next }).then(function () {
    form.style.display = "none";
    ["pwCurrent", "pwNew", "pwConfirm"].forEach(function (i) { $(i).value = "" });
    button.textContent = "Change password";
    button.className = "";
    msg.style.color = "var(--ok,#1f7a4a)";
    msg.textContent = "Password changed. Use it next time you log in."
  }, function (e) {
    button.textContent = "Save new password";
    msg.textContent = PASSWORD_ERRORS[e && e.error] || "Could not reach the server."
  })
}

/* ---------- my data (Data Privacy Act, RA 10173): download everything, or delete all chats ---------- */
function myDataCard() {
  return '<div class="card"><b>Privacy and my data</b><p class="sm">Your chats are private. Faculty only see anonymous summaries. You can download everything LearnLink keeps about you, or delete your chats, at any time.</p>' +
    '<button onclick="deleteMyChats()">Delete my chats</button> <button onclick="downloadMyData()">Download my data</button><p class="sm" id="dataMessage" style="margin:8px 0 0"></p></div>'
}
function dataMessage(t) {
  var e = $("dataMessage");
  if (e) e.textContent = t
}
function downloadMyData() {
  fetch("/api/db/chats?action=export").then(function (r) {
    if (!r.ok) throw r;
    return r.blob()
  }).then(function (b) {
    var a = D.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = "learnlink-my-data-" + new Date().toISOString().slice(0, 10) + ".json";
    D.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href) }, 4000);
    dataMessage("Downloaded: your profile, all your chats, and the ratings you gave.")
  }, function () {
    dataMessage("Couldn’t reach the server. Try again on the campus network.")
  })
}
function deleteMyChats() {
  if (!confirm("Delete all your chats? Your questions, LearnLink's answers and your ratings will be removed for good. Your account stays.")) return;
  api("chats?action=delete_all", {}).then(function (j) {
    SAVED_CHATS = [];
    CHAT = [];
    SOURCES = [];
    chatId = null;
    render();
    dataMessage(j.deleted ? "Deleted " + j.deleted + " chat" + (j.deleted === 1 ? "" : "s") + "." : "You had no saved chats.")
  }, function () {
    dataMessage("Couldn’t reach the server. Nothing was deleted.")
  })
}
