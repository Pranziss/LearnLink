<?php
// Teacher uploads. The original file is kept in storage/uploads/<course>/, its text goes in the database, and the AI is told to reload.
require __DIR__ . '/_boot.php';
require __DIR__ . '/_extract.php';
require __DIR__ . '/_export.php';
$act = $_GET['action'] ?? '';
$u = need();
$ALLOWED = ['pdf' => '%PDF', 'docx' => 'PK', 'pptx' => 'PK', 'md' => '', 'txt' => ''];   // extension => first bytes of a real file
$MAX = 25 * 1048576;

if ($act === 'download') {                 // students may only open files of published modules
    $m = q('SELECT m.original_name, m.stored_name, m.mime, d.course_id, d.published FROM materials m JOIN modules d ON d.id = m.module_id WHERE m.id = ?', [$_GET['id'] ?? 0])->fetch();
    if (!$m || !$m['stored_name']) fail('not_found', 404);
    if ($u['role'] === 'student' ? !$m['published'] : !can_manage($u, $m['course_id'])) fail('forbidden', 403);
    $file = "$ROOT/storage/uploads/{$m['course_id']}/{$m['stored_name']}";
    if (!is_file($file)) fail('file_missing', 404);
    header('Content-Type: ' . ($m['mime'] ?: 'application/octet-stream'));
    header('Content-Length: ' . filesize($file));
    header('Content-Disposition: attachment; filename="' . str_replace(['"', "\r", "\n"], '', $m['original_name']) . '"');
    readfile($file); exit;
}

if ($u['role'] === 'student') fail('forbidden', 403);

if ($act === 'upload') {
    $mid = (int)($_POST['module_id'] ?? 0);
    if (!$_POST && !$_FILES) fail('too_big_for_server', 413);                    // PHP drops everything when post_max_size is exceeded
    $cid = q('SELECT course_id FROM modules WHERE id = ?', [$mid])->fetchColumn();
    if (!$cid) fail('not_found', 404);
    if (!can_manage($u, $cid)) fail('forbidden', 403);
    if (($_POST['rights'] ?? '') !== '1') fail('rights_not_confirmed');
    $dir = "$ROOT/storage/uploads/$cid"; if (!is_dir($dir)) mkdir($dir, 0777, true);

    $f = $_FILES['files'] ?? null; $res = [];
    if (!$f) fail('no_files');
    foreach ((array)$f['name'] as $i => $name) {
        $name = basename($name); $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION)); $tmp = $f['tmp_name'][$i]; $r = ['name' => $name];
        if ($f['error'][$i] === UPLOAD_ERR_INI_SIZE || $f['size'][$i] > $MAX) $r += ['ok' => false, 'error' => 'Over 25 MB (or over the PHP upload limit)'];
        elseif ($f['error'][$i] !== UPLOAD_ERR_OK) $r += ['ok' => false, 'error' => 'Upload failed'];
        elseif (!isset($ALLOWED[$ext]) || ($ALLOWED[$ext] !== '' && strncmp(file_get_contents($tmp, false, null, 0, 4), $ALLOWED[$ext], strlen($ALLOWED[$ext])) !== 0)) $r += ['ok' => false, 'error' => 'Not a real ' . strtoupper($ext) . ' file'];
        else {
            $stored = bin2hex(random_bytes(16)) . '.' . $ext;
            move_uploaded_file($tmp, "$dir/$stored");
            try { $text = extract_text("$dir/$stored", $ext); $st = 'ready'; $err = null; }
            catch (Throwable $e) { $text = null; $st = 'failed'; $err = substr($e->getMessage(), 0, 250); }
            q('INSERT INTO materials (module_id, uploaded_by, original_name, stored_name, mime, size_bytes, status, error, extracted_text) VALUES (?,?,?,?,?,?,?,?,?)',
              [$mid, $u['id'], $name, $stored, $f['type'][$i], $f['size'][$i], $st, $err, $text]);
            $r += ['ok' => true, 'id' => db()->lastInsertId(), 'status' => $st, 'error' => $err];
        }
        $res[] = $r;
    }
    out(['files' => $res, 'kb' => export_modules()]);
}

// Teacher preview: the text the AI reads from one file, and a second try at reading a file that failed.
if ($act === 'text' || $act === 'retry') {
    $b = body(); $id = $_GET['id'] ?? $b['id'] ?? 0;
    $m = q('SELECT m.id, m.stored_name, m.original_name, m.extracted_text, d.course_id FROM materials m JOIN modules d ON d.id = m.module_id WHERE m.id = ?', [$id])->fetch();
    if (!$m) fail('not_found', 404);
    if (!can_manage($u, $m['course_id'])) fail('forbidden', 403);
    if ($act === 'text') out(['text' => mb_substr((string)$m['extracted_text'], 0, 4000), 'chars' => mb_strlen((string)$m['extracted_text'])]);
    if (!$m['stored_name']) fail('no_original');
    try { $text = extract_text("$ROOT/storage/uploads/{$m['course_id']}/{$m['stored_name']}", strtolower(pathinfo($m['original_name'], PATHINFO_EXTENSION))); $st = 'ready'; $err = null; }
    catch (Throwable $e) { $text = null; $st = 'failed'; $err = substr($e->getMessage(), 0, 250); }
    q('UPDATE materials SET status = ?, error = ?, extracted_text = ? WHERE id = ?', [$st, $err, $text, $m['id']]);
    out(['status' => $st, 'error' => $err, 'kb' => export_modules()]);
}

if ($act === 'delete') {
    $b = body();
    $m = q('SELECT m.id, m.stored_name, d.course_id FROM materials m JOIN modules d ON d.id = m.module_id WHERE m.id = ?', [$b['id'] ?? 0])->fetch();
    if (!$m) fail('not_found', 404);
    if (!can_manage($u, $m['course_id'])) fail('forbidden', 403);
    if ($m['stored_name']) @unlink("$ROOT/storage/uploads/{$m['course_id']}/{$m['stored_name']}");
    q('DELETE FROM materials WHERE id = ?', [$m['id']]);
    out(['kb' => export_modules()]);
}
fail('unknown_action', 404);
