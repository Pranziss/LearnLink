# LearnLink progress

What is done, what is next, and what is still open. Updated at the end of each work session.
For the details of each change (files, setup steps), see `CHANGES.md`. For every file, see `FILES.md`.

Last updated: **Nov 21, 2026**

## Goal right now: a demo that works (mentor feedback, Nov 20)

The system must be **shown working** at the defense, with friendlier screens and faster answers.
Stay on the current stack (HTML/CSS/JS + Node `server.js` + PHP/MySQL on Laragon + Ollama). No rewrite before the defense.
Pitch: teacher-controlled answers with sources, hosted on campus, no cost. Say "local-first", not "fully offline"
(the Classroom sync needs internet).

## Next, in order

1. [ ] **Real Summary, Quiz and Flashcards** in the course space, made by the AI from the selected modules
   (they say "Coming soon" now). New file `public/js/student-quiz.js`. If time runs out: hide the three buttons.
   *Depends on the demo date: still unknown.*
2. [ ] **Clickable citations:** clicking [1] opens the module and highlights the passage the answer came from.
3. [ ] **Demo content and prep:**
   - [ ] real modules for 2 or 3 demo courses (IT 313 is placeholder text)
   - [ ] a pre-flight check (Ollama, MySQL, server, model loaded) before presenting
   - [ ] a written demo script: what to click, what to say
4. [ ] **Screens:** phone-width pass, loading placeholders instead of blank screens, suggested questions,
   a short tour on first login, plain error messages.

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

### Nov 21, 2026
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

As of Nov 21 (afternoon): the small fixes in `server.js`, `student-ai.js`, `student-core.js`, `student-signup.js`,
`CHANGES.md` and this file. (`.env` is never committed.)
