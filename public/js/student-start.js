/* =====================================================================================================================
   LearnLink student app: start (load last)
   ---------------------------------------------------------------------------------------------------------------------
   First draw, then the first data load. The gate (js/gate.js) keeps the page hidden until LL_ready(), so the sample
   courses never flash on screen before the real ones arrive. LL_authError / LL_toLogin / LL_fail are gate.js too.
   ===================================================================================================================== */

themeApply(themeGet());
render();

if (S.screen === "app") {
  if (LIVE) Promise.all([loadSession(true), loadCourses(true)]).then(function () { LL_ready(); tourStart() }, function (e) {
    LL_authError(e) ? LL_toLogin() : LL_fail()
  });
  else { loadSession(); loadCourses() }
  loadChats()
} else {
  if (window.LL_ready) LL_ready();
  startSignup()
}
