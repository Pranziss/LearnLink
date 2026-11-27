/* =====================================================================================================================
   LearnLink student app: creating an account (two steps)
   ---------------------------------------------------------------------------------------------------------------------
   1. Prove it's your BISU email: "Continue with Google", or a 6-digit code your teacher / the admin reads out to you
      (also emailed when the server can send mail).
   2. Your details and password, with one consent checkbox right before "Create account".
   After that the student logs in with email + password over the campus network, internet or not.
   The server side is api/auth.php (signup_start, signup_verify, register).
   ===================================================================================================================== */

var COLLEGES = {
  "College of Computing and Information Sciences (CCIS)": ["BS Information Technology", "BS Computer Science"],
  "College of Criminal Justice (CCJ)": ["BS Criminology"],
  "College of Technology and Allied Sciences (CTAS)": ["BSIT major in Food Preparation Services Management",
    "BS Electrical Technology", "BS Electronics Technology"]
};
var AGREEMENTS = [
  ["Terms of Use", "I will use LearnLink for my own studies and keep my account to myself."],
  ["Data Privacy (RA 10173)", "LearnLink may collect my name, student ID, school info, and questions to run the service. I can export or delete my data anytime."],
  ["Course Materials (RA 8293)", "I will use modules for my own learning and not copy or share them outside LearnLink."]
];
var SIGNUP_ERRORS = {
  bad_email: "Only BISU emails are accepted. Use name@bisu.edu.ph",
  email_taken: "That email already has an account. Log in instead.",
  not_on_roster: "That email isn’t on any class list linked to LearnLink yet. Ask your teacher to link your Classroom class.",
  bad_code: "That code doesn’t match. Check it with your teacher and try again.",
  code_expired: "That code has expired. Ask for a new one.",
  too_many_tries: "Too many wrong tries. Ask for a new code.",
  verify_first: "Your email check timed out. Please verify your email again.",
  weak_password: "Use at least 8 characters with a letter and a number",
  missing_name: "Enter your full name",
  must_agree: "Please agree to the terms to create your account",
  php_unreachable: "Can’t reach the campus server. Check that you’re on the campus Wi‑Fi.",
  server_error: "Sign-up isn’t working right now. Try again later, or tell your teacher. (Admin: run php database/setup.php.)",
  unknown_action: "Sign-up isn’t working right now. Try again later, or tell your teacher. (Admin: update the whole learnlink folder, then run php database/setup.php.)"
};
function signupError(x) {
  return SIGNUP_ERRORS[x && x.error] || "Something went wrong. Check that you’re on the campus Wi‑Fi, then try again."
}

// What the form holds, by input id. gatherForm() copies the inputs in here before every redraw.
var FORM = { email: "", fullName: "", studentId: "", college: "", program: "", year: "", section: "", password: "", password2: "", agree: false };
var SIGNUP = {
  options: null,          // from the server: is Google sign-in set up, and where it sends people back
  verifiedEmail: "",      // set once step 1 is done
  via: "",                // "google" or "code"
  codeSent: false,        // the code boxes are showing
  codeSentBefore: false,  // a code was asked for already ("Ask again" keeps the earlier emailed status)
  emailed: false,         // the code was emailed
  mailWorks: false,       // the server can send mail at all
  teacher: false,         // a teacher can see the code too (not just the admin)
  busy: false,            // waiting for the server
  termsOpen: false        // the agreement text is expanded
};
function signupStep() { return SIGNUP.verifiedEmail ? 2 : 1 }

function gatherForm() {
  Object.keys(FORM).forEach(function (k) {
    var e = $(k);
    if (e && k !== "agree") FORM[k] = e.value.trim()
  })
}

// On load: what's on offer, and whether we just came back from Google with a verified email.
function startSignup() {
  api("auth?action=options").then(function (o) { SIGNUP.options = o }, function () {}).then(function () {
    return api("auth?action=signup_state")
  }).then(function (s) {
    if (s && s.email) {
      SIGNUP.verifiedEmail = s.email;
      SIGNUP.via = s.via;
      FORM.email = s.email;
      if (s.name && !FORM.fullName) FORM.fullName = s.name
    }
  }, function () {}).then(render)
}

/* ---------- form pieces ---------- */
function showError(t) { $("formError").textContent = t }

function field(id, label, type, placeholder, hint) {
  return '<label for="' + id + '">' + label + '</label><input id="' + id + '" type="' + (type || "text") + '" placeholder="' + (placeholder || "") +
    '" value="' + esc(FORM[id] || "") + '" style="width:100%" oninput="showError(\'\')">' + (hint ? '<p class="sm" style="margin:4px 0 0">' + hint + "</p>" : "")
}
function dropdown(id, label, options, placeholder) {
  // picking a college empties the program list's choice and redraws it with that college's programs
  return '<label for="' + id + '">' + label + '</label><select id="' + id + '" style="width:100%" onchange="' +
    (id === "college" ? "FORM.college=this.value;FORM.program='';gatherForm();render()" : "") + '"><option value="">' + placeholder + "</option>" +
    options.map(function (x) { return "<option" + (FORM[id] === x ? " selected" : "") + ">" + x + "</option>" }).join("") + "</select>"
}
// "name@" becomes "name@bisu.edu.ph" while typing; leaving the box adds the domain if it's missing.
function emailTyping(el) {
  showError("");
  var v = el.value;
  if (v.indexOf("@") === v.length - 1 && v.length > 1) el.value = v + "bisu.edu.ph"
}
function emailDone(el) {
  var v = el.value.trim();
  if (v && v.indexOf("@") < 0) { el.value = v + "@bisu.edu.ph"; v = el.value }
  if (v && !/^[^\s@]+@bisu\.edu\.ph$/i.test(v)) showError(SIGNUP_ERRORS.bad_email)
}
// Typing a digit moves to the next box; the sixth one checks the code.
function codeDigit(el) {
  el.value = el.value.replace(/\D/g, "");
  var boxes = [].slice.call(D.querySelectorAll("#bx input")), i = boxes.indexOf(el);
  if (el.value && i < 5) boxes[i + 1].focus();
  if (boxes.every(function (x) { return x.value })) verifyCode()
}

// Google can only send people back to the address it was set up with, so only offer it where that works.
function googleAvailable() {
  var o = SIGNUP.options;
  if (!o || !o.google) return false;
  try { return new URL(o.redirect).origin === location.origin } catch (e) { return false }
}
function googleStart() { top.location.href = "/api/db/auth?action=google_start&for=signup" }
var GOOGLE_LOGO = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

/* ---------- the screens ---------- */
function signupView() {
  var step = signupStep(), parts = step === 1 ? verifyStep() : detailsStep();
  return '<div class="au"><div class="card">' + stepBar(step) + parts.body + '<p class="er" id="formError"></p><div style="margin-top:10px">' + parts.foot + "</div>" +
    (step === 1 ? '<p class="sm" style="text-align:center;margin-top:14px">Already have an account? <a href="#" onclick="logOut();return false" style="color:var(--ac)">Log in</a></p>' :
      '<p class="sm" style="text-align:center;margin-top:14px">Not you? <a href="#" onclick="SIGNUP.verifiedEmail=\'\';SIGNUP.codeSent=false;render();return false" style="color:var(--ac)">Start over</a></p>') +
    "</div></div>"
}

function stepBar(step) {
  return '<div style="display:flex;gap:6px;margin-bottom:16px">' + ["Verify your email", "Your details"].map(function (x, i) {
    var done = i + 1 < step, now = i + 1 === step;
    return '<div style="flex:1;text-align:center;font-size:12px;color:' + (now ? "var(--ac)" : "var(--t3)") + '"><div style="height:4px;border-radius:2px;background:' +
      (done || now ? "var(--ac)" : "var(--bd)") + ';margin-bottom:4px"></div>' + x + "</div>"
  }).join("") + "</div>"
}

// Step 1: Google, or email -> code.
function verifyStep() {
  var body = '<h2 style="margin:0">Create your account</h2><p class="sm" style="margin:2px 0 14px">First, show us it’s really your BISU email.</p>' +
    (googleAvailable() ? '<button onclick="googleStart()" style="width:100%;display:flex;align-items:center;justify-content:center;gap:10px;padding:11px;font-weight:700;background:#fff;color:#1f1f1f;border:1px solid #dadce0">' +
      GOOGLE_LOGO + "Continue with BISU Google</button>" +
      '<div style="display:flex;align-items:center;gap:10px;margin:16px 0 4px;color:var(--t3);font-size:12px"><span style="flex:1;height:1px;background:var(--bd)"></span>or use a code<span style="flex:1;height:1px;background:var(--bd)"></span></div>' : "");
  if (!SIGNUP.codeSent) return {
    body: body + '<label for="email">School email</label><input id="email" type="email" inputmode="email" autocomplete="email" placeholder="name@bisu.edu.ph" value="' +
      esc(FORM.email) + '" style="width:100%" oninput="emailTyping(this)" onblur="emailDone(this)" onkeydown="if(event.key===\'Enter\')requestCode()">',
    foot: '<button class="p" style="width:100%" onclick="requestCode()"' + (SIGNUP.busy ? " disabled" : "") + ">" + (SIGNUP.busy ? "Asking…" : "Get a code") + "</button>"
  };
  var who = (SIGNUP.teacher ? "your teacher and " : "") + "the campus admin";
  var notice = SIGNUP.emailed ?
    "<b>We emailed a code to " + esc(FORM.email) + "</b><br>Check your BISU inbox (and Spam). No email? " + who.charAt(0).toUpperCase() + who.slice(1) + " can also see the code in LearnLink. It works for 2 hours." :
    "<b>Code ready for " + esc(FORM.email) + "</b><br>" + (SIGNUP.mailWorks ? "We couldn’t email it right now (no internet). " : "") +
    "The code shows up inside LearnLink for " + who + ". Ask them for it and bring your school ID. It works for 2 hours.";
  return {
    body: body + '<div style="background:var(--acb);color:var(--ac);padding:10px 12px;border-radius:12px;margin:8px 0 12px;font-size:13px">' + notice + "</div>" +
      '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px" id="bx">' + '<input class="cb" inputmode="numeric" maxlength="1" aria-label="Code digit" oninput="codeDigit(this)">'.repeat(6) + "</div>",
    foot: '<button class="p" style="width:100%" onclick="verifyCode()">Verify</button><p class="sm" style="text-align:center;margin:10px 0 0">' +
      '<a href="#" onclick="SIGNUP.codeSent=false;SIGNUP.codeSentBefore=false;render();return false" style="color:var(--ac)">Use a different email</a> · ' +
      '<a href="#" onclick="requestCode();return false" style="color:var(--ac)">Ask again</a></p>'
  }
}

// Step 2: details, password, consent.
function detailsStep() {
  var programs = COLLEGES[FORM.college] || [];
  return {
    body: '<h2 style="margin:0">Your details</h2><p class="sm" style="margin:2px 0 6px">BISU Balilihan Campus</p>' +
      '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:2px 8px;padding:8px 12px;border-radius:12px;background:var(--acb);color:var(--ac);font-size:13px;font-weight:700"><span style="word-break:break-all">✓ ' +
      esc(SIGNUP.verifiedEmail) + '</span><span style="font-weight:400;margin-left:auto;white-space:nowrap">' + (SIGNUP.via === "google" ? "verified with Google" : "verified") + "</span></div>" +
      field("fullName", "Full name", "text", "Maria Santos") + field("studentId", "Student ID", "text", "2024-00123") +
      dropdown("college", "College", Object.keys(COLLEGES), "Select your college") +
      dropdown("program", "Program", programs, programs.length ? "Select your program" : "Select a college first") +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div>' + dropdown("year", "Year level", ["1st year", "2nd year", "3rd year", "4th year"], "Select") +
      "</div><div>" + dropdown("section", "Section", ["A", "B", "C", "D", "E", "F"], "Select") + "</div></div>" +
      field("password", "Password", "password", "", "At least 8 characters with a letter and a number. You’ll use it to log in on campus Wi‑Fi.") +
      field("password2", "Confirm password", "password") +
      '<label style="display:flex;gap:10px;align-items:flex-start;margin:16px 0 0;font-size:13px;color:var(--tx);cursor:pointer"><input id="agree" type="checkbox"' + (FORM.agree ? " checked" : "") +
      ' style="width:18px;height:18px;margin-top:1px;padding:0;flex-shrink:0" onchange="FORM.agree=this.checked;showError(\'\')"><span>I agree to the ' +
      '<a href="#" onclick="event.preventDefault();SIGNUP.termsOpen=!SIGNUP.termsOpen;$(\'terms\').style.display=SIGNUP.termsOpen?\'\':\'none\'" style="color:var(--ac);font-weight:700">Terms of Use, Data Privacy notice and course materials rules</a></span></label>' +
      '<div id="terms" style="' + (SIGNUP.termsOpen ? "" : "display:none;") + 'border:1.5px solid var(--bd);border-radius:12px;padding:4px 12px;margin-top:8px;font-size:13px">' + AGREEMENTS.map(function (a) {
        return '<p style="margin:8px 0"><b>' + a[0] + '</b><br><span style="color:var(--t2)">' + a[1] + "</span></p>"
      }).join("") + "</div>",
    foot: '<button class="p" style="width:100%" onclick="createAccount()"' + (SIGNUP.busy ? " disabled" : "") + ">" + (SIGNUP.busy ? "Creating your account…" : "Create account") + "</button>"
  }
}

/* ---------- talking to the server ---------- */
function requestCode() {
  gatherForm();
  if (FORM.email && FORM.email.indexOf("@") < 0) FORM.email += "@bisu.edu.ph";
  if (!/^[^\s@]+@bisu\.edu\.ph$/i.test(FORM.email)) return showError(SIGNUP_ERRORS.bad_email);
  SIGNUP.busy = true;
  render();
  api("auth?action=signup_start", { email: FORM.email }).then(function (j) {
    SIGNUP.busy = false;
    SIGNUP.codeSent = true;
    SIGNUP.teacher = j.teacher;
    if (j.emailed || !SIGNUP.codeSentBefore) SIGNUP.emailed = j.emailed;   // "Ask again" within a minute keeps the earlier status
    SIGNUP.mailWorks = j.mail;
    SIGNUP.codeSentBefore = true;
    render();
    var b = D.querySelector("#bx input");
    if (b) b.focus()
  }, function (x) {
    SIGNUP.busy = false;
    render();
    showError(signupError(x))
  })
}

function verifyCode() {
  var boxes = [].slice.call(D.querySelectorAll("#bx input")), code = boxes.map(function (x) { return x.value }).join("");
  if (code.length < 6) return showError("Enter all 6 digits");
  api("auth?action=signup_verify", { email: FORM.email, code: code }).then(function (j) {
    SIGNUP.verifiedEmail = j.email;
    SIGNUP.via = "code";
    if (j.name && !FORM.fullName) FORM.fullName = j.name;
    SIGNUP.codeSent = false;
    render()
  }, function (x) {
    boxes.forEach(function (b) { b.value = "" });
    boxes[0].focus();
    showError(signupError(x) + (x && x.error === "bad_code" && x.left > 0 ? " (" + x.left + " tr" + (x.left === 1 ? "y" : "ies") + " left)" : ""))
  })
}

function createAccount() {
  gatherForm();
  var F = FORM, problem = "";
  if (F.fullName.length < 3) problem = SIGNUP_ERRORS.missing_name;
  else if (F.studentId.length < 5) problem = "Enter your student ID, like 2024-00123";
  else if (!F.college || !F.program || !F.year || !F.section) problem = "Select your college, program, year, and section";
  else if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(F.password)) problem = SIGNUP_ERRORS.weak_password;
  else if ($("password2").value !== F.password) problem = "Passwords don’t match. Try again";
  else if (F.agree !== true) problem = SIGNUP_ERRORS.must_agree;
  if (problem) return showError(problem);
  SIGNUP.busy = true;
  render();
  api("auth?action=register", { name: F.fullName, password: F.password, student_id: F.studentId, college: F.college, program: F.program,
    year_level: F.year, section: F.section, agree: true }).then(function () {
    SIGNUP.busy = false;
    F.password = "";
    F.password2 = "";
    S.view = "home";
    S.screen = "app";
    render();
    loadSession();
    loadCourses();
    loadChats()
  }, function (x) {
    SIGNUP.busy = false;
    if (x && x.error === "verify_first") SIGNUP.verifiedEmail = "";
    render();
    showError(x && x.error === "email_taken" ? SIGNUP_ERRORS.email_taken : signupError(x))
  })
}
