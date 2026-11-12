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
  if (!demo) document.documentElement.classList.add("ll-wait");
  var css = document.createElement("style");
  css.textContent = "html.ll-wait body{visibility:hidden}" +
    ".ll-demo{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:99999;background:#B42318;color:#fff;" +
    "font:700 12px/1.2 system-ui,sans-serif;letter-spacing:.06em;padding:6px 12px;border-radius:999px;pointer-events:none;" +
    "box-shadow:0 4px 14px rgba(0,0,0,.25)}" +
    ".ll-err{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;" +
    "font-family:Nunito,system-ui,sans-serif;background:#F6F7FA;color:#0A1A45}" +
    ".ll-err>div{max-width:420px;text-align:center;background:#fff;border:1px solid #E5E8EF;border-radius:18px;padding:28px}" +
    ".ll-err h2{margin:0 0 8px}.ll-err p{margin:0 0 16px;line-height:1.6;color:#4A5A85}" +
    ".ll-err button{font:inherit;font-weight:700;border:0;border-radius:12px;padding:10px 18px;background:#002583;color:#fff;cursor:pointer}";
  document.head.appendChild(css);

  window.LL_ready = function () { document.documentElement.classList.remove("ll-wait"); };

  // Server unreachable or an unexpected error: say so plainly instead of showing anything made up.
  window.LL_fail = function () {
    document.body.innerHTML = '<div class="ll-err"><div><h2>Can’t reach LearnLink</h2><p>The LearnLink server didn’t answer. ' +
      'Check that it is running (Laragon and <b>npm start</b>), then try again.</p><button onclick="location.reload()">Try again</button></div></div>';
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
    b.textContent = "DEMO · SAMPLE DATA";
    document.body.appendChild(b);
  });
})();
