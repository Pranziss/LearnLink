-- LearnLink database. Run by `php database/setup.php` (creates the database first).
-- Engine InnoDB + utf8mb4 so foreign keys work and Filipino/emoji text is stored properly.

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role          ENUM('student','faculty','admin') NOT NULL DEFAULT 'student',
  name          VARCHAR(120) NOT NULL,
  username      VARCHAR(30)  NULL UNIQUE,
  email         VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  student_id    VARCHAR(30)  NULL,
  college       VARCHAR(160) NULL,
  program       VARCHAR(160) NULL,
  year_level    VARCHAR(20)  NULL,
  section       VARCHAR(10)  NULL,
  status        ENUM('active','disabled') NOT NULL DEFAULT 'active',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- id is the folder name under modules/ (ge-ppc, it-313, ...), so it matches what retrieval.js already uses as "scope".
CREATE TABLE IF NOT EXISTS courses (
  id         VARCHAR(60) PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  college    VARCHAR(40)  NOT NULL DEFAULT '',
  faculty_id INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS modules (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id  VARCHAR(60) NOT NULL,
  position   SMALLINT UNSIGNED NOT NULL,
  title      VARCHAR(160) NOT NULL,
  published  TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY course_pos (course_id, position),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One row per uploaded file. The original is kept on disk (stored_name, under storage/uploads);
-- the text pulled out of it is kept here and is what the AI searches.
CREATE TABLE IF NOT EXISTS materials (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  module_id      INT UNSIGNED NOT NULL,
  uploaded_by    INT UNSIGNED NULL,
  original_name  VARCHAR(255) NOT NULL,
  stored_name    VARCHAR(120) NULL,          -- NULL = imported from a .md file, no original on disk
  mime           VARCHAR(100) NULL,
  size_bytes     INT UNSIGNED NOT NULL DEFAULT 0,
  status         ENUM('ready','failed') NOT NULL DEFAULT 'ready',
  error          VARCHAR(255) NULL,
  extracted_text MEDIUMTEXT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id)   REFERENCES modules(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chats (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NOT NULL,
  course_id  VARCHAR(60) NULL,
  title      VARCHAR(80) NOT NULL DEFAULT 'New chat',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY by_user (user_id, updated_at),
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- mode/sources/timings are what server.js reports for each answer, kept for the thesis evaluation.
CREATE TABLE IF NOT EXISTS messages (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  chat_id     INT UNSIGNED NOT NULL,
  role        ENUM('user','assistant') NOT NULL,
  content     TEXT NOT NULL,
  course_id   VARCHAR(60) NULL,              -- course the answer was taken from (grounded answers only)
  mode        VARCHAR(12) NULL,              -- grounded | general | chat | none
  sources     TEXT NULL,                     -- JSON: [{course,title}]
  retrieval   VARCHAR(10) NULL,              -- hybrid | bm25
  model       VARCHAR(80) NULL,
  retrieve_ms INT UNSIGNED NULL,
  queue_ms    INT UNSIGNED NULL,
  generate_ms INT UNSIGNED NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY by_chat (chat_id, id),
  KEY by_course (course_id),
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One rating per student per answer. rating 1 = helpful, -1 = not helpful.
CREATE TABLE IF NOT EXISTS feedback (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  message_id INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  rating     TINYINT NOT NULL,
  reason     VARCHAR(60)  NULL,
  comment    VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY one_per_user (message_id, user_id),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Google Classroom sync ----------
-- A teacher's Google account. Only the refresh token is kept; access tokens are fetched when a sync runs.
CREATE TABLE IF NOT EXISTS google_accounts (
  user_id       INT UNSIGNED PRIMARY KEY,
  google_email  VARCHAR(160) NOT NULL,
  refresh_token TEXT NOT NULL,
  connected_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- One LearnLink course is linked to one Classroom class, read with one teacher's Google account.
CREATE TABLE IF NOT EXISTS classroom_links (
  course_id      VARCHAR(60) PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  gc_course_id   VARCHAR(40) NOT NULL,
  gc_course_name VARCHAR(200) NOT NULL,
  linked_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_sync_at   DATETIME NULL,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Every attachment found in Classroom. Drafts wait for the teacher; nothing reaches students until it is published
-- (published = copied into materials). Skipped and unreadable items are kept so they are not imported again.
CREATE TABLE IF NOT EXISTS classroom_items (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id      VARCHAR(60) NOT NULL,
  gc_key         VARCHAR(190) NOT NULL,          -- Classroom post id + attachment id
  title          VARCHAR(255) NOT NULL,
  kind           VARCHAR(30)  NOT NULL,          -- PDF, PPTX, DOCX, Google Doc, Google Slides, YouTube video, Link, ...
  topic          VARCHAR(160) NULL,
  posted_at      DATETIME NULL,
  status         ENUM('draft','published','skipped','unreadable') NOT NULL DEFAULT 'draft',
  reason         VARCHAR(255) NULL,              -- why it was not added
  stored_name    VARCHAR(120) NULL,              -- copy of the file under storage/uploads/<course>/
  mime           VARCHAR(100) NULL,
  size_bytes     INT UNSIGNED NOT NULL DEFAULT 0,
  extracted_text MEDIUMTEXT NULL,
  module_id      INT UNSIGNED NULL,              -- suggested module, then the one the teacher chose
  material_id    INT UNSIGNED NULL,              -- the material created when it was published
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY one_item (course_id, gc_key),
  FOREIGN KEY (course_id)   REFERENCES courses(id)   ON DELETE CASCADE,
  FOREIGN KEY (module_id)   REFERENCES modules(id)   ON DELETE SET NULL,
  FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS classroom_sync_log (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  course_id  VARCHAR(60) NOT NULL,
  ok         TINYINT(1) NOT NULL,
  message    VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY by_course (course_id, id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Who did what (admin changes, data exports and deletions). Actions only, never chat content.
CREATE TABLE IF NOT EXISTS audit_log (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED NULL,
  actor      VARCHAR(120) NOT NULL,
  action     VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------- Real student accounts ----------
-- Students listed in each linked Classroom class (read during a sync). A course linked to Classroom is shown
-- only to the students on its list; courses that are not linked stay open to every student.
CREATE TABLE IF NOT EXISTS classroom_roster (
  course_id  VARCHAR(60) NOT NULL,
  email      VARCHAR(160) NOT NULL,
  name       VARCHAR(120) NULL,
  synced_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (course_id, email),
  KEY by_email (email),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sign-up without Google (no internet): the student asks for a code, and the code shows up for their teacher
-- and the admin inside LearnLink. They read it out, the student types it in. Codes last 2 hours.
CREATE TABLE IF NOT EXISTS signup_requests (
  email      VARCHAR(160) PRIMARY KEY,
  code       CHAR(6) NOT NULL,
  attempts   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Forgot password: same idea as sign-up codes. The code is emailed when there is internet, and it also shows for
-- the admin (and the student's teacher) inside LearnLink, who checks the school ID and reads it out. Codes last 2 hours.
CREATE TABLE IF NOT EXISTS password_resets (
  email      VARCHAR(160) PRIMARY KEY,
  code       CHAR(6) NOT NULL,
  attempts   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
