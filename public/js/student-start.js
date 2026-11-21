/* LearnLink student app, part 10 (load last): first draw, then load the account, courses and chats. */
render();

// The page stays hidden (gate.js) until the account and real course list are in, so sample courses never flash.
if (S.scr === "app") {
  if (LIVE) Promise.all([loadSession(true), loadCourses(true)]).then(function () { LL_ready(); tourStart() }, function (e) {
    LL_authError(e) ? LL_toLogin() : LL_fail();
  });
  else { loadSession(); loadCourses() }
  loadChats()
} else if (window.LL_ready) LL_ready();

themeApply(themeGet());
render();

// On the sign-up page: what's on offer, and whether we just came back from Google with a verified email.
if (S.scr === "reg") {
  S.st = 1;
  api("auth?action=options").then(function (o) { GS.opts = o; }, function () {}).then(function () {
    return api("auth?action=signup_state");
  }).then(function (s) {
    if (s && s.email) {
      R.vem = s.email;
      R.em = s.email;
      R.via = s.via;
      if (s.name && !R.nm) R.nm = s.name;
    }
  }, function () {}).then(render);
}
