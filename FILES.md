# LearnLink file guide

Every file in the project and what it does. For setup and how things work, see [README.md](README.md).
For the history of changes, see [CHANGES.md](CHANGES.md).

LearnLink has two halves:

- **Node (`server.js`, port 3000)** serves the web pages, finds passages in the course modules, and asks the local
  language model (Ollama) to write the answer.
- **PHP (`api/`, served by Laragon Apache)** handles accounts, courses, uploads, chat history, statistics and the
  Google Classroom sync, all stored in MySQL. Node passes `/api/*.php` requests through to it.

## Root

| File | Purpose |
| --- | --- |
| `PROGRESS.md` | What is done, what is next, and open questions. Updated at the end of each work session. |
| `server.js` | Main Node web server (no dependencies, Node 18+). Serves `public/`, runs `/api/ai` (retrieve passages, then stream the model's answer), `/api/status`, `/api/reload`, `/api/events` (live updates by Server-Sent Events) and `/api/notify`. Applies the rate limit and the one-at-a-time GPU queue, proxies the PHP API, forwards Google sign-in callbacks (`/oauth/*`) and starts the Classroom sync every `SYNC_MINUTES`. Writes `logs/queries.jsonl`. |
| `retrieval.js` | Search engine for the course modules. Splits `modules/**/*.md` into passages, ranks them with BM25 (keywords) and Ollama embeddings (meaning), merges the two with Reciprocal Rank Fusion, and applies the relevance gates. Caches embeddings in `.cache/`. |
| `prompts.js` | The prompt texts the model gets: the shared persona, and the rules for answering from the modules (with examples), general answers and small talk. Edit here to change how LearnLink talks; `server.js` decides which rules apply. |
| `tools/compare-models.js` | Compares language models on the real retrieval and prompts (17 questions, private server copy on port 3199). Writes `logs/model-compare/`. See README, "Choosing the model". |
| `package.json` | Project name and the `npm start` / `npm run dev` scripts. No packages to install. |
| `.env.example` | Template for the settings file: model names, Ollama address, port, tuning, MySQL, Google OAuth clients, SMTP. Copy it to `.env`. |
| `.env` | Your real settings and secrets (database password, Google secrets, SMTP password, `RELOAD_KEY`). **Not in git.** |
| `.gitignore` | Keeps secrets, runtime logs, caches and uploaded files out of git. |
| `.htaccess` | Tells Apache to block the whole folder from the browser, so `.env`, `database/`, `modules/` and `storage/` stay private. Only `api/` is opened (by its own `.htaccess`). |
| `README.md` | Setup, how answers are made, adding courses, Google Classroom setup, accounts, known limits. |
| `CHANGES.md` | Dated log of what changed in each update and what to run afterwards. |
| `FILES.md` | This file. |
| `.vscode/launch.json` | VS Code "Run LearnLink" debug configuration (starts `server.js`). |

## `api/`: PHP backend

Files starting with `_` are helpers loaded by the others. `api/.htaccess` blocks them from being opened directly.

| File | Purpose |
| --- | --- |
| `.htaccess` | Allows the API endpoints, denies the `_` helper files. |
| `_env.php` | Reads `.env`, sets the time zone, opens the MySQL (PDO) connection. Also used by the `database/` scripts. |
| `_boot.php` | Loaded by every endpoint: JSON output helpers, session, login checks (`need()`), `audit()` for the audit log. |
| `_export.php` | Rebuilds `modules/` from the database (published modules only) and tells Node to reload the knowledge base. |
| `_extract.php` | Pulls plain text out of uploaded PDF, DOCX, PPTX, MD and TXT files. |
| `_google.php` | Google OAuth sign-in, reading Classroom posts, class lists and Drive files, turning attachments into drafts. Also "Continue with Google" for login. |
| `_mail.php` | Minimal SMTP client for emailing sign-up and password-reset codes (works with a Gmail App Password). |
| `auth.php` | Accounts: login (password or Google), two-step student sign-up with codes, forgot / change / admin-reset password, logout, `me`. Admin: list, create, edit, disable users; audit log. |
| `courses.php` | Courses and their modules: list (filtered by role and class list), create, rename, delete, assign instructor, publish modules. |
| `materials.php` | Teacher file uploads: saves the original in `storage/uploads/`, stores the extracted text, rebuilds `modules/`. |
| `chats.php` | Students' chat history: list, save a question and answer, delete, export all my data / delete all (RA 10173). |
| `feedback.php` | Helpful / not helpful ratings on answers; totals and poorly rated questions for faculty. |
| `stats.php` | Anonymous statistics for the faculty Insights tab and the admin overview. |
| `google.php` | Classroom sync endpoints for teachers: connect / disconnect Google, link a class, sync now, preview, publish, skip, restore drafts. `sync_all` is called by `server.js` on a timer. |

## `database/`

| File | Purpose |
| --- | --- |
| `schema.sql` | All MySQL tables: users, courses, modules, materials, chats, feedback, Google accounts / links / items / sync log, class lists, sign-up requests, password resets, audit log. |
| `setup.php` | Run once (and after updates): `php database/setup.php`. Creates the database and tables, creates `.env` with a `RELOAD_KEY` if missing, adds demo accounts with random passwords, imports `modules/`. Safe to re-run. |
| `reset_admin.php` | `php database/reset_admin.php`: prints a new admin password (creates an admin if none exists). |
| `reset_password.php` | `php database/reset_password.php <email>`: prints a new password for any account. |

## `modules/`: course content the AI answers from

Generated from the database by `api/_export.php` whenever teachers change something; the files here are also the
starting content imported by `setup.php`. Each course is a folder of numbered markdown files starting with
`# Module N: Title`.

| Path | Purpose |
| --- | --- |
| `courses.json` | Course id → display name and college. |
| `ge-ethics/1-4 *.md` | GE Ethics: foundations, moral theories, professional ethics, ethics in technology. |
| `ge-ppc/1-4 *.md` | GE Philippine Popular Culture: what pop culture is, media and society, Filipino pop icons, social media trends. |
| `information-assurance/1-4 *.md` | Information Assurance: introduction, security principles, risk management, cryptography basics. |
| `it-313/1-4 *.md` | IT 313. **Placeholder text**: replace with the real modules. |
| `prof-elec-2/1-4 *.md` | Professional Elective 2 (web development): web architecture, HTML/CSS review, flexbox and grid, JavaScript basics. |
| `research-methods/1-4 *.md` | Research Methods: basics, review of literature, methodology, data analysis. |

## `public/`: web pages (served by Node)

| File | Purpose |
| --- | --- |
| `index.html` | Landing page: what LearnLink is, features, campus photo. |
| `login.html` | Login, "Continue with Google", student sign-up, forgot password. Opens the right app for the account's role. |
| `apps/student.html` | Student app shell: chat with the AI, course spaces, chat history, settings. |
| `apps/faculty.html` | Faculty app shell: courses, module uploads, Classroom sync, Insights, settings. |
| `apps/admin.html` | Admin app shell: overview, users, courses, analytics, audit log. |
| `css/theme.css` | The one place colors are defined (BISU blue + gold, light and dark). Loaded after each page's own stylesheet by the student, faculty, admin and login pages. |
| `css/dashboard.css` | Shared look for the faculty and admin dashboards: neutral cards, sidebar style. |
| `css/landing.css` | Styles for `index.html`. |
| `css/login.css` | Styles for `login.html`. |
| `css/student.css` | Styles for the student app (light and dark). |
| `css/faculty.css` | Styles for the faculty app. |
| `css/admin.css` | Styles for the admin app. |
| `js/gate.js` | Loaded first by the three app pages. Opened directly, they go to the login page; `?demo` shows the sample data with a DEMO label. Hides the page until real data has loaded, and shows "Can't reach LearnLink" if the server is down. |
| `js/login.js` | Login, Google button, two-step sign-up, forgot-password flow. |
| `js/student-core.js` | Student app, part 1: shared helpers, sample data (`?demo`), app state and `render()`. The student parts share globals, so `student.html` loads them in order, `student-start.js` last. |
| `js/student-signup.js` | Student sign-up: Google or a code, then your details. |
| `js/student-chat.js` | Sidebar, home screen and chat view. |
| `js/student-ai.js` | Talks to the AI through the login page: streamed answers, sources, Stop. |
| `js/student-courses.js` | A course's modules, the module viewer, and the course space (Ask / Summary / Quiz / Flashcards). |
| `js/student-db.js` | Database calls: account, courses, saved chats, ratings. |
| `js/student-settings.js` | Settings: photo, appearance, password, export / delete my data. |
| `js/student-network.js` | Connection status: Wi-Fi icon, speed checks, offline notice. |
| `js/student-tour.js` | First-login tour: three short cards, once per device, with Skip. |
| `js/student-start.js` | Loaded last: first draw, then loads the account, courses and chats. |
| `js/faculty.js` | Faculty app: courses, modules and uploads, Insights charts, home page. Shows sample data only when opened without the server. |
| `js/faculty-classroom.js` | Faculty "Classroom" tab: connect Google, link a class, review and publish drafts, sync history. |
| `js/faculty-settings.js` | Faculty Settings page: photo, profile, appearance, password, log out. |
| `js/account.js` | Change-password pop-up and its error messages, used by the faculty settings. |
| `js/admin.js` | Admin app screens and charts (sample data by default). |
| `js/admin-live.js` | Connects the admin app to the database: real users, courses, statistics and audit log. Loaded after `admin.js`. |
| `js/signup-codes.js` | "Students signing up" card on the faculty and admin home pages: shows sign-up / reset codes live, with a pop-up. |
| `img/bisu-balilihan.webp` | Campus photo for the landing page hero. |
| `img/bisu-balilihan.jpg` | Same photo, fallback for browsers without WebP. |

## `storage/`

| File | Purpose |
| --- | --- |
| `.htaccess` | Blocks browser access to uploaded files. |
| `uploads/.gitkeep` | Keeps the empty folder in git. Teacher uploads land in `uploads/<course>/` and are **not** committed. |

## Created at runtime (not in git)

| Path | Purpose |
| --- | --- |
| `logs/queries.jsonl` | One line per question: text, mode, sources, timings. Used for the thesis measurements. |
| `.cache/` | Saved embeddings so restarts are fast. |
| `storage/uploads/<course>/` | Original files teachers uploaded. |
