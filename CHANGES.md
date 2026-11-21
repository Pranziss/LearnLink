# Changes log

## Nov 21, 2026: smoother movement on phones

No database change. Press Ctrl + Shift + R once.

- **No more "page reload" look** (`student-core.js`): the page's fade-in now plays only when the screen really changes
  (another course, tab or module). Before, it also played on every new message, rating, flashcard flip and on
  opening or closing Sources, so the whole chat flashed.
- **Sources sheet and phone menu slide in when they open and slide out when they close** (`student-core.js`
  `pnClose` / `sbClose`, `student-chat.js`, `student.css`). Before, they replayed their slide-in on every redraw while
  open and vanished at once on close.
- **The chat keeps its scroll position:** it follows to the bottom only for a new message or when you're already at
  the bottom. Before, tapping [1] or closing Sources jumped back to the last message.
- **Messages slide in only when they are new** (`.msg-new1` / `.msg-new2`, set by `render()`). An older phone rule
  replayed the slide-in of the last two messages on every redraw, so closing Sources or rating an answer still
  looked like the chat reloaded. The sign-up card now pops in only when the step changes.
- People who turn animations off on their device (reduced motion) get no slides at all.


No database change. Restart `npm start`, then press Ctrl + Shift + R once. Checked at phone (390 px) and desktop
width, logged in as a test student, in dark and light.

- **No more blank screens while loading:**
  - after logging in, "Opening LearnLink…" shows (`login.html`, `login.js`, `login.css`), then a grey placeholder in
    the shape of the page (`gate.js`, so faculty and admin get it too) until the account and courses are in;
  - opening a saved chat shows "Opening your chat…" at once (`student-db.js`); a module shows grey placeholder lines.
- **Plain error messages:** students no longer see "Make sure Ollama is running", "run npm start", "VS Code Live
  Server" or error codes. Each error says what happened and what to do, with an **Ask again** / **Try again** /
  **Log in again** button (`student-ai.js`, `student-db.js`, `student-courses.js`). Setup hints stay, at the end,
  as "(Admin: …)" (`login.js`, `student-signup.js`, `gate.js`). The "Can't reach LearnLink" page follows light/dark.
- **Suggestions:**
  - home: three modules from different courses, phrased "Explain …", "Quiz me on …", "Key terms in …"; they change
    once a day, and generic titles like "Course Overview" are skipped (`student-chat.js`);
  - under the latest answer: **Give me an example**, **Explain it more simply**, **Quiz me on this**,
    **Ipaliwanag sa Filipino** (one tap asks it);
  - in a course's Ask tab: **Summarize this**, **What are the key terms?**, **Quiz me with 3 questions**.
- **First-login tour** (new `student-tour.js`): three short cards (ask anything, tap [1] to see the source, the menu),
  once per device, with Skip; Esc closes it.
- **Phones:** the Sources panel no longer opens by itself after an answer (it covered the answer); the Sources tab and
  the [1] numbers open it. Citation numbers are bigger to tap. The DEMO badge (only with `?demo`) moved to the top
  and says just "DEMO" on phones, so it no longer covers the chat box.
- **Server (`server.js`):** "Ipaliwanag sa Filipino" / "explain in Tagalog" now counts as a follow-up, so search
  stays on the same topic (it was finding the Filipino pop-culture module). A space between [1] and the period after
  it is removed.

## Nov 21, 2026: small fixes

No database change. Restart `npm start`, then press Ctrl + Shift + R once.

- **Startup order (`server.js`):** the modules are embedded first, then the model is loaded. Doing both at once could
  time out on the 6 GB GPU, and search then stayed keyword-only until the next restart.
- **Cleaner answers (`server.js`):** a filler opener ("Okay, let's break this down!", "That's a great question!",
  "Hey there!") and `**bold**` / `*italics*` marks are removed from module and general answers. While streaming, the
  first words are held back until it is clear they are not filler (about 0.1 s), so "Okay," never appears and then
  vanishes. Tested on the 84 answers from the model test: 23 cleaned, nothing else changed; math like `2 * 3` is kept.
  Small talk is left as it is ("Okay lang ako" is a real answer). `student-ai.js` drops the same marks while the
  answer streams in.
- **Login check remembered for 2 minutes** (was 30 seconds), so fewer questions wait on PHP. A deactivated account
  or a class-list change takes up to 2 minutes to apply to AI answers.
- **Old sign-up removed:** the 6-step form, its fake self-filling code check and the fake "Welcome back" login screen
  (`student-signup.js` 380 → 231 lines; 3 leftover hooks in `student-core.js`). They never ran since the 2-step
  sign-up. The sign-up and app screens draw exactly the same as before.

## Nov 21, 2026: gemma3:4b is the new model, and a tighter prompt

No database change. Run `ollama pull gemma3:4b` and `ollama pull nomic-embed-text`, set `MODEL=gemma3:4b` in `.env`,
then restart `npm start`.

- **New `tools/compare-models.js`:** asks the same 17 questions (all six courses, Filipino and Taglish, a follow-up,
  questions that are not in the modules, small talk) through the real retrieval and prompts, one model at a time,
  and writes the answers side by side to `logs/model-compare/`. See README, "Choosing the model".
- **Model: `gemma3:4b`** (was `llama3.1:8b`). Average full answer 2.0 s instead of 5.9 s, slowest 4.4 s instead of
  15.3 s. It fits fully in the 6 GB GPU (llama3.1 8B did not; part of it ran on the CPU) and made the fewest factual
  mistakes of the three models tried. `qwen3.5:4b` was in between on speed but made the most mistakes.
- **Prompt (now in `prompts.js`, see below):** start with the answer (no "Great question!" / "Okay, let's break this down"); put [1] at the
  end of the sentence it supports, never at the start; answer in Filipino or Taglish when the student writes that way
  (with a Taglish example); no markdown; never claim personal memories ("I remember watching…"); check the math in
  examples.
- **New `prompts.js`:** the prompt texts moved out of `server.js` unchanged, so they are easy to find and edit.
  `server.js` still decides which rules apply to a question.
- **Small talk:** "hi kumusta ka", "hello po, good morning!" and "thanks po" are now recognized as small talk (short
  friendly reply, no module search). Before, only a single greeting word was, so these went to a general answer.
  "hi, what is the CIA triad" is still treated as a real question.

## Nov 21, 2026: student.js split into parts

No database change. Restart `npm start`, then press Ctrl + Shift + R once.

- **`public/js/student.js` (2,192 lines) is now 9 files** in `public/js/`: `student-core.js`, `-signup`, `-chat`, `-ai`,
  `-courses`, `-db`, `-settings`, `-network` and `-start` (30 to 380 lines each). The code was moved, not rewritten.
  `student.html` loads them in that order; they share globals, so the order matters.
- **Removed 10 old copies of functions** (`after`, `dots`, `reg`, `nxt`, `setV`, `rd`, `netUpd`, `netP`, `llm`, `aiH`). The file
  had each of these twice; in one file the later copy replaces the earlier one everywhere, so the old copies never ran.
  In separate files they would have run, so they had to go.
- **Sign-up page:** the old 6-step form no longer flashes for a moment before the real 2-step form appears.

## Nov 20, 2026: speed

No database change. Restart `npm start`, then press Ctrl + Shift + R once (after that, updates show up on their own).

- **Bug fix, `.env` comments (`server.js`):** a `# comment` after a value was read as part of the value, so
  `TEMPERATURE=0.5   # ...` became "not a number" and Ollama used its own default (0.8). Comments are now ignored,
  the same way `api/_env.php` already did. The model now really runs at your `TEMPERATURE`.
- **Model loaded at start-up:** `server.js` loads the model into GPU memory as soon as it starts (it took 8.7 s on the
  RTX 4050), so the first student no longer waits for it. It stays loaded for `KEEP_ALIVE` (new, default `4h`; was 30 minutes).
- **Shorter longest answer:** `NUM_PREDICT` (new, default 300 tokens, was 400). The prompt already asks for 5 sentences at most.
- **Place in line:** when someone else is being answered, the student sees "1 question ahead of yours…" instead of a
  frozen "Writing the answer…".
- **Stop button:** while an answer is written, the send button becomes ■. Stop keeps the text written so far, and the
  server stops generating (or takes the question out of the line), so the next student is answered sooner.
- **New timing `firstTokenMs`** in `logs/queries.jsonl`: how long until the first word appears.
- **Pages load faster:** scripts, styles and pages are sent gzipped (`student.js` 101 KB → 31 KB) with an ETag, so a
  return visit gets "304 Not Modified" instead of the whole file. Images are reused for a day.

Measured on this PC, model already loaded, 4 questions sent at once: the first word after 0.3 to 1.6 s, each answer done in about 4 to 5 s.

## Nov 12, 2026: design pass

No database change. Press Ctrl + Shift + R after updating.

- **New `public/css/theme.css`:** the one place colors are defined (BISU blue + gold, light and dark), loaded after each
  page's own stylesheet by the student, faculty, admin and login pages. `student.css` had three old themes stacked on top
  of each other (green, purple, blue); the unused ones were removed.
- **New `public/css/dashboard.css`** (faculty and admin): every card has the same calm surface instead of cycling gold,
  blue and grey tints, so the numbers stand out.
- **Sidebars (all apps):** the open item gets a gold edge instead of a full gold pill; gold stays on the main action.
- **Student app:** the mascot is centered on the home screen; the home suggestions come from the student's own modules;
  module rows all look the same (no more rainbow rows); the Settings photo is smaller.
- **Login:** on wide screens, a campus photo panel sits beside the form. Phones keep the single card. The mascot is centered.
- **Faculty and admin greetings:** the ✨ emoji was removed.

### Faculty page: no more fake features
- **Test chat uses the real AI** (`public/js/faculty.js`): the teacher asks like a student and gets the answer from this
  course's published modules only, with its sources, or "Not in your modules" when nothing matches. It used to match
  keywords against sample answers. If the AI isn't running, it says so.
- **Enrollment tab and the "Join requests" card are hidden** outside `?demo`: join codes never existed on the server.
  Class lists come from Google Classroom.
- "1 sections" now says "1 section", and the Settings photo is smaller.

## Nov 12, 2026: Classroom reads Materials only, and no more fake data

No database change. Restart `npm start`, then press Ctrl + Shift + R.

### Google Classroom: Materials only
- **`api/_google.php`:** the sync reads only Classroom **Materials** (*Create → Material*). Assignments and announcements
  are no longer read, and LearnLink no longer asks Google for permission to read them. Teachers who are already
  connected don't need to reconnect.
- **Classroom tab (`public/js/faculty-classroom.js`) and README:** tell teachers to post learning files as Materials.

### Real data only (sample data only with `?demo`)
- **New `public/js/gate.js`**, loaded first by the student, faculty and admin pages. Opened directly (not through the
  login page), an app now goes to the login page instead of showing sample data that looked real. Add `?demo` to the
  address (for example `/apps/admin.html?demo`) to see the sample data on purpose, with a red **DEMO · SAMPLE DATA** label.
- **Faculty and admin:** not logged in, or the wrong role, goes to the login page. If the server can't be reached, a
  "Can't reach LearnLink" screen appears instead of sample numbers. The admin page no longer flashes sample numbers while loading.
- **Student:**
  - **Open** on a module shows the **real module text** (the text the AI answers from) and download links for the original files.
    The new `api/courses.php?action=module_text` returns it: published modules only, and only for courses the student can see.
  - Removed the made-up "PDF · 10 pages" lines. Courses without an instructor say so. Empty courses and an empty course list have proper messages.
  - The course-space **Ask** box shows an error when the AI can't answer, instead of a sample answer.
  - **Summary, Quiz and Flashcards** say "Coming soon" instead of showing sample content.
  - Module numbers match the teacher's numbering even when some modules are hidden.
- **Downloads respect class lists:** `api/materials.php` no longer lets a student download files from a course hidden by its Classroom class list.
- **Sample data uses made-up names** instead of real BISU faculty names and emails.

## Nov 12, 2026: cleanup for GitHub

- **New `FILES.md`:** every file and what it does.
- **`.gitignore`:** also keeps teacher uploads (`storage/uploads/`), `vendor/`, editor settings and Windows/macOS clutter out of git.
- **Font link fixed:** `apps/admin.html` and `apps/faculty.html` loaded `css/fonts.css`, which is no longer in the project
  (the bundled Nunito from Nov 3 is gone). They now load Nunito from Google Fonts, like the other pages.
- **README / CHANGES:** removed the leftover notes saying change password was not done yet.

## Nov 9, 2026: Faculty Settings page
- Faculty "Settings" (and "My profile" in the top-right menu) now opens a full Settings page like the student one: photo, About you (email, username, role, courses you teach, member since), Appearance (System / Light / Dark), Password, a student-privacy note and Log out.
- The profile photo is saved on that device (browser storage) and also shows in the top-right circle.
- Admin: the Settings button was removed (the admin account can be reset with `php database/reset_password.php`).
- `me` now also returns `created_at`.
- New file: public/js/faculty-settings.js.

## Nov 9, 2026: change password, and no sample data for real teachers

No database change. Replace the files, restart `npm start`, then press Ctrl + Shift + R.

- **Change password** for everyone who is logged in (current password + new password, same rule as sign-up). Each change goes to the audit log.
  - Students: **Settings → Password** (`public/js/student.js`).
  - Faculty and admin: the **Settings** button at the bottom of the menu (it used to say "Demo") opens the window (`public/js/account.js`, new,
    loaded by `apps/faculty.html` and `apps/admin.html`).
  - `api/auth.php`: new `change_password`.
- **Faculty page shows real data only** (`public/js/faculty.js`): sample data appears only when the page is opened without the server.
  A teacher with no course assigned sees "No courses yet" (ask the admin to set them as Instructor) instead of fake courses.
- **Code card wording** (`public/js/signup-codes.js`): "1 person forgot their password", since teachers can reset too.

## Nov 9, 2026: codes show up instantly

No database change. Replace the files, then restart `npm start` and reload the admin and faculty pages (Ctrl + Shift + R).

- **Sign-up and password reset codes appear at once** on the admin and faculty pages (under a second), no refresh needed.
  - `server.js`: new `/api/events` (the pages keep one live connection, Server-Sent Events) and `/api/notify` (PHP tells Node a code changed;
    only from this PC, with `RELOAD_KEY`, like `/api/reload`).
  - `api/auth.php`: `notify_codes()` after a code is created, used, cancelled by 5 wrong tries, or cleared by an admin password reset.
  - `public/js/signup-codes.js`: listens for the live message and reloads the code list. A **pop-up** with the name and code shows on any page
    (Users, Analytics, Classroom…), not only Home, and disappears once the student uses the code. The 20-second check stays as a backup.

## Nov 9, 2026: forgot password

After updating, run `php database/setup.php` once (adds the `password_resets` table).

- **"Forgot password?" on the login page** (`public/js/login.js`): email → 6-digit code → new password, then back to the login with the email filled in.
  - The code is emailed when the server has internet and `SMTP_*` is set. It also shows on the admin home page (and the teacher's, if the
    student is on their class list), next to sign-up codes, marked **Password reset**. Check the school ID, then read it out. Works with no internet.
  - Codes last 2 hours; 5 wrong tries cancel the code. The page gives the same answer whether or not the account exists.
  - The new password follows the sign-up rule (8+ characters with a letter and a number). Each reset is written to the audit log.
- **Admin: Users → Edit → Reset password** (`public/js/admin-live.js`): gives the user a new temporary password, shown once.
- **`api/auth.php`:** new `reset_start`, `reset_verify`, `reset_finish` and admin `reset_password`; `signup_codes` now also lists reset codes (`kind`).
- **`public/js/signup-codes.js`:** the home-page code card shows both kinds, with a **Sign-up** / **Password reset** label.
- **New `database/reset_password.php`:** from the server terminal, `php database/reset_password.php maria.santos` prints a new password.

## Nov 3, 2026: font works offline

- **Nunito is now bundled** in `public/fonts/` (8 small .woff2 files, SIL Open Font License) with `public/css/fonts.css`.
  The 5 pages no longer load Google Fonts, so LearnLink looks the same with no internet.
- **`server.js`:** serves `.woff2`, `.jpg` and `.webp` with the right type. Restart `npm start` after updating.

## Nov 3, 2026: real accounts

After updating, run `php database/setup.php` once (adds `classroom_roster` and `signup_requests`).
Teachers already connected to Google must disconnect and connect again once, so the class list can be read.

- **Student sign-up is now 2 steps** (was 6: Terms, Account, School, Photo, Password, Verify):
  1. verify the BISU email with Google, or with a code the teacher/admin reads out (no internet needed);
  2. details + password, with one consent checkbox before *Create account* (the three agreements open from its link).
  - Username and the photo step were dropped: students log in with their email, and add a photo in Settings.
  - After signing up, the student goes straight into the app (no fake auto-login screen).
- **`api/auth.php`:** new `options`, `google_start`, `google_callback` (at `/oauth/signin`), `signup_start`,
  `signup_verify`, `signup_state`, `signup_codes`. `register` now needs a verified email and `agree`. `me` also returns
  the courses a student may get answers from.
- **`api/_google.php`:** "Continue with Google" (`gs_*`, its own optional client), and the class list (`gc_roster`)
  read during every sync. New scopes `classroom.rosters.readonly` and `classroom.profile.emails`.
- **Class lists limit what students see:** `api/courses.php` (course list) and `server.js` + `retrieval.js`
  (chat answers) hide courses linked to a Classroom class the student is not on.
- **One login for everyone:** the Student / Faculty / Admin switch (person button) is gone. Type email and password and
  LearnLink opens the right page for that account. Typing just `maria.santos` adds `@bisu.edu.ph`.
- **New `database/reset_admin.php`:** forgot the admin password? `php database/reset_admin.php` prints a new one.
- **`public/js/login.js`:** *Continue with Google* button (shown where Google can send people back), messages after
  Google, and the fake admin login code removed.
- **New `public/js/signup-codes.js`:** "students signing up" card with codes on the faculty and admin home pages.
- **New `api/_mail.php`:** the sign-up code is also emailed when `SMTP_*` is set and there is internet
  (Gmail App Password works). The screen says whether it was emailed.
- **`.env.example`:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME`,
  `GOOGLE_SIGNIN_CLIENT_ID`, `GOOGLE_SIGNIN_CLIENT_SECRET`, `GOOGLE_SIGNIN_REDIRECT_URI`, `SIGNUP_ROSTER_ONLY`.

## Nov 2, 2026: the prototype screens are now real

After updating, run `php database/setup.php` once. It adds the new tables and keeps your data.

### Google Classroom sync (works for real)
- **New:** `api/google.php` (endpoints) and `api/_google.php` (sign-in, reading Classroom and Drive, turning attachments into drafts).
- **New tables** in `database/schema.sql`:
  - `google_accounts`: one refresh token per teacher;
  - `classroom_links`: course ↔ Classroom class;
  - `classroom_items`: drafts, published, skipped and unreadable items;
  - `classroom_sync_log`.
- **`server.js`:**
  - `/oauth/google` is passed to PHP to finish the Google sign-in;
  - every `SYNC_MINUTES` (default 30) it asks PHP to check every linked class (`google.php?action=sync_all`, protected by `RELOAD_KEY`).
- **`public/js/faculty-classroom.js`:** a live mode on top of the old sample screen. It covers connect/disconnect, link a class, check now, preview, choose the module, publish, publish all, skip, restore, and the sync history. Without a server it still shows the sample data.
- **Published items** become ordinary materials, shown with a "From Classroom" chip (`api/courses.php` returns `from_classroom`).
- **`.env.example`:** new `GOOGLE_*` and `SYNC_MINUTES` settings. Setup steps are in the README, "Google Classroom sync".
- **`public/js/login.js`:** after Google's sign-in, the result (`?gc=...`) is passed to the faculty page, which opens the Classroom tab.
- **`api/_env.php`:** PHP's time zone is set to Asia/Manila (`TIMEZONE` in `.env`).

### Faculty Insights from real data
- **New:** `api/stats.php`.
  - `action=course`: questions per day (7 and 30 days), % answered from modules, most asked terms, gaps, poor ratings and module usage.
  - `action=overview`: the same totals for the admin overview.
- **`public/js/faculty.js`:**
  - loads the statistics after the course list and uses them in the chart, Insights, home and "Needs your attention";
  - fixed "NaN% vs yesterday";
  - fixed students being counted once per course;
  - fixed "1 students".

### Admin page on the database
- **New:** `public/js/admin-live.js`, loaded after `admin.js`.
  - Users: list, add (shows a temporary password once), edit, deactivate and delete.
  - Courses: create, rename, delete, and assign the instructor.
  - Overview and analytics use real numbers; recent activity and the audit log are real.
- **`admin.js`:** the headline numbers moved into `ADM`, the chart scale fits small numbers, and divide-by-zero spots are guarded.
- **`api/courses.php`:** new `update_course` and `delete_course` (admin), and `assign` checks the faculty account.
- **New table `audit_log`:**
  - `audit()` in `api/_boot.php` records admin changes and student data exports and deletions;
  - `auth.php?action=audit` lists it.

### Download / delete my data (RA 10173)
- **`api/chats.php`:**
  - `action=export` downloads the account, all chats and the student's ratings as JSON;
  - `action=delete_all` deletes all of the student's chats.
- **`public/js/student.js`:** the Settings buttons now call these.

### Screens and wording
- General answers stay on (`ALLOW_GENERAL=true`), so the student home and landing page now say modules come first and general answers are labeled.
- **Landing page:** Classroom sync, teacher feedback, data controls and admin tools moved out of "Coming next". Still planned: review tools, change password, sections and terms, shared AI settings.

## Oct 28, 2026: proposal screens
- Campus photo as the landing hero background (`public/img/bisu-balilihan.*`, `public/css/landing.css`).
- Classroom tab preview, "Coming next" section, Appearance setting (System/Light/Dark) in student Settings, and the full email shown in Settings.

## Still to do
- Summaries, quizzes and flashcards (sample content).
- Sections and terms.
- AI settings saved on the server.
- Fonts: Google Fonts loads from the internet. Bundle Nunito locally for true offline use.
- Speed meter: the student page tests cdnjs/jsdelivr. Point it at the campus server instead.
