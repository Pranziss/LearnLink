/* Sign-up and password reset codes for students with no internet (faculty and admin home pages).
   A student types their BISU email on the sign-up or "Forgot password" page and asks for a code. It shows up here:
   for the admin, and for the teacher whose linked Classroom class list has that email. Check their school ID, then read it out. */
var SUC = { list: [], ok: false };

function sucLoad() {
  return fetch("/api/db/auth?action=signup_codes").then(function (r) { return r.ok ? r.json() : null }).then(function (j) {
    if (!j || !j.codes) return;
    var was = JSON.stringify(SUC.list), first = !SUC.ok, old = {};
    SUC.list.forEach(function (c) { old[c.kind + c.email + c.code] = 1; });
    SUC.ok = true;
    SUC.list = j.codes;
    // a pop-up for each new code (not on the first load), on whatever page is open; gone once the code is used
    if (!first) j.codes.forEach(function (c) { if (!old[c.kind + c.email + c.code]) sucPop(c); });
    [].slice.call(document.querySelectorAll(".sucpop")).forEach(function (el) {
      if (!j.codes.some(function (c) { return c.kind + c.email + c.code === el.getAttribute("data-k"); })) el.remove();
    });
    if (S.v === "home" && JSON.stringify(SUC.list) !== was) render();
  }, function () {});
}

function sucPop(c) {
  var box = document.getElementById("sucpops");
  if (!box) {
    box = document.createElement("div");
    box.id = "sucpops";
    box.setAttribute("aria-live", "polite");
    box.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:9999;display:flex;flex-direction:column;gap:10px;max-width:min(360px,calc(100vw - 32px))";
    document.body.appendChild(box);
  }
  var el = document.createElement("div");
  el.className = "card sucpop";
  el.setAttribute("data-k", c.kind + c.email + c.code);
  el.style.cssText = "margin:0;border:2px solid var(--ac);box-shadow:0 10px 30px rgba(0,0,0,.25);animation:none";
  el.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px"><span style="min-width:0"><span class="chip" style="font-size:11px">' +
    (c.kind === "reset" ? "Password reset" : "Sign-up") + '</span><br><b>' + E(c.name || c.email.split("@")[0]) + '</b><br><span class="sm" style="word-break:break-all">' + E(c.email) + '</span></span>' +
    '<button aria-label="Close" onclick="this.closest(\'.sucpop\').remove()" style="border:none;background:none;font-size:18px;line-height:1;padding:2px 4px;cursor:pointer">×</button></div>' +
    '<div style="font:800 26px/1.2 ui-monospace,Menlo,Consolas,monospace;letter-spacing:4px;margin:8px 0 2px">' + E(c.code) + '</div>' +
    '<span class="sm">Check their school ID, then read them the code.</span>';
  box.appendChild(el);
}

// Live: the server says "codes changed" the moment a student asks for a code or uses one (see server.js /api/events).
// The 20-second check below stays as a backup in case the connection drops.
function sucLive() {
  if (!window.EventSource) return;
  var es = new EventSource("/api/events");
  es.addEventListener("codes", function () { sucLoad(); });
  es.onopen = function () { sucLoad(); };     // catch anything missed while reconnecting
}

function sucCard() {
  if (!SUC.ok || !SUC.list.length) return "";
  var n = SUC.list.length, rs = SUC.list.filter(function (c) { return c.kind === "reset"; }).length;
  var t = !rs ? n + ' student' + (n > 1 ? "s are" : " is") + ' signing up'
    : rs === n ? n + (n > 1 ? " people" : " person") + ' forgot their password' : n + ' people are waiting for a code';
  return '<div class="card" id="suc" style="border:2px solid var(--ac)"><b>' + t + '</b>' +
    '<p class="sm" style="margin:2px 0 10px">They may have no internet to get the code by email. Check their school ID, then read them the code. Codes work for 2 hours.</p>' +
    SUC.list.map(function (c, i) {
      return '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;' + (i ? "border-top:1px solid var(--bd)" : "") + '">' +
        '<span style="min-width:0"><b>' + E(c.name || c.email.split("@")[0]) + '</b> <span class="chip" style="font-size:11px">' + (c.kind === "reset" ? "Password reset" : "Sign-up") + '</span><br><span class="sm" style="word-break:break-all">' + E(c.email) +
        (c.classes ? " · " + E(c.classes) : " · not on a class list") + '</span></span>' +
        '<span style="text-align:right;flex-shrink:0"><span style="font:800 22px/1 ui-monospace,Menlo,Consolas,monospace;letter-spacing:3px">' + E(c.code) + '</span><br>' +
        '<span class="sm">' + Math.max(1, +c.mins) + ' min left</span></span></div>';
    }).join("") + "</div>";
}

var _sucHome = home;
home = function () {
  var h = _sucHome(), c = sucCard();
  if (!c) return h;
  // right under the greeting line
  var i = h.indexOf("margin:2px 0 14px");
  i = i > -1 ? h.indexOf("</p>", i) : -1;
  return i > -1 ? h.slice(0, i + 4) + c + h.slice(i + 4) : c + h;
};

sucLoad();
sucLive();
setInterval(function () { if (!document.hidden) sucLoad() }, 20000);
