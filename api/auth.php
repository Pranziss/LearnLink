<?php
// Accounts: login (password or Google), student sign-up, forgot and change password, logout, me. Admin: list users, create faculty, enable/disable, reset passwords.
require __DIR__ . '/_boot.php';
$act = $_GET['action'] ?? '';
$b = body();

if ($act === 'me') {
    $u = me();
    // for server.js: the courses a student may get answers from (null = all). Same rule as the course list.
    $allowed = $u && $u['role'] === 'student' ? q('SELECT c.id FROM courses c WHERE NOT EXISTS (SELECT 1 FROM classroom_roster r WHERE r.course_id = c.id)
        OR EXISTS (SELECT 1 FROM classroom_roster r WHERE r.course_id = c.id AND r.email = ?)', [$u['email']])->fetchAll(PDO::FETCH_COLUMN) : null;
    out(['user' => $u, 'allowed' => $allowed]);
}

if ($act === 'logout') { $_SESSION = []; session_destroy(); out(['ok' => true]); }

if ($act === 'login') {
    $id = strtolower(trim($b['email'] ?? '')); $pw = (string)($b['password'] ?? '');
    $u = q('SELECT * FROM users WHERE email = ? OR username = ?', [$id, $id])->fetch();
    if (!$u || !password_verify($pw, $u['password_hash'])) { usleep(500000); fail('bad_login', 401); }
    if ($u['status'] !== 'active') fail('account_disabled', 403);
    // The login page has a Student / Faculty / Admin switch. It must match the real role of the account.
    if (!empty($b['role']) && $b['role'] !== $u['role']) fail('wrong_role', 403, ['role' => $u['role']]);
    session_regenerate_id(true);
    $_SESSION['uid'] = $u['id'];
    q('UPDATE users SET last_login_at = NOW() WHERE id = ?', [$u['id']]);
    out(['user' => me()]);
}

/* ---- signing up (students) ----
   Step 1 proves the student owns a real BISU email, one of two ways:
     - "Continue with Google" (needs internet at that moment), or
     - a 6-digit code that appears for their teacher and the admin inside LearnLink (works with no internet).
   Step 2 (register) collects their details and password. After that they log in over the campus network
   with email + password, internet or not. */
const SIGNUP_MINUTES = 30;        // how long a proven email stays valid in this browser before step 2 must be done
function bisu_email($em) { return (bool)preg_match('/^[^\s@]+@' . preg_quote(env('GOOGLE_HD', 'bisu.edu.ph'), '/') . '$/', $em); }
function signup_ok($em, $name, $via) {
    session_regenerate_id(true);
    $_SESSION['signup'] = ['email' => $em, 'name' => $name, 'via' => $via, 'at' => time()];
}
function signup_now() {
    $s = $_SESSION['signup'] ?? null;
    return $s && time() - $s['at'] < SIGNUP_MINUTES * 60 ? $s : null;
}
function roster_name($em) { return q('SELECT name FROM classroom_roster WHERE email = ? AND name IS NOT NULL LIMIT 1', [$em])->fetchColumn() ?: null; }

// Tell Node that the list of sign-up / reset codes changed, so open admin and faculty pages update at once.
// Quick and silent: if Node is not running, the pages still check every 20 seconds.
function notify_codes() {
    if (!env('RELOAD_KEY')) return;
    $ctx = stream_context_create(['http' => ['method' => 'POST', 'timeout' => 1, 'ignore_errors' => true, 'header' => "x-reload-key: " . env('RELOAD_KEY') . "\r\nContent-Length: 0\r\n"]]);
    @file_get_contents(rtrim(env('NODE_URL', 'http://127.0.0.1:3000'), '/') . '/api/notify', false, $ctx);
}

// What the login and sign-up pages can offer right now.
if ($act === 'options') {
    require __DIR__ . '/_google.php';
    out(['google' => gs_configured(), 'redirect' => gs_redirect(), 'domain' => env('GOOGLE_HD', 'bisu.edu.ph'),
         'roster_only' => env('SIGNUP_ROSTER_ONLY', 'false') === 'true']);
}

// "Continue with Google": off to Google, back at /oauth/signin.
if ($act === 'google_start') {
    require __DIR__ . '/_google.php';
    if (!gs_configured()) { header('Location: /login.html?gs=off'); exit; }
    $_SESSION['gs_state'] = bin2hex(random_bytes(16));
    $_SESSION['gs_for'] = ($_GET['for'] ?? '') === 'signup' ? 'signup' : 'login';
    header('Location: ' . gs_auth_url($_SESSION['gs_state'])); http_response_code(302); exit;
}
if ($act === 'google_callback') {
    require __DIR__ . '/_google.php';
    header('Content-Type: text/html; charset=utf-8');
    $back = function ($r) { header('Location: /login.html?gs=' . $r); exit; };
    if (!empty($_GET['error'])) $back('denied');
    if (empty($_GET['state']) || !hash_equals($_SESSION['gs_state'] ?? '', $_GET['state'])) $back('expired');
    unset($_SESSION['gs_state']);
    try { $g = gs_exchange($_GET['code'] ?? ''); } catch (GcNetError $e) { $back('offline'); } catch (Throwable $e) { error_log('LearnLink sign-in: ' . $e->getMessage()); $back('failed'); }
    $hd = env('GOOGLE_HD', 'bisu.edu.ph');
    if (!$g['verified'] || !bisu_email($g['email']) || ($hd !== '' && $g['hd'] !== $hd)) $back('domain');
    $u = q('SELECT id, status FROM users WHERE email = ?', [$g['email']])->fetch();
    if ($u) {                                              // already has an account: just log in
        if ($u['status'] !== 'active') $back('disabled');
        session_regenerate_id(true);
        $_SESSION['uid'] = $u['id'];
        q('UPDATE users SET last_login_at = NOW() WHERE id = ?', [$u['id']]);
        $back('in');
    }
    // no account yet: only students sign themselves up; faculty and admin accounts are made by the admin
    if (env('SIGNUP_ROSTER_ONLY', 'false') === 'true' && !q('SELECT 1 FROM classroom_roster WHERE email = ?', [$g['email']])->fetch()) $back('roster');
    signup_ok($g['email'], $g['name'] ?: roster_name($g['email']), 'google');
    $back('signup');
}

// No internet: ask for a code. It is shown to the student's teacher (if their class list has this email) and to the admin.
if ($act === 'signup_start') {
    $em = strtolower(trim($b['email'] ?? ''));
    if (!bisu_email($em)) fail('bad_email');
    if (q('SELECT 1 FROM users WHERE email = ?', [$em])->fetch()) fail('email_taken', 409);
    $onRoster = (bool)q('SELECT 1 FROM classroom_roster WHERE email = ?', [$em])->fetch();
    if (env('SIGNUP_ROSTER_ONLY', 'false') === 'true' && !$onRoster) fail('not_on_roster', 403);
    $r = q('SELECT created_at FROM signup_requests WHERE email = ? AND expires_at > NOW()', [$em])->fetch();
    $fresh = !$r || strtotime($r['created_at']) < time() - 60;       // asking again after a minute gives a fresh code
    if ($fresh) { q('REPLACE INTO signup_requests (email, code, attempts, created_at, expires_at) VALUES (?,?,0,NOW(),NOW() + INTERVAL 2 HOUR)', [$em, (string)random_int(100000, 999999)]); notify_codes(); }
    // with internet and SMTP set up, the code is also emailed. The teacher/admin copy stays as the backup.
    require __DIR__ . '/_mail.php';
    $sent = false;
    if ($fresh && mail_configured()) {
        $code = q('SELECT code FROM signup_requests WHERE email = ?', [$em])->fetchColumn();
        $sent = mail_send($em, "Your LearnLink code: $code",
            "Hi!\n\nYour LearnLink sign-up code is: $code\n\nType it on the sign-up page within 2 hours. If you didn't ask for this, you can ignore this email.\n\nLearnLink · BISU Balilihan Campus");
    }
    out(['ok' => true, 'teacher' => $onRoster, 'emailed' => $sent, 'mail' => mail_configured()]);
}
if ($act === 'signup_verify') {
    $em = strtolower(trim($b['email'] ?? '')); $code = preg_replace('/\D/', '', (string)($b['code'] ?? ''));
    $r = q('SELECT * FROM signup_requests WHERE email = ? AND expires_at > NOW()', [$em])->fetch();
    if (!$r) fail('code_expired', 410);
    if ($r['attempts'] >= 5) fail('too_many_tries', 429);
    if (!hash_equals($r['code'], $code)) { q('UPDATE signup_requests SET attempts = attempts + 1 WHERE email = ?', [$em]); if ($r['attempts'] >= 4) notify_codes(); usleep(400000); fail('bad_code', 400, ['left' => 4 - (int)$r['attempts']]); }
    q('DELETE FROM signup_requests WHERE email = ?', [$em]);
    notify_codes();
    signup_ok($em, roster_name($em), 'code');
    out(['ok' => true, 'email' => $em, 'name' => $_SESSION['signup']['name']]);
}
// The sign-up page asks this after coming back from Google.
if ($act === 'signup_state') {
    $s = signup_now();
    out(['email' => $s['email'] ?? null, 'name' => $s['name'] ?? null, 'via' => $s['via'] ?? null]);
}

// Step 2: details and password. Only works for an email proven in step 1.
if ($act === 'register') {
    $s = signup_now();
    if (!$s) fail('verify_first', 403);
    $em = $s['email']; $pw = (string)($b['password'] ?? ''); $name = trim(preg_replace('/\s+/', ' ', $b['name'] ?? ''));
    if (empty($b['agree'])) fail('must_agree');
    if (mb_strlen($name) < 3) fail('missing_name');
    if (!preg_match('/^(?=.*[A-Za-z])(?=.*\d).{8,}$/', $pw)) fail('weak_password');
    foreach (['student_id', 'college', 'program', 'year_level', 'section'] as $k) if (trim($b[$k] ?? '') === '') fail('missing_' . $k);
    if (q('SELECT 1 FROM users WHERE email = ?', [$em])->fetch()) fail('email_taken', 409);
    q('INSERT INTO users (role, name, email, password_hash, student_id, college, program, year_level, section) VALUES ("student",?,?,?,?,?,?,?,?)',
      [mb_substr($name, 0, 120), $em, password_hash($pw, PASSWORD_DEFAULT), trim($b['student_id']), $b['college'], $b['program'], $b['year_level'], $b['section']]);
    unset($_SESSION['signup']);
    session_regenerate_id(true);
    $_SESSION['uid'] = db()->lastInsertId();
    out(['user' => me()], 201);
}

// Logged-in users (student, faculty, admin) change their own password: current password + new one.
if ($act === 'change_password') {
    $u = need();
    $cur = (string)($b['current'] ?? ''); $pw = (string)($b['password'] ?? '');
    $h = q('SELECT password_hash FROM users WHERE id = ?', [$u['id']])->fetchColumn();
    if (!$h || !password_verify($cur, $h)) { usleep(400000); fail('wrong_password', 400); }
    if (!preg_match('/^(?=.*[A-Za-z])(?=.*\d).{8,}$/', $pw)) fail('weak_password');
    if (password_verify($pw, $h)) fail('same_password');
    q('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($pw, PASSWORD_DEFAULT), $u['id']]);
    if (q('DELETE FROM password_resets WHERE email = ?', [$u['email']])->rowCount()) notify_codes();   // an old reset code is no longer needed
    audit($u, 'Changed their password');
    out(['ok' => true]);
}

/* ---- forgot password ----
   Works like the sign-up code: the code is emailed when the server has internet, and it also shows for the admin
   (and for the teacher, if the student is on their class list), who checks the school ID and reads it out.
   The answer is the same whether or not the account exists, so this cannot be used to find out who has an account. */
const RESET_MINUTES = 15;          // how long a verified code lets this browser set a new password
if ($act === 'reset_start') {
    $em = strtolower(trim($b['email'] ?? ''));
    if ($em !== '' && strpos($em, '@') === false) $em .= '@' . env('GOOGLE_HD', 'bisu.edu.ph');
    if (!bisu_email($em)) fail('bad_email');
    require __DIR__ . '/_mail.php';
    if (q('SELECT 1 FROM users WHERE email = ? AND status = "active"', [$em])->fetch()) {
        $r = q('SELECT created_at FROM password_resets WHERE email = ? AND expires_at > NOW()', [$em])->fetch();
        $fresh = !$r || strtotime($r['created_at']) < time() - 60;      // asking again after a minute gives a fresh code
        if ($fresh) {
            $code = (string)random_int(100000, 999999);
            q('REPLACE INTO password_resets (email, code, attempts, created_at, expires_at) VALUES (?,?,0,NOW(),NOW() + INTERVAL 2 HOUR)', [$em, $code]);
            notify_codes();                                  // admin/teacher see it at once; the email (slower) goes out after
            if (mail_configured()) mail_send($em, "Your LearnLink password reset code: $code",
                "Hi!\n\nYour LearnLink password reset code is: $code\n\nType it on the \"Forgot password\" page within 2 hours. If you didn't ask for this, you can ignore this email; your password stays the same.\n\nLearnLink · BISU Balilihan Campus");
        }
    }
    out(['ok' => true, 'email' => $em, 'mail' => mail_configured()]);
}
if ($act === 'reset_verify') {
    $em = strtolower(trim($b['email'] ?? '')); $code = preg_replace('/\D/', '', (string)($b['code'] ?? ''));
    $r = q('SELECT * FROM password_resets WHERE email = ? AND expires_at > NOW()', [$em])->fetch();
    if (!$r) fail('code_expired', 410);
    if ($r['attempts'] >= 5) fail('too_many_tries', 429);
    if (!hash_equals($r['code'], $code)) { q('UPDATE password_resets SET attempts = attempts + 1 WHERE email = ?', [$em]); if ($r['attempts'] >= 4) notify_codes(); usleep(400000); fail('bad_code', 400, ['left' => 4 - (int)$r['attempts']]); }
    q('DELETE FROM password_resets WHERE email = ?', [$em]);
    notify_codes();
    session_regenerate_id(true);
    $_SESSION['reset'] = ['email' => $em, 'at' => time()];
    out(['ok' => true]);
}
if ($act === 'reset_finish') {
    $s = $_SESSION['reset'] ?? null;
    if (!$s || time() - $s['at'] > RESET_MINUTES * 60) fail('reset_first', 403);
    $pw = (string)($b['password'] ?? '');
    if (!preg_match('/^(?=.*[A-Za-z])(?=.*\d).{8,}$/', $pw)) fail('weak_password');
    $u = q('SELECT id, role, name FROM users WHERE email = ? AND status = "active"', [$s['email']])->fetch();
    if (!$u) fail('account_disabled', 403);
    q('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($pw, PASSWORD_DEFAULT), $u['id']]);
    unset($_SESSION['reset']);
    audit($u, 'Reset their password with a code');
    out(['ok' => true]);
}

// Teachers and the admin: sign-up codes waiting to be read out. Faculty see students on their own class lists only.
if ($act === 'signup_codes') {
    $u = need('faculty', 'admin');
    // sign-up codes and password reset codes together; "kind" tells them apart
    $sql = 'SELECT r.kind, r.email, r.code, TIMESTAMPDIFF(MINUTE, NOW(), r.expires_at) AS mins,
                   COALESCE((SELECT name FROM users u WHERE u.email = r.email),
                            (SELECT name FROM classroom_roster x WHERE x.email = r.email AND x.name IS NOT NULL LIMIT 1)) AS name,
                   (SELECT GROUP_CONCAT(DISTINCT c.name SEPARATOR ", ") FROM classroom_roster x JOIN courses c ON c.id = x.course_id WHERE x.email = r.email) AS classes
            FROM (SELECT "signup" AS kind, email, code, attempts, created_at, expires_at FROM signup_requests
                  UNION ALL SELECT "reset", email, code, attempts, created_at, expires_at FROM password_resets) r
            WHERE r.expires_at > NOW() AND r.attempts < 5';
    $rows = $u['role'] === 'admin' ? q("$sql ORDER BY r.created_at DESC")->fetchAll()
        : q("$sql AND r.email IN (SELECT x.email FROM classroom_roster x JOIN courses c ON c.id = x.course_id WHERE c.faculty_id = ?) ORDER BY r.created_at DESC", [$u['id']])->fetchAll();
    out(['codes' => $rows]);
}

/* ---- admin ---- */
if ($act === 'users') {
    need('admin');
    out(['users' => q('SELECT id, role, name, username, email, student_id, college, program, year_level, section, status, created_at, last_login_at FROM users ORDER BY role, name')->fetchAll()]);
}
if ($act === 'create_user') {                       // admin adds an account; a temporary password is returned once
    $a = need('admin');
    $em = strtolower(trim($b['email'] ?? '')); $role = $b['role'] ?? 'faculty';
    if (!in_array($role, ['student', 'faculty', 'admin'])) fail('bad_role');
    if (!preg_match('/^[^\s@]+@bisu\.edu\.ph$/', $em)) fail('bad_email');
    if (trim($b['name'] ?? '') === '') fail('missing_fields');
    if (q('SELECT 1 FROM users WHERE email = ?', [$em])->fetch()) fail('email_taken', 409);
    $un = $role === 'student' && trim($b['username'] ?? '') !== '' ? trim($b['username']) : null;
    if ($un && q('SELECT 1 FROM users WHERE username = ?', [$un])->fetch()) fail('username_taken', 409);
    $pw = substr(bin2hex(random_bytes(6)), 0, 8) . 'a1';
    q('INSERT INTO users (role, name, username, email, password_hash, student_id, college, program, year_level, section) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [$role, trim($b['name']), $un, $em, password_hash($pw, PASSWORD_DEFAULT), $b['student_id'] ?: null, $b['college'] ?: null, $b['program'] ?: null, $b['year_level'] ?: null, $b['section'] ?: null]);
    $nid = db()->lastInsertId();
    audit($a ?? me(), "Added $role account $em");
    out(['id' => $nid, 'temp_password' => $pw], 201);
}
if ($act === 'update_user') {
    $a = need('admin'); $id = (int)($b['id'] ?? 0);
    $em = strtolower(trim($b['email'] ?? ''));
    if (!preg_match('/^[^\s@]+@bisu\.edu\.ph$/', $em) || trim($b['name'] ?? '') === '') fail('missing_fields');
    if (q('SELECT 1 FROM users WHERE email = ? AND id <> ?', [$em, $id])->fetch()) fail('email_taken', 409);
    $st = ($b['status'] ?? 'active') === 'disabled' ? 'disabled' : 'active';
    if ($id === (int)$a['id'] && $st === 'disabled') fail('cannot_disable_self');
    $old = q('SELECT status FROM users WHERE id = ?', [$id])->fetchColumn();
    q('UPDATE users SET name = ?, email = ?, college = ?, program = ?, year_level = ?, section = ?, student_id = ?, status = ? WHERE id = ?',
      [trim($b['name']), $em, $b['college'] ?: null, $b['program'] ?: null, $b['year_level'] ?: null, $b['section'] ?: null, $b['student_id'] ?: null, $st, $id]);
    audit($a, "Edited user $em" . ($old && $old !== $st ? ($st === 'active' ? ' and reactivated the account' : ' and deactivated the account') : ''));
    out(['ok' => true]);
}
if ($act === 'reset_password') {                    // admin sets a new temporary password; shown once
    $a = need('admin'); $id = (int)($b['id'] ?? 0);
    $u = q('SELECT email FROM users WHERE id = ?', [$id])->fetch();
    if (!$u) fail('not_found', 404);
    $pw = substr(bin2hex(random_bytes(6)), 0, 8) . 'a1';
    q('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash($pw, PASSWORD_DEFAULT), $id]);
    if (q('DELETE FROM password_resets WHERE email = ?', [$u['email']])->rowCount()) notify_codes();
    audit($a, "Reset the password of {$u['email']}");
    out(['temp_password' => $pw]);
}
if ($act === 'delete_user') {
    $a = need('admin'); $id = (int)($b['id'] ?? 0);
    if ($id === (int)$a['id']) fail('cannot_delete_self');
    $em = q('SELECT email FROM users WHERE id = ?', [$id])->fetchColumn();
    q('DELETE FROM users WHERE id = ?', [$id]);
    if ($em) audit($a, "Deleted user $em");          // their chats and feedback go with them; courses they owned become unassigned
    out(['ok' => true]);
}
if ($act === 'set_status') {
    $a = need('admin');
    if ((int)$b['id'] === (int)$a['id']) fail('cannot_disable_self');
    if (!in_array($b['status'] ?? '', ['active', 'disabled'])) fail('bad_status');
    q('UPDATE users SET status = ? WHERE id = ?', [$b['status'], $b['id']]);
    audit($a, ($b['status'] === 'active' ? 'Reactivated' : 'Deactivated') . ' user #' . (int)$b['id']);
    out(['ok' => true]);
}
if ($act === 'audit') {
    need('admin');
    out(['log' => q('SELECT actor, action, created_at FROM audit_log ORDER BY id DESC LIMIT 100')->fetchAll()]);
}
fail('unknown_action', 404);
