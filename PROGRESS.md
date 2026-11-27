# LearnLink progress

What is done, what is next, and what is still open. Updated at the end of each work session.
For the details of each change (files, setup steps), see `CHANGES.md`. For every file, see `FILES.md`.

Last updated: **Nov 27, 2026**

## Goal right now: a demo that works (mentor feedback, Nov 20)

The system must be **shown working** at the defense, with friendlier screens and faster answers.
Stay on the current stack (HTML/CSS/JS + Node `server.js` + PHP/MySQL on Laragon + Ollama). No rewrite before the defense.
Pitch: teacher-controlled answers with sources, hosted on campus, no cost. Say "local-first", not "fully offline"
(the Classroom sync needs internet).

## Next, in order

1. [x] **Real Summary, Quiz and Flashcards, done Nov 27:** made by the AI from each module, kept, and made ahead
   of time in the background. Still open: a teacher check of the quiz questions (see "Known limits" below).
2. [x] **Clickable citations, done Nov 27:** clicking [1] opens the module and highlights the passage the answer came from.
3. [ ] **Demo content and prep:**
   - [ ] real modules for 2 or 3 demo courses (IT 313 is placeholder text)
   - [ ] a pre-flight check (Ollama, MySQL, server, model loaded) before presenting
   - [ ] a written demo script: what to click, what to say
4. [x] **Screens (student app), done Nov 21:** loading placeholders, plain errors, suggestions, first-login tour,
   phone fixes. Still open: the same pass for the faculty and admin pages (they only got the loading placeholder).

### Known limits of the study tools

- **The right quiz answer is often the longest option** (about half the time; a fair 4-option quiz would be 25%).
  The prompt asks for options of the same length, but the 4B model only partly follows it.
- **Some questions are a little off.** Example seen in testing: "What is the purpose of hashing?" with the right
  answer "protect data from unauthorized disclosure and modification" (the module only says integrity). A teacher
  should look through the quizzes before students rely on them. Idea for later: let faculty see and remove
  questions.
- Long modules: only about 9,000 characters (spread over the whole module) are given to the model, so very long
  uploads are summarized from a sample of their paragraphs.

### Small fixes waiting

- [ ] **Delete unused Ollama models** if the space is needed (about 30 GB: the uncensored/abliterated ones, `nova`,
  `qwen2.5-coder`, `phi`, old `qwen`, `llama3.2`). Keep `gemma3:4b` and `nomic-embed-text` (and `llama3.1:8b` /
  `qwen3.5:4b` only for re-testing). Never use uncensored models here. Command: `ollama rm <name>`.

### Optional, if there is time

- [ ] Faculty view of **unanswered questions** (what students asked that the modules don't cover).
- [ ] **Usability test (SUS)** with a few students, and an **accuracy check** of about 30 questions checked by a
  teacher. Both give numbers for the paper. `tools/compare-models.js` already does the asking part.
- [ ] Tune the relevance gates in `retrieval.js` on real BISU questions.

### Later (after the defense)

- [ ] **Sections:** a subject split into sections A/B/C, each with its own teacher (the database has one instructor
  per course now).
- [ ] Terms / semesters, and archiving old courses.
- [ ] AI settings saved on the server (the admin page settings only affect that browser).
- [ ] Force a password change on first login for admin-made accounts.
- [ ] Faculty enrollment / join codes (class lists come from Google Classroom for now).
- [ ] OCR for scanned PDFs (they have no text, so they can't be used).
- [ ] Speed meter on the student page tests public CDNs; point it at the campus server.

## Done

### Nov 27, 2026
- **Real Summary, Quiz and Flashcards** (`study.js`, `/api/study`, `student-study.js`): made by `gemma3:4b` from
  each module's own text, in a fixed JSON shape, checked and cleaned, kept in `.cache/study.json` and made in the
  background while the GPU is idle. All 24 modules: 72 of 72 made, about 6 s each (slowest 8.7 s), none cut off.
  Two model quirks fixed on the way: gemma repeated a closing quote until it ran out of tokens (double quotes are
  now not allowed inside the JSON strings), and it put "A. / B." letters in front of quiz options.
- **Clickable citations:** tapping [1] opens the Sources panel on that source (as before); its "Open module" opens that exact module (the server now sends `courseId` and the
  module number with each source), highlights the paragraph(s) the answer used and scrolls to it.
  Older saved chats find the module by title; if it can't be found, no Open module button.
  Checked offline: all 52 module chunks match a paragraph in the viewer.
- **Module viewer:** keeps its scroll position across redraws; a "## heading" with text right under it no longer
  shows the whole block as a heading.
- **Module viewer slides in and out** (from the right on desktop, from the bottom on phones) instead of popping in
  with the whole page replaying its entrance.
- **Student app code cleaned up** (2,039 → 1,844 lines, same behaviour): readable names everywhere (`S.sourcesOpen`
  instead of `S.pn`, courses as objects instead of arrays), every file starts with what it does, `student-core.js`
  explains how the parts fit and every state field. The three layers of `ask()` patching each other are now one
  `ask()` that calls `askLive()` or `askDemo()`. All sample data and canned answers moved to the new
  `student-demo.js`. Each course-space tab has its own function, ready for the real Summary / Quiz / Flashcards.
  Removed code that never ran: the network popup with speed charts and its "Presentation demo" simulator (no button
  opened it), the profile menu, web-search sample answers, an older non-streaming answer path.
  Checked with a scripted click-through (91 steps: chat, sources, viewer, saved chats, ratings, errors, course space,
  settings, demo mode, sign-up) before and after: same screens.

### Nov 21, 2026
- **Smoother on phones:** no more page "reload" flash, Sources and the menu slide in and out, and the chat keeps
  its scroll position (found while testing on a real phone over Wi-Fi).
- **Screens pass (student app):** no blank screens while loading, plain error messages with a retry button,
  better home suggestions plus follow-ups under each answer, a first-login tour, Sources panel no longer covers
  answers on phones. Checked at phone and desktop width, logged in, dark and light.
- **Small fixes:** modules are embedded before the model loads (no more keyword-only search after a bad start);
  filler openers and `*markdown*` removed from answers (also while streaming); login check remembered 2 min (was 30 s);
  the old 6-step sign-up and fake login screen removed (`student-signup.js` 380 → 231 lines).
- **Model is now `gemma3:4b`** (was `llama3.1:8b`). Tested 3 models on 17 questions across all courses, including
  Filipino/Taglish, follow-ups and questions that are not in the modules:

  | Model | Avg full answer | Slowest | Fits the 6 GB GPU | Factual mistakes |
  |---|---|---|---|---|
  | `gemma3:4b` | 2.0 s | 3.9 s | yes (2.9 GB) | fewest |
  | `qwen3.5:4b` | 3.2 s | 13.8 s | yes (3.1 GB) | most |
  | `llama3.1:8b` | 5.9 s | 15.3 s | no, part ran on the CPU | some |

- **New `tools/compare-models.js`:** reruns that test on any models. Reports go to `logs/model-compare/`.
- **Tighter prompt for gemma:** no "Great question!" openers, [1] after the fact, Filipino/Taglish answers, no
  markdown, no made-up personal stories, check the math. Result: 17 / 17 automatic checks.
- **New `prompts.js`:** the prompt texts moved out of `server.js`.
- **Small talk:** "hi kumusta ka", "hello po", "thanks po" now get a short reply instead of a general answer.
- **`student.js` (2,192 lines) split into 9 files** (`student-core.js` … `student-start.js`); 10 old duplicate
  functions that never ran were removed. Pushed to GitHub.
- Ollama updated (0.9.2 → 0.40.16); `gemma3:4b`, `qwen3.5:4b` and `nomic-embed-text` pulled.

### Nov 20, 2026: speed
- Model loaded at start-up and kept in memory for 4 h (`KEEP_ALIVE`); shorter longest answer (`NUM_PREDICT` 300).
- `.env` comments were being read as part of the value (so `TEMPERATURE` was ignored): fixed.
- Students see their place in line ("1 question ahead of yours…") and a **Stop** button.
- Pages, scripts and styles sent gzipped with caching (`student.js` 101 KB → 31 KB).
- New timing `firstTokenMs` in `logs/queries.jsonl`.

### Nov 12, 2026
- **Design pass:** BISU blue + gold theme (`theme.css`, light and dark), calmer faculty/admin dashboards, login photo panel.
- **Classroom sync reads Materials only** (not assignments or announcements).
- **No fake data:** apps opened directly go to the login page; sample data only with `?demo`, with a DEMO label.
- Faculty **Test chat uses the real AI**; enrollment/join screens hidden (they never existed on the server).
- Cleanup for GitHub: `FILES.md`, `.gitignore`, first commits.

### Nov 9, 2026
- Forgot password (code by email or read out by the teacher/admin), change password in Settings, admin password reset.
- Sign-up and reset codes appear instantly on the admin and faculty pages.
- Faculty Settings page; faculty page shows real data only.

### Nov 3, 2026
- **Real accounts:** 2-step student sign-up (Google or a code, then details), one login for everyone,
  class lists from Classroom decide which courses a student gets answers from, sign-up codes by email.

### Nov 2, 2026
- **Google Classroom sync** works for real (connect, link a class, drafts, publish, sync every 30 min).
- **Faculty Insights** from real data, **admin page** on the database (users, courses, audit log).
- **Download / delete my data** (RA 10173).

### Oct 28, 2026
- Proposal screens: landing page, Classroom tab preview, Appearance setting.

## Open questions

- **Demo / defense date?** Decides whether Summary/Quiz/Flashcards get built or hidden.
- Which 2 or 3 courses will be shown in the demo, and who provides their real modules?

## Not committed yet

As of Nov 21 (evening): the small fixes and the screens pass (`server.js`, `login.html`, `css/`, `js/`), the docs.
(`.env` is never committed.)
