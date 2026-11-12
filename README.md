# LearnLink

A local-first study assistant for BISU Balilihan. Students ask a question, LearnLink finds the best passages in the
faculty-approved course modules, and a language model running **on the BISU server** writes the answer with numbered
citations. There is no cloud API, no API key, and no per-use cost.

Teachers keep posting in **Google Classroom**. Whenever the server has internet, LearnLink copies new posts in as
drafts; the teacher publishes them into a module. That sync is the only part that uses the internet.

```
student browser ──► server.js ──► retrieval.js (BM25 keywords + embeddings, fused with RRF)
                        │    └──► Ollama (local model, e.g. llama3.1 8B on an RTX 4050)
                        └──► PHP api/ (Laragon) ──► MySQL
                                   └──► Google Classroom + Drive (only when online, for the sync)
```

## Run it (Windows, VS Code)

1. Install **Node.js 18+** and **Ollama**. Start Ollama (it runs in the tray, or run `ollama serve`).
2. Pull the models once:
   ```
   ollama pull llama3.1:8b-instruct-q4_K_M
   ollama pull nomic-embed-text
   ```
   (Any model from `ollama list` works. Set `MODEL=` in `.env`. Try `qwen3:4b` too, see "Choosing the model".)
3. In this folder, copy `.env.example` to `.env` (optional, the defaults match step 2).
4. `npm start`, then open **http://localhost:3000**.
5. Check it: open **http://localhost:3000/api/status**. You want `"ok": true` and `"embed": "ready"`.

No `npm install` is needed. The server has no dependencies.

**Campus mode:** other phones and laptops on the same Wi-Fi or LAN open `http://<this PC's IP>:3000`
(find it with `ipconfig`). Allow Node.js through Windows Firewall when asked. No internet is needed.
**Remote mode:** reach the same server through the internet, for example with a Cloudflare Tunnel
(needs BISU IT approval). Set up https first (see "Real accounts").

## How an answer is made

1. `retrieval.js` reads every `modules/<course>/*.md` file and splits it into passages (one paragraph, bullet lists
   stay with the paragraph above).
2. **BM25** ranks passages by keyword match. **Embeddings** (Ollama `nomic-embed-text`) rank them by meaning, so
   "how do hackers breach data" can still find the security module. The two rankings are merged with
   **Reciprocal Rank Fusion**. A passage must pass a relevance gate, set by the admin's "Match level" (1 loose to 5 strict).
3. The top 3 passages go to the model with a tutor-style prompt: answer from them, cite as `[1]`, `[2]`, talk like a
   classmate, and match the student's pace (a short casual message gets a short reply).
4. **Chat memory:** the last few messages are sent with every question, so "why is it important?" means what you were
   just discussing. For short or pointing-back questions, retrieval also searches with the previous question added.
5. The answer **streams** into the chat word by word. Greetings and thanks are answered by the model too (no search).
6. If nothing matches: with "General answers" on, the model answers from its own knowledge and the app labels it
   "General answer, not from your modules". With it off, the student is told the topic is not in the modules.

If the embedding model is missing, retrieval falls back to keywords only and the log says so.

## Adding courses (CCJ, CTAS, ...)

1. Make a folder `modules/<course-id>/` and put numbered `.md` files in it (`1-intro.md`, `2-...md`). Start each file
   with `# Module N: Title`. Separate paragraphs with a blank line.
2. Add the course to `modules/courses.json` (`name` and `college`).
3. Add the course to the course list in `public/apps/student.html` (the `CO` array), then restart.

Note: the **IT 313** files are placeholders ("Sample content... replace this file"). Replace them with the real modules.

## Files

Every file and what it does is listed in **[FILES.md](FILES.md)**. In short:

```
server.js          web server, Ollama calls, rate limit, /api/ai, /api/status, PHP proxy
retrieval.js       chunking, BM25, embeddings, rank fusion (the part to study and tune)
modules/           course materials as markdown (rebuilt from the database by PHP)
database/          schema.sql, setup.php, and password reset scripts
api/               PHP endpoints (accounts, courses, uploads, chats, feedback, stats, Classroom sync)
public/            the web pages: landing, login, and the student / faculty / admin apps
logs/, .cache/     created at runtime (not in git)
```

## Measuring for the thesis

`TEMPERATURE` in `.env` controls how loose the model talks (0.5 default). Every answer logs `retrieveMs`, `queueMs` (time waiting for the GPU) and `generateMs`. Raise `MAX_CONCURRENT` or
test with several devices at once to see how response time changes with simultaneous users.
`GET /api/status` shows the model and queue length.

## Choosing the model (6 GB VRAM)

`llama3.1:8b` at 4-bit is about 5 GB, so it fits only with a small context (`NUM_CTX=4096`). A 3-4B model is faster
and leaves room. Run the same faculty-verified questions through each candidate and compare correctness, whether it
refuses when the answer is not in the modules, and speed. While a request runs, `ollama ps` should show `100% GPU`.
If it shows a CPU/GPU split, the model is too big for the card and answers will be slow.
Do not use the "uncensored" or "abliterated" models for a school system.

## Not done yet (be honest about these in the paper)

- **Course-space Summary, Quiz and Flashcards** still show sample content. Only chat answers (Ask) use real retrieval.
- **AI settings on the admin page** (match level, general answers) only affect that admin's own browser. They are not
  saved on the server. `ALLOW_GENERAL` in `.env` is what really decides whether general answers are allowed.
- **Sections and terms**: the database has one instructor per course and no sections or terms. The admin page shows
  one "Instructor" row per course; archiving and adding sections are hidden.
- **Passwords**: accounts made by the admin get a temporary password, which students and faculty change in
  Settings (the admin uses `php database/reset_password.php`). Nothing
  forces the change on first login.
- **Sign-up codes by email** need a sending account (`SMTP_*` in `.env`) and internet at that moment. Without them,
  the teacher or admin reads the code out. The old on-screen admin login code (a demo) was removed.
- **Faculty enrollment/join requests and the Test chat** are still sample data.
- The relevance gates in `retrieval.js` (`GATES`) were not tuned on real BISU questions. Tune them with your test set.
- Scanned PDFs have no text layer, so they show as failed on upload or as "Not added" from Classroom (no OCR).
- Insights count a question for a course when the answer came from that course's modules, or when it was asked in a
  chat that belongs to that course. Off-topic questions asked in a brand-new chat are counted on the admin overview only.

## Database (Laragon: MySQL + PHP)

1. Put this folder at `C:\laragon\www\learnlink`. Start Laragon (Start All).
2. In the Laragon terminal, inside the folder: `php database/setup.php` (creates the database, tables and demo accounts, and imports `modules/`; the passwords are shown once).
3. `npm start`, then open http://localhost:3000 and log in.
4. Teachers upload (PDF, PPTX, DOCX, MD, TXT) in the faculty app. Originals go in `storage/uploads/`, text in MySQL, and `modules/` is rebuilt from the database automatically.
5. PDF text needs `pdftotext` or `composer require smalot/pdfparser`. Set `upload_max_filesize` and `post_max_size` to 25M or more in php.ini.

6. Updating from an older version: run `php database/setup.php` again. It only adds the new tables; your data stays.

## Google Classroom sync

Teachers connect their BISU Google account once, link each LearnLink course to one of their Classroom classes, and
then keep posting in Classroom. Every `SYNC_MINUTES` (default 30) while the server has internet, LearnLink reads new
posts (materials, assignments, announcements) and their attachments:

- PDF, PPTX, DOCX, TXT/MD files and Google Docs/Slides become **drafts** with the text already extracted. A long post
  description becomes a draft too. Nothing reaches students until the teacher clicks **Publish** in the Classroom tab.
- YouTube videos, links, Google Forms, Sheets, images and scanned PDFs are listed under **Not added** with the reason.
- If the internet is down, the sync is skipped and logged. Students' answers never depend on it.

### One-time setup (person running the server)

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
   they must allow this app (Admin console → Security → Access and data control → API controls → Manage app access → mark it Trusted).

Teachers who connected **before Nov 3** must click **Disconnect** and connect again once, so Google also lets
LearnLink read the class list (see "Real accounts" below).

### For each teacher

1. **On the server PC**, open http://localhost:3000, log in as faculty, open a course → **Classroom** tab →
   **Connect Google account**. (Google only allows plain-http sign-in back to `localhost`. After this one step,
   everything works from any device on the campus network. With an https domain for the server, change
   `GOOGLE_REDIRECT_URI` and the redirect URI in Google Cloud to that address instead.)
2. Pick the Classroom class and click **Link class**. The first check runs right away.
3. Review the drafts: choose the module, **Preview** the text, then **Publish** or **Skip**.

If PHP shows "SSL certificate problem" during a sync, download https://curl.se/ca/cacert.pem and set
`GOOGLE_CA_BUNDLE` in `.env` to its path (or set `curl.cainfo` in php.ini). If it says `curl_init` is undefined, turn on
`extension=curl` in php.ini (Laragon: Menu → PHP → Extensions → curl) and restart Laragon.


## Real accounts (BISU emails only)

Every account is a real `@bisu.edu.ph` email. Students sign themselves up in two steps:

1. **Verify your email**, one of two ways:
   - **Continue with BISU Google** (needs internet at that moment), or
   - **Use a code.** The student types their email and taps *Get a code*. If email is set up and there is internet,
     the code is emailed to their BISU inbox. Either way, it also appears at the top of the home page of the **admin**,
     and of the **teacher** whose linked Classroom class list has that email, so with no internet the teacher checks
     the student's school ID and reads it out. Codes last 2 hours; 5 wrong tries and it stops.
2. **Your details**: name (filled in from Google or the class list), student ID, college, program, year, section,
   password, and one consent checkbox (Terms, Data Privacy, course materials) right before *Create account*.

After that, students log in with **email and password** over the campus Wi-Fi, internet or not. *Continue with Google*
on the login page also works for any existing account (students, faculty, admin) when there is internet.
Faculty and admin accounts are still made by the admin; they can use Google to log in once the account exists.

**Class lists.** When a teacher's course is linked to Classroom, each sync also reads the class list. That course (and
its modules, in chat answers too) is then shown only to students on the list. Courses not linked to Classroom stay open
to every student. Set `SIGNUP_ROSTER_ONLY=true` to allow sign-up only for emails on some class list.

### Setting up "Continue with Google"

1. Make a **second** Google Cloud project just for sign-in (keep the Classroom one separate). On its consent screen,
   use only the basic scopes (`openid`, `email`, `profile`) and **publish it "In production"**. With only these
   scopes Google does not require app review, so there is no 100-user cap and no weekly logout. If the project can be
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
4. In `.env`: `SMTP_USER=` that email, `SMTP_PASS=` the 16 letters. Keep `SMTP_HOST=smtp.gmail.com` and `SMTP_PORT=465`.
   Restart `npm start`.
5. Test: sign up with your own BISU email. The code should arrive within a minute (check Spam the first time).
   If it doesn't, open the PHP error log (Laragon: `C:\laragon\tmp\php_errors.log`) and look for a line starting with `LearnLink mail:`.

Gmail allows about 500 emails a day from one account, which is plenty for sign-up codes.
