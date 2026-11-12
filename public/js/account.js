/* Change-password pop-up (kept for reuse; faculty now use the Settings page in faculty-settings.js): change your own password (current password + new one).
   Loaded after faculty.js / admin.js and uses their window helpers (openM, mhead, closeM, toast). */
var PW_ERR = {
  wrong_password: "Your current password is wrong.",
  weak_password: "Use at least 8 characters with a letter and a number.",
  same_password: "Choose a password different from your current one.",
  not_logged_in: "Your session ended. Log out and log in again."
};
function chPw() {
  openM(mhead("Settings", '<div class="sm">Change your password</div>') +
    '<div class="mh">Change password</div>' +
    '<label class="sm" for="cp0">Current password</label><input id="cp0" type="password" autocomplete="current-password" style="width:100%;margin:4px 0 10px">' +
    '<label class="sm" for="cp1">New password</label><input id="cp1" type="password" autocomplete="new-password" style="width:100%;margin:4px 0 2px">' +
    '<div class="sm" style="margin:0 0 10px">At least 8 characters with a letter and a number.</div>' +
    '<label class="sm" for="cp2">Confirm new password</label><input id="cp2" type="password" autocomplete="new-password" style="width:100%;margin:4px 0 4px" onkeydown="if(event.key===\'Enter\')savePw()">' +
    '<p class="er" id="cpe"></p><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px"><button onclick="closeM()">Cancel</button><button class="p" id="cpb" onclick="savePw()">Save new password</button></div>');
  setTimeout(function () { var e = document.getElementById("cp0"); if (e) e.focus(); }, 50);
}
function savePw() {
  var g = function (i) { return document.getElementById(i); }, a = g("cp0").value, b = g("cp1").value, c = g("cp2").value;
  if (!a) { g("cpe").textContent = "Enter your current password."; return; }
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(b)) { g("cpe").textContent = PW_ERR.weak_password; return; }
  if (b !== c) { g("cpe").textContent = "The new passwords don’t match."; return; }
  g("cpb").textContent = "Saving…";
  fetch("/api/db/auth?action=change_password", { method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "learnlink" },
    body: JSON.stringify({ current: a, password: b }) }).then(function (r) {
    return r.json().catch(function () { return { error: "server" }; }).then(function (j) { if (!r.ok || j.error) throw j; return j; });
  }).then(function () { closeM(); toast("Password changed"); }, function (e) {
    g("cpb").textContent = "Save new password";
    g("cpe").textContent = PW_ERR[e && e.error] || "Could not reach the server.";
  });
}
