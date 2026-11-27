# LearnLink

**A study buddy for BISU Balilihan students that answers from their own teachers' modules.**

Ask LearnLink a question about your course and it finds the right part of your teacher's module, then explains it in
plain words, in English, Filipino or Taglish, with numbered sources like [1] you can tap to read the original passage.
It can also turn any module into a summary, a quiz or flashcards.

Everything runs **on the campus server**: the AI is a local model (no ChatGPT, no cloud API, no API key, no cost per
question). Students only need the campus Wi-Fi.

## What it does

**For students**
- Ask anything about your lessons and get an answer from your modules, with sources you can open.
- Questions outside the modules still get an answer, clearly labeled "General answer, not from your modules".
- Pick modules in a course and make a **Summary**, a **Quiz** or **Flashcards** from them.
- Your chats are saved and private; download or delete everything any time (Data Privacy Act, RA 10173).

**For teachers**
- Keep posting in **Google Classroom** as usual. LearnLink copies new Materials in as drafts; you check and publish.
- Or upload PDF, PPTX, DOCX, MD or TXT files straight into LearnLink.
- See anonymous insights: what students ask, and which answers they found unhelpful.

**For the school**
- Runs on one PC with a gaming-class GPU (tested on an RTX 4050 laptop with 6 GB).
- Works without internet on the campus network. Only the Classroom sync and "Continue with Google" need internet,
  so we call it **local-first** (not "fully offline").

## How it works

```
student's phone or laptop (campus Wi-Fi)
        │
        ▼
   server.js ──► retrieval.js   finds the best passages (keywords + meaning)
        │   ├──► Ollama           the local AI writes the answer (gemma3 4B)
        │   └──► study.js         makes summaries, quizzes and flashcards
        │
        └──► PHP api/ (Laragon) ──► MySQL   accounts, courses, uploads, chats
                   └──► Google Classroom + Drive   (only when online, for the sync)
```

## Quick start (Windows)

You need **Laragon** (Apache, PHP, MySQL), **Node.js 18 or newer** and **Ollama**.

1. **Put the project** at `C:\laragon\www\learnlink` and start Laragon (**Start All**).
2. **Get the AI models** (once). Start Ollama (it sits in the tray, or run `ollama serve`), then:
   ```
   ollama pull gemma3:4b
   ollama pull nomic-embed-text
   ```
3. **Set up the database** (once). In the Laragon terminal, inside the project folder:
   ```
   php database/setup.php
   ```
   It creates the database and tables, a `.env` settings file, demo accounts (their passwords are shown **once**, so
   save them), and imports the sample modules. Run it again after updating LearnLink: it only adds what's new, your
   data stays.
4. **Start LearnLink:**
   ```
   npm start
   ```
   Then open **http://localhost:3000** and log in. No `npm install` needed: the server has no dependencies.
5. **Check that everything works:**
   ```
   node tools/preflight.js
   ```
   It checks Ollama, the model, the server, the database and search, and tells you how to fix anything that's off.

**Open it on phones:** other devices on the same Wi-Fi open `http://<this PC's IP>:3000` (the pre-flight check prints
the address, or find it with `ipconfig`). Allow Node.js through Windows Firewall when asked.
Reaching it from outside campus (for example with a Cloudflare Tunnel) needs BISU IT approval and https first; see
"Setting up Continue with Google".

**Uploads:** PDF text needs `pdftotext`. Git for Windows already includes it, and LearnLink finds it there by itself;
otherwise install Poppler and set `PDFTOTEXT=` in `.env` to its `pdftotext.exe`. Word and PowerPoint files need
`extension=zip` turned on in php.ini (Laragon: Menu → PHP → Extensions → zip). In php.ini, also set `upload_max_filesize`
and `post_max_size` to 25M or more.

Settings live in `.env` (copied from `.env.example`). The AI model is `MODEL=` there. After changing `.env` or any
server file, restart `npm start`. After changing the web pages, press Ctrl + Shift + R in the browser.

## Before a demo or presentation

Run `node tools/preflight.js` about 10 minutes before. Besides checking everything, it loads the model into the GPU so
the first question is fast, warns about placeholder modules, and prints the address for phones. Keep the laptop
plugged in and don't close the window running `npm start`.

## How an answer is made

1. `retrieval.js` reads every `modules/<course>/*.md` file and splits it into passages (one paragraph each; a bullet
   list stays with the paragraph above it).
2. Two searches run at once. **BM25** matches keywords. **Embeddings** (Ollama `nomic-embed-text`) match meaning, so
   "how do hackers breach data" still finds the security module. The two rankings are merged with **Reciprocal Rank
   Fusion**, and a passage must pass a relevance gate (the admin's "Match level", 1 loose to 5 strict).
3. The top 3 passages go to the model with a tutor-style prompt (`prompts.js`): answer from them, cite as [1], [2],
   talk like a helpful classmate, keep it short when the question is casual.
4. **Chat memory:** the last few messages go along with every question, so "why is it important?" means what you were
   just talking about. Short or pointing-back questions are also searched together with the previous question.
5. The answer **streams** in word by word. A **Stop** button ends it early. Greetings and thanks get a short reply
   without a search.
6. **Nothing matches?** With "General answers" on, the model answers from its own knowledge and the app labels it
   "General answer, not from your modules". With it off, the student is told the topic isn't in the modules.
7. Tapping [1] opens the Sources panel; **Open module** shows the whole module with the passage highlighted.

If the embedding model is missing, search falls back to keywords only, and the server log says so.

## Summary, Quiz and Flashcards

In a course, students select modules (or none for all of them) and tap **Summary**, **Quiz** or **Flashcards**.

- `study.js` asks the model to make them from **one module's own text** at a time, in a fixed JSON format. Broken
  questions are dropped, quiz options are shuffled, and every quiz answer comes with one sentence explaining why.
- They're **made ahead of time**: after the server starts, it makes them for every module in the background, only
  while nobody is asking a question (about 5 seconds each). They're kept in `.cache/study.json`, so they open
  instantly. When a teacher changes a module, its set is made again automatically.
- A module nobody has opened yet takes a few seconds; the screen shows "Making your quiz…" meanwhile.
- Each one says it was made by the AI from the teacher's modules, and that **the module is right** if they disagree.
- Turn the background making off with `STUDY_PREPARE=false` in `.env`.

## Adding courses

The easy way: the admin creates the course on the admin page, and the teacher uploads modules or links a Classroom
class. Students see it automatically.

By hand (for example for new colleges like CCJ or CTAS):
1. Make a folder `modules/<course-id>/` with numbered `.md` files (`1-intro.md`, `2-...md`). Start each file with
   `# Module N: Title` and separate paragraphs with a blank line.
2. Add the course to `modules/courses.json` (`name` and `college`).
3. Run `php database/setup.php` on a fresh database to import it.

Note: the **IT 313** modules are placeholders ("Sample content... replace this file"). Replace them with the real ones.

## Google Classroom sync

Teachers connect their BISU Google account once, link each LearnLink course to one of their Classroom classes, and
then keep posting in Classroom. Every `SYNC_MINUTES` (30 by default) while the server has internet, LearnLink reads new
**Materials** (in Classroom: *Create → Material*) and their attachments. **Assignments and announcements are never
read**, so only what teachers deliberately share as learning material reaches the AI.

- PDF, PPTX, DOCX, TXT/MD files and Google Docs/Slides become **drafts** with the text already pulled out. A long
  Material description becomes a draft too. Nothing reaches students until the teacher clicks **Publish**.
- YouTube videos, links, Google Forms, Sheets, images and scanned PDFs are listed under **Not added**, with the reason.
- No internet? The sync is skipped and logged. Students' answers never depend on it.

### One-time setup (whoever runs the server)

1. Go to https://console.cloud.google.com and create a project. If BISU IT can create it inside the bisu.edu.ph
   organization, do that: the app can then be "Internal", which skips Google's app verification.
2. **APIs & Services → Library**: enable **Google Classroom API** and **Google Drive API**.
3. **OAuth consent screen** (Google Auth Platform): choose **Internal** if the project belongs to bisu.edu.ph;
   otherwise **External**, leave it in **Testing**, and add each teacher's email as a test user (up to 100).
   In Testing, Google ends the sign-in after 7 days, so teachers reconnect weekly (the Classroom tab says when).
4. **Clients → Create client → Web application.** Under *Authorized redirect URIs* add exactly
   `http://localhost:3000/oauth/google`.
5. Put the client ID and secret in `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`), run
   `php database/setup.php` once, and restart `npm start`.
6. Reading Drive files uses a "restricted" Google permission. If BISU's Google Workspace admin blocks unknown apps,
   they must allow this one (Admin console → Security → Access and data control → API controls → Manage app access
   → mark it Trusted).

Teachers who connected **before Nov 3** must click **Disconnect** and connect again once, so Google also lets
LearnLink read the class list.

### For each teacher

1. **On the server PC**, open http://localhost:3000, log in as faculty, open a course → **Classroom** tab →
   **Connect Google account**. (Google only allows plain-http sign-in back to `localhost`. After this one step,
   everything works from any device on the campus network. With an https address for the server, change
   `GOOGLE_REDIRECT_URI` and the redirect URI in Google Cloud to that address instead.)
2. Pick the Classroom class and click **Link class**. The first check runs right away.
3. Review the drafts: choose the module, **Preview** the text, then **Publish** or **Skip**.

## Accounts (BISU emails only)

Every account is a real `@bisu.edu.ph` email. Faculty and admin accounts are made by the admin. Students sign
themselves up in two steps:

1. **Verify your email**, one of two ways:
   - **Continue with BISU Google** (needs internet at that moment), or
   - **Use a code.** The student types their email and taps *Get a code*. If email sending is set up and there's
     internet, the code goes to their BISU inbox. Either way it also shows on the home page of the **admin**, and of
     the **teacher** whose Classroom class list has that email, so without internet the teacher checks the student's
     school ID and reads the code out. Codes last 2 hours; after 5 wrong tries they stop working.
2. **Your details**: name (filled in from Google or the class list), student ID, college, program, year, section,
   password, and one consent checkbox (Terms, Data Privacy, course materials) right before *Create account*.

After that, students log in with **email and password** over the campus Wi-Fi, internet or not. *Continue with
Google* on the login page also works for any existing account when there's internet.

**Class lists.** When a course is linked to Classroom, each sync also reads the class list. That course (and its
modules, in chat answers too) is then shown only to students on the list. Courses not linked to Classroom stay open to
every student. Set `SIGNUP_ROSTER_ONLY=true` to allow sign-up only for emails on some class list.

**Forgot a password?** Students and faculty use "Forgot password?" on the login page or change it in Settings. The
admin can reset any account: `php database/reset_password.php <email>`, or `php database/reset_admin.php` for the
admin itself.

### Setting up "Continue with Google"

1. Make a **second** Google Cloud project just for sign-in (keep the Classroom one separate). On its consent screen,
   use only the basic scopes (`openid`, `email`, `profile`) and **publish it "In production"**. With only these
   scopes Google doesn't require app review, so there's no 100-user cap and no weekly logout. If the project can be
   made inside the bisu.edu.ph organization, choose **Internal** instead.
2. Create a **Web application** client. Its redirect URI must be the address students use, over **https**, ending
   in `/oauth/signin`, for example `https://learnlink.bisu.edu.ph/oauth/signin`. Google refuses plain `http` except
   for `localhost`, and refuses bare IP addresses. BISU IT has to point that name at the campus server (it can stay
   reachable from campus only) and give it an https certificate.
3. Put the values in `.env`: `GOOGLE_SIGNIN_CLIENT_ID`, `GOOGLE_SIGNIN_CLIENT_SECRET`, `GOOGLE_SIGNIN_REDIRECT_URI`.

Until that https address exists, the Google button only appears on the server PC itself (`http://localhost:3000`).
Everyone else sees the code option, which works with no internet at all.

### Sending sign-up codes by email

1. Make a Gmail account for LearnLink (for example `learnlink.balilihan@gmail.com`), or use a BISU account if BISU
   allows App Passwords.
2. Turn on **2-Step Verification** for it (myaccount.google.com → Security).
3. Open https://myaccount.google.com/apppasswords, create an App Password named "LearnLink", and copy the 16 letters.
4. In `.env`: `SMTP_USER=` that email, `SMTP_PASS=` the 16 letters. Keep `SMTP_HOST=smtp.gmail.com` and
   `SMTP_PORT=465`. Restart `npm start`.
5. Test: sign up with your own BISU email. The code should arrive within a minute (check Spam the first time).
   If it doesn't, open the PHP error log (Laragon: `C:\laragon\tmp\php_errors.log`) and look for a line starting
   with `LearnLink mail:`.

Gmail allows about 500 emails a day from one account, which is plenty for sign-up codes.

## Tools

| Command | What it's for |
| --- | --- |
| `node tools/preflight.js` | Is everything ready? Checks and warms up the AI, the server, the database and search. |
| `node tools/ui-check.mjs` | Clicks through the student app by itself at phone and desktop size, light and dark, takes screenshots (`logs/ui-check/`) and lists errors and what changed since the last run. Add `--quick` for desktop only. Needs Chrome or Edge and `npm start` running; no login needed. |
| `node tools/compare-models.js <models>` | Compares AI models on the real search and prompts (see below). |

## Choosing the model (6 GB GPU)

The default is `gemma3:4b` (2.9 GB, fits fully on the GPU). Compared on Nov 21, 2026 with 17 questions across the
courses (RTX 4050 laptop), average time for a full answer: `gemma3:4b` 2.0 s, `qwen3.5:4b` 3.2 s, `llama3.1:8b` 5.9 s
(too big for 6 GB, so part of it ran on the CPU). gemma also made the fewest factual mistakes; qwen3.5 the most.

To compare models yourself (Ollama running, nothing else on port 3199):

    node tools/compare-models.js gemma3:4b qwen3.5:4b llama3.1:8b-instruct-q4_K_M

It runs a private copy of the server for each model (real search and prompts; the real logs, database and Classroom
sync aren't touched) and writes the answers side by side to `logs/model-compare/`. Read them: the automatic checks
only catch missing citations and wrong answer types. While it runs, `ollama ps` should show `100% GPU`; a CPU/GPU split
means the model is too big for the card and answers will be slow.

Don't use "uncensored" or "abliterated" models for a school system.

## Measuring for the thesis

Every answer is logged in `logs/queries.jsonl` with its timings: `retrieveMs` (search), `queueMs` (waiting for the
GPU), `firstTokenMs` (until the first word shows) and `generateMs`. `TEMPERATURE` in `.env` sets how loosely the model
talks (0.5 by default). Raise `MAX_CONCURRENT` or test with several devices at once to see how response time changes
with simultaneous users. `http://localhost:3000/api/status` shows the model and the queue length.

## Not done yet (be honest about these in the paper)

- **Quiz quality depends on the 4B model.** The right answer is often the longest option, and some questions come out
  slightly off. A teacher should look through the quizzes; teachers can't edit them inside LearnLink yet.
- **Sample data** (the original design screens) only shows when an app page is opened with `?demo`, for example
  `http://localhost:3000/apps/admin.html?demo`. It carries a red "DEMO · SAMPLE DATA" label.
- **AI settings on the admin page** (match level, general answers) only affect that admin's own browser; they aren't
  saved on the server. `ALLOW_GENERAL` in `.env` is what really decides whether general answers are allowed.
- **Sections and terms**: the database has one instructor per course and no sections or terms. The admin page shows
  one "Instructor" row per course; archiving and adding sections are hidden.
- **Passwords**: accounts made by the admin get a temporary password, which the person changes in Settings. Nothing
  forces the change on first login.
- **Sign-up codes by email** need a sending account (`SMTP_*` in `.env`) and internet at that moment. Without them,
  the teacher or admin reads the code out.
- **Faculty enrollment / join codes** aren't built; the Enrollment tab only appears in `?demo`. Class lists come from
  Google Classroom. (The faculty **Test chat** uses the real AI.)
- The relevance gates in `retrieval.js` (`GATES`) weren't tuned on real BISU questions yet.
- **Scanned PDFs** have no text, so they fail on upload or show as "Not added" from Classroom (no OCR).
- Very long modules: Summary / Quiz / Flashcards are made from about 9,000 characters spread over the module.
- Insights count a question for a course when the answer came from that course's modules, or when it was asked in a
  chat that belongs to that course. Off-topic questions in a brand-new chat count on the admin overview only.

## Something's not working?

| What you see | What to do |
| --- | --- |
| "The AI is busy or offline" | Start Ollama, then run `node tools/preflight.js`. |
| Answers are slow | `ollama ps` should say `100% GPU`. Close other programs using the GPU (games, other AI apps), restart Ollama. |
| "Can't reach LearnLink" | Is `npm start` running? Is the phone on the same Wi-Fi? Is Node.js allowed through Windows Firewall? |
| A change doesn't show up | Restart `npm start` (server files) or press Ctrl + Shift + R (web pages). |
| Can't log in / database errors | Start Laragon (Start All). After updating LearnLink, run `php database/setup.php` again. |
| Classroom sync: "SSL certificate problem" | Download https://curl.se/ca/cacert.pem and set `GOOGLE_CA_BUNDLE` in `.env` to its path (or `curl.cainfo` in php.ini). |
| Classroom sync: `curl_init` is undefined | Turn on `extension=curl` in php.ini (Laragon: Menu → PHP → Extensions → curl) and restart Laragon. |

## More docs

| File | What's in it |
| --- | --- |
| [FILES.md](FILES.md) | Every file in the project and what it does. |
| [PROGRESS.md](PROGRESS.md) | What's done, what's next, and known limits. |
| [CHANGES.md](CHANGES.md) | What changed in each update, and what to run afterwards. |
| `GIT-GUIDE.docx` | How to save, share and undo work with Git (also after pushing). |
