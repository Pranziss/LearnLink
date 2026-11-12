<?php
// Google Classroom sync for teachers: connect a Google account, link a course to a Classroom class,
// check for new posts, and review the drafts (publish into a module, skip, restore).
require __DIR__ . '/_boot.php';
require __DIR__ . '/_extract.php';
require __DIR__ . '/_export.php';
require __DIR__ . '/_google.php';
$act = $_GET['action'] ?? 'status';

// Called by server.js on a timer (only from this PC, with the shared key): sync every linked course.
if ($act === 'sync_all') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!env('RELOAD_KEY') || ($_SERVER['HTTP_X_RELOAD_KEY'] ?? '') !== env('RELOAD_KEY') || !in_array($ip, ['127.0.0.1', '::1'])) fail('forbidden', 403);
    if (!gc_configured()) out(['skipped' => 'not_configured']);
    $res = [];
    foreach (q('SELECT course_id FROM classroom_links')->fetchAll(PDO::FETCH_COLUMN) as $cid) $res[$cid] = gc_sync($cid);
    $any = array_filter($res, fn($r) => !empty($r['new']));
    out(['results' => $res, 'kb' => $any ? export_modules() : null]);
}

// Google sends the teacher back here after they allow access (via server.js at /oauth/google).
if ($act === 'callback') {
    header('Content-Type: text/html; charset=utf-8');
    $back = function ($result) { header('Location: /login.html?gc=' . $result); exit; };
    $u = me();
    if (!$u || !in_array($u['role'], ['faculty', 'admin'])) $back('login');
    if (!empty($_GET['error'])) $back('denied');
    if (empty($_GET['state']) || !hash_equals($_SESSION['gc_state'] ?? '', $_GET['state'])) $back('expired');
    unset($_SESSION['gc_state']);
    try { $t = gc_exchange_code($_GET['code'] ?? ''); } catch (GcNetError $e) { $back('offline'); } catch (Throwable $e) { error_log('LearnLink Google: ' . $e->getMessage()); $back('failed'); }
    if ($t['refresh'] === '') $back('failed');
    $hd = env('GOOGLE_HD', 'bisu.edu.ph');
    if ($hd !== '' && !str_ends_with($t['email'], '@' . $hd)) $back('domain');
    q('INSERT INTO google_accounts (user_id, google_email, refresh_token) VALUES (?,?,?) ON DUPLICATE KEY UPDATE google_email = VALUES(google_email), refresh_token = VALUES(refresh_token), connected_at = NOW()',
      [$u['id'], $t['email'], $t['refresh']]);
    $back('connected');
}

$u = need('faculty', 'admin');

if ($act === 'status') {
    $g = q('SELECT google_email, connected_at FROM google_accounts WHERE user_id = ?', [$u['id']])->fetch();
    out(['configured' => gc_configured(), 'connected' => (bool)$g, 'email' => $g['google_email'] ?? null, 'redirect' => gc_redirect(),
         'online' => gc_online(), 'every' => (int)env('SYNC_MINUTES', '30')]);
}

// Opens Google's consent page. The browser comes back to /oauth/google.
if ($act === 'connect') {
    if (!gc_configured()) fail('not_configured', 400);
    $_SESSION['gc_state'] = bin2hex(random_bytes(16));
    header('Location: ' . gc_auth_url($_SESSION['gc_state'], $u['email']));
    http_response_code(302); exit;
}

if ($act === 'disconnect') {
    $r = q('SELECT refresh_token FROM google_accounts WHERE user_id = ?', [$u['id']])->fetchColumn();
    if ($r) { try { gc_http('POST', gc_url('oauth') . '/revoke', null, ['token' => $r], 10); } catch (Throwable $e) {} }
    q('DELETE FROM google_accounts WHERE user_id = ?', [$u['id']]);   // class links stay; syncing resumes when the teacher reconnects
    out(['ok' => true]);
}

// The teacher's Classroom classes, to pick one to link.
if ($act === 'classes') {
    try { out(['classes' => gc_classes(gc_access_token($u['id']))]); }
    catch (GcNetError $e) { fail('offline', 503); }
    catch (GcAuthError $e) { fail('google_expired', 401); }
}

// Number of drafts waiting, per course this user manages (for the home page banner and the tab counter).
if ($act === 'pending') {
    $sql = 'SELECT i.course_id, COUNT(*) n FROM classroom_items i JOIN classroom_links l ON l.course_id = i.course_id WHERE i.status = "draft"';
    $rows = $u['role'] === 'admin' ? q("$sql GROUP BY i.course_id")->fetchAll() : q("$sql AND i.course_id IN (SELECT id FROM courses WHERE faculty_id = ?) GROUP BY i.course_id", [$u['id']])->fetchAll();
    out(['pending' => array_column($rows, 'n', 'course_id')]);
}

$b = body();
$cid = $_GET['course_id'] ?? $b['course_id'] ?? null;
if ($cid === null && !empty($b['item_id'])) $cid = q('SELECT course_id FROM classroom_items WHERE id = ?', [$b['item_id']])->fetchColumn();
if ($cid === null && !empty($_GET['id'])) $cid = q('SELECT course_id FROM classroom_items WHERE id = ?', [$_GET['id']])->fetchColumn();
if (!$cid || !can_manage($u, $cid)) fail('forbidden', 403);

// Everything the Classroom tab shows for one course.
if ($act === 'items') {
    $l = q('SELECT l.gc_course_name, l.last_sync_at, l.linked_at, a.google_email FROM classroom_links l LEFT JOIN google_accounts a ON a.user_id = l.user_id WHERE l.course_id = ?', [$cid])->fetch();
    $items = q('SELECT id, title, kind, topic, posted_at, status, reason, size_bytes, module_id, CHAR_LENGTH(extracted_text) AS chars FROM classroom_items WHERE course_id = ? AND status <> "published" ORDER BY posted_at DESC, id DESC', [$cid])->fetchAll();
    $log = q('SELECT ok, message, created_at FROM classroom_sync_log WHERE course_id = ? ORDER BY id DESC LIMIT 10', [$cid])->fetchAll();
    $pub = (int)q('SELECT COUNT(*) FROM classroom_items WHERE course_id = ? AND status = "published"', [$cid])->fetchColumn();
    out(['link' => $l ?: null, 'items' => $items, 'log' => $log, 'published' => $pub]);
}

if ($act === 'link') {
    $gid = (string)($b['gc_course_id'] ?? '');
    try { $classes = gc_classes(gc_access_token($u['id'])); }
    catch (GcNetError $e) { fail('offline', 503); }
    catch (GcAuthError $e) { fail('google_expired', 401); }
    $c = array_values(array_filter($classes, fn($x) => $x['id'] === $gid));
    if (!$c) fail('not_your_class', 400);
    q('INSERT INTO classroom_links (course_id, user_id, gc_course_id, gc_course_name) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), gc_course_id = VALUES(gc_course_id), gc_course_name = VALUES(gc_course_name), linked_at = NOW(), last_sync_at = NULL',
      [$cid, $u['id'], $gid, mb_substr($c[0]['name'], 0, 200)]);
    gc_log($cid, true, 'Linked to ' . $c[0]['name']);
    out(['ok' => true, 'sync' => gc_sync($cid)]);
}

if ($act === 'unlink') {
    q('DELETE FROM classroom_links WHERE course_id = ?', [$cid]);
    foreach (q('SELECT stored_name FROM classroom_items WHERE course_id = ? AND status <> "published" AND stored_name IS NOT NULL', [$cid])->fetchAll(PDO::FETCH_COLUMN) as $f) @unlink("$ROOT/storage/uploads/$cid/$f");
    q('DELETE FROM classroom_items WHERE course_id = ? AND status <> "published"', [$cid]);   // published materials stay
    out(['ok' => true]);
}

if ($act === 'sync') out(gc_sync($cid));

if ($act === 'text') {
    $t = q('SELECT title, extracted_text FROM classroom_items WHERE id = ? AND course_id = ?', [$_GET['id'] ?? 0, $cid])->fetch();
    if (!$t) fail('not_found', 404);
    out(['text' => mb_substr((string)$t['extracted_text'], 0, 4000), 'chars' => mb_strlen((string)$t['extracted_text'])]);
}

// Publish a draft into a module: it becomes an ordinary material, and the AI is told to reload.
function gc_publish($u, $cid, $itemId, $moduleId) {
    $it = q('SELECT * FROM classroom_items WHERE id = ? AND course_id = ? AND status = "draft"', [$itemId, $cid])->fetch();
    if (!$it) fail('not_found', 404);
    if (!q('SELECT 1 FROM modules WHERE id = ? AND course_id = ?', [$moduleId, $cid])->fetch()) fail('bad_module');
    $name = $it['title'];
    if (!preg_match('/\.[a-z0-9]{2,4}$/i', $name)) $name .= '.' . ($it['stored_name'] ? pathinfo($it['stored_name'], PATHINFO_EXTENSION) : 'txt');
    db()->beginTransaction();
    q('INSERT INTO materials (module_id, uploaded_by, original_name, stored_name, mime, size_bytes, status, extracted_text) VALUES (?,?,?,?,?,?,"ready",?)',
      [$moduleId, $u['id'], mb_substr($name, 0, 255), $it['stored_name'], $it['mime'] ?: 'text/plain', $it['size_bytes'], $it['extracted_text']]);
    q('UPDATE classroom_items SET status = "published", module_id = ?, material_id = ? WHERE id = ?', [$moduleId, db()->lastInsertId(), $itemId]);
    db()->commit();
    return $name;
}
if ($act === 'publish') {
    $n = gc_publish($u, $cid, (int)($b['item_id'] ?? 0), (int)($b['module_id'] ?? 0));
    gc_log($cid, true, 'You published “' . $n . '”');
    out(['ok' => true, 'kb' => export_modules()]);
}
if ($act === 'publish_all') {
    $n = 0;
    foreach ((array)($b['items'] ?? []) as $x) { gc_publish($u, $cid, (int)($x['item_id'] ?? 0), (int)($x['module_id'] ?? 0)); $n++; }
    gc_log($cid, true, "You published $n material" . ($n === 1 ? '' : 's'));
    out(['ok' => true, 'kb' => export_modules()]);
}
if ($act === 'skip' || $act === 'restore') {
    $from = $act === 'skip' ? 'draft' : 'skipped';
    $st = q('UPDATE classroom_items SET status = ?, reason = ? WHERE id = ? AND course_id = ? AND status = ?',
      [$act === 'skip' ? 'skipped' : 'draft', $act === 'skip' ? 'Skipped by you' : null, (int)($b['item_id'] ?? 0), $cid, $from]);
    if (!$st->rowCount()) fail('not_found', 404);
    out(['ok' => true]);
}
// Move the suggested module before publishing.
if ($act === 'set_module') {
    if (!q('SELECT 1 FROM modules WHERE id = ? AND course_id = ?', [(int)($b['module_id'] ?? 0), $cid])->fetch()) fail('bad_module');
    q('UPDATE classroom_items SET module_id = ? WHERE id = ? AND course_id = ? AND status = "draft"', [(int)$b['module_id'], (int)($b['item_id'] ?? 0), $cid]);
    out(['ok' => true]);
}
fail('unknown_action', 404);
