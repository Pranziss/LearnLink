/* Loaded first by every app page (student, faculty, admin).
   The apps run inside login.html, which checks the login first. Opened on their own they would only show sample
   data that looks real, so they send people to the login page instead.
   Add ?demo to the address (for example /apps/admin.html?demo) to see the sample data on purpose, with a DEMO banner,
   for design reviews and presentations without the server. */
(function () {
  var demo = /[?&]demo\b/.test(location.search);
  window.LL_DEMO = demo;

  // Leave the app and show the login page (works from inside login.html's frame too).
  window.LL_toLogin = function () {
    try { (window.top || window).location.replace("/login.html"); } catch (e) { location.replace("/login.html"); }
  };

  if (!demo && window.top === window) {
    document.documentElement.style.display = "none";
    location.replace("/login.html");
    return;
  }

  // The page stays hidden until its real data has loaded (LL_ready), so sample data never flashes on screen.
  // Meanwhile a loading placeholder shows the rough shape of the page (sidebar, top bar, content) instead of nothing.
  // Colors come from theme.css (light or dark), with fallbacks in case it hasn't loaded yet.
  if (!demo) document.documentElement.classList.add("ll-wait");
  var css = document.createElement("style");
  css.textContent = "html.ll-wait body{visibility:hidden}" +
    ".ll-skel{position:fixed;inset:0;display:flex;visibility:visible;z-index:99998;pointer-events:none}" +
    "html:not(.ll-wait) .ll-skel{display:none}" +
    ".ll-skel .sb{width:236px;flex-shrink:0;background:var(--sbb,#0A1F63);padding:12px 10px;display:flex;flex-direction:column;gap:14px}" +
    ".ll-skel .sb i{background:rgba(255,255,255,.13)}" +
    ".ll-skel .mn{flex:1;min-width:0;padding:14px 22px;display:flex;flex-direction:column;align-items:center;gap:14px}" +
    ".ll-skel i{display:block;border-radius:12px;background:var(--s1,#ECF0F7);animation:llsk 1s ease-in-out infinite alternate}" +
    "@keyframes llsk{from{opacity:.45}to{opacity:1}}" +
    "@media (max-width:760px){.ll-skel .sb{display:none}}" +
    "@media (prefers-reduced-motion:reduce){.ll-skel i{animation:none}}" +
    ".ll-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}" +
    ".ll-demo{position:fixed;left:50%;top:10px;transform:translateX(-50%);z-index:99999;background:#B42318;color:#fff;" +
    "font:700 11px/1.2 system-ui,sans-serif;letter-spacing:.06em;padding:5px 10px;border-radius:999px;pointer-events:none;" +
    "box-shadow:0 4px 14px rgba(0,0,0,.25)}" +
    "@media (max-width:520px){.ll-demo .x{display:none}}" +   // phones: just "DEMO", clear of the page title
    ".ll-err{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;" +
    "font-family:Nunito,system-ui,sans-serif;background:var(--bg,#F5F7FB);color:var(--tx,#0B1B47)}" +
    ".ll-err>div{max-width:420px;text-align:center;background:var(--s2,#fff);border:1px solid var(--bd,#E0E5EF);border-radius:18px;padding:28px}" +
    ".ll-err h2{margin:0 0 8px}.ll-err p{margin:0 0 16px;line-height:1.6;color:var(--t2,#4A5A85)}" +
    ".ll-err button{font:inherit;font-weight:700;border:0;border-radius:12px;padding:10px 18px;background:var(--ac,#002583);color:var(--bg,#fff);cursor:pointer}";
  document.head.appendChild(css);

  function bar(w, h, more) { return '<i style="width:' + w + ";height:" + h + "px;" + (more || "") + '"></i>'; }
  // Added as soon as <body> exists (not at DOMContentLoaded, which waits for every app script to download).
  var tries = 0;
  function addSkel() {
    if (!document.body) { if (tries++ < 400) setTimeout(addSkel, 15); return; }
    if (!document.documentElement.classList.contains("ll-wait") || document.querySelector(".ll-skel")) return;
    var s = document.createElement("div");
    s.className = "ll-skel";
    s.setAttribute("aria-hidden", "true");
    s.innerHTML = '<div class="sb">' + bar("100%", 38, "border-radius:999px") + bar("60%", 14) + bar("75%", 14) + bar("55%", 14) + bar("70%", 14) + "</div>" +
      '<div class="mn"><div style="align-self:stretch">' + bar("130px", 22) + "</div>" +
      '<div style="flex:1;width:100%;max-width:540px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding-bottom:40px">' +
      bar("84px", 84, "border-radius:50%") + bar("80%", 26) + bar("60%", 14) + bar("100%", 54, "border-radius:16px;margin-top:6px") + "</div></div>";
    document.body.appendChild(s);
    var sr = document.createElement("div");
    sr.className = "ll-sr ll-skel-sr";
    sr.setAttribute("role", "status");
    sr.textContent = "Loading LearnLink…";
    document.body.appendChild(sr);
  }
  if (!demo) addSkel();

  window.LL_ready = function () {
    document.documentElement.classList.remove("ll-wait");
    [].forEach.call(document.querySelectorAll(".ll-skel,.ll-skel-sr"), function (n) { n.remove(); });
  };

  // Server unreachable or an unexpected error: say so plainly instead of showing anything made up.
  window.LL_fail = function () {
    document.body.innerHTML = '<div class="ll-err"><div><h2>Can’t reach LearnLink</h2><p>LearnLink didn’t answer. ' +
      'Check that you’re on the campus Wi‑Fi, then try again.</p><button onclick="location.reload()">Try again</button>' +
      '<p style="margin:14px 0 0;font-size:12px">Admin: check that Laragon (Start All) and <b>npm start</b> are running.</p></div></div>';
    window.LL_ready();
  };

  // An API error that means "not logged in" or "not allowed here" goes back to the login page.
  window.LL_authError = function (e) {
    var code = e && e.error;
    return code === "not_logged_in" || code === "forbidden";
  };

  if (demo) document.addEventListener("DOMContentLoaded", function () {
    var b = document.createElement("div");
    b.className = "ll-demo";
    b.innerHTML = 'DEMO<span class="x"> · SAMPLE DATA</span>';
    document.body.appendChild(b);
  });
})();
