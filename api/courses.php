<?php
// Courses and their modules. Students see published modules; faculty see (and edit) their own courses; admin sees all.
require __DIR__ . '/_boot.php';
require __DIR__ . '/_export.php';
$act = $_GET['action'] ?? 'list';
$u = need();
$b = body();

function module_course($id) {                 // course id that owns this module, or fail
    $c = q('SELECT course_id FROM modules WHERE id = ?', [$id])->fetchColumn();
    if (!$c) fail('not_found', 404);
    return $c;
}

if ($act === 'list') {
    $sql = 'SELECT c.id, c.name, c.college, c.faculty_id, f.name AS instructor FROM courses c LEFT JOIN users f ON f.id = c.faculty_id';
    if ($u['role'] === 'faculty') $courses = q($sql . ' WHERE c.faculty_id = ? ORDER BY c.name', [$u['id']])->fetchAll();
    // students: a course linked to Classroom is shown only to students on its class list; other courses are open to all
    elseif ($u['role'] === 'student') $courses = q($sql . ' WHERE NOT EXISTS (SELECT 1 FROM classroom_roster r WHERE r.course_id = c.id)
        OR EXISTS (SELECT 1 FROM classroom_roster r WHERE r.course_id = c.id AND r.email = ?) ORDER BY c.name', [$u['email']])->fetchAll();
    else $courses = q($sql . ' ORDER BY c.name')->fetchAll();
    $students = (int)q('SELECT COUNT(*) FROM users WHERE role = "student" AND status = "active"')->fetchColumn();
    foreach ($courses as &$c) {
        $staff = $u['role'] !== 'student';
        // with a class list: the students on it; without one, every student can open the course
        $onList = $staff ? (int)q('SELECT COUNT(*) FROM classroom_roster WHERE course_id = ?', [$c['id']])->fetchColumn() : 0;
        $c['students'] = $staff ? ($onList ?: $students) : null;
        $c['class_list'] = $staff ? $onList > 0 : null;
        $c['modules'] = q('SELECT id, position, title, published FROM modules WHERE course_id = ?' . ($staff ? '' : ' AND published = 1') . ' ORDER BY position', [$c['id']])->fetchAll();
        foreach ($c['modules'] as &$m) {
            $m['published'] = (bool)$m['published'];
            $m['files'] = $staff ? q('SELECT id, original_name AS name, size_bytes AS size, status, error, (stored_name IS NOT NULL) AS has_original, EXISTS(SELECT 1 FROM classroom_items ci WHERE ci.material_id = materials.id) AS from_classroom, created_at FROM materials WHERE module_id = ? ORDER BY id', [$m['id']])->fetchAll() : [];
        }
    }
    out(['courses' => $courses]);
}

// One module's text, as the AI reads it, plus its files. Students: published modules of courses they can see.
if ($act === 'module_text') {
    $m = q('SELECT id, course_id, position, title, published FROM modules WHERE id = ?', [(int)($_GET['id'] ?? 0)])->fetch();
    if (!$m) fail('not_found', 404);
    $ok = $u['role'] === 'student' ? $m['published'] && student_can_see($u, $m['course_id']) : can_manage($u, $m['course_id']);
    if (!$ok) fail('forbidden', 403);
    $files = q('SELECT id, original_name AS name, (stored_name IS NOT NULL) AS has_original, extracted_text FROM materials WHERE module_id = ? AND status = "ready" ORDER BY id', [$m['id']])->fetchAll();
    out(['title' => $m['title'], 'position' => (int)$m['position'],
         'text' => implode("\n\n", array_filter(array_map(fn($f) => trim((string)$f['extracted_text']), $files))),
         'files' => array_map(fn($f) => ['id' => (int)$f['id'], 'name' => $f['name'], 'download' => (bool)$f['has_original']], $files)]);
}

if ($u['role'] === 'student') fail('forbidden', 403);

if ($act === 'create_course') {
    $a = need('admin');
    $id = strtolower(trim($b['id'] ?? ''));
    if (!preg_match('/^[a-z0-9-]{2,40}$/', $id) || trim($b['name'] ?? '') === '') fail('bad_course');
    if (q('SELECT 1 FROM courses WHERE id = ?', [$id])->fetch()) fail('course_exists', 409);
    q('INSERT INTO courses (id, name, college, faculty_id) VALUES (?,?,?,?)', [$id, trim($b['name']), trim($b['college'] ?? ''), $b['faculty_id'] ?? null]);
    audit($a, 'Created course ' . trim($b['name']));
    out(['id' => $id, 'kb' => export_modules()], 201);
}
if ($act === 'assign') {
    $a = need('admin');
    $f = $b['faculty_id'] ? q('SELECT name FROM users WHERE id = ? AND role = "faculty"', [$b['faculty_id']])->fetchColumn() : null;
    if ($b['faculty_id'] && !$f) fail('not_faculty');
    $cn = q('SELECT name FROM courses WHERE id = ?', [$b['course_id'] ?? ''])->fetchColumn();
    if (!$cn) fail('not_found', 404);
    q('UPDATE courses SET faculty_id = ? WHERE id = ?', [$b['faculty_id'] ?: null, $b['course_id']]);
    audit($a, $f ? "Assigned $f to $cn" : "Removed the instructor from $cn");
    out(['ok' => true]);
}
if ($act === 'update_course') {
    $a = need('admin');
    $n = trim($b['name'] ?? ''); if ($n === '') fail('bad_course');
    q('UPDATE courses SET name = ?, college = ? WHERE id = ?', [$n, trim($b['college'] ?? ''), $b['course_id'] ?? '']);
    audit($a, "Edited course $n");
    out(['kb' => export_modules()]);
}
if ($act === 'delete_course') {
    $a = need('admin');
    $c = q('SELECT id, name FROM courses WHERE id = ?', [$b['course_id'] ?? ''])->fetch();
    if (!$c) fail('not_found', 404);
    foreach (glob("$ROOT/storage/uploads/{$c['id']}/*") ?: [] as $f) @unlink($f);
    @rmdir("$ROOT/storage/uploads/{$c['id']}");
    q('DELETE FROM courses WHERE id = ?', [$c['id']]);      // modules, materials and Classroom links go with it
    foreach (glob("$ROOT/modules/{$c['id']}/*.md") ?: [] as $f) @unlink($f);
    @rmdir("$ROOT/modules/{$c['id']}");
    audit($a, 'Deleted course ' . $c['name']);
    out(['kb' => export_modules()]);
}
if (in_array($act, ['update_course', 'delete_course'])) fail('forbidden', 403);
if ($act === 'add_module') {
    $cid = $b['course_id'] ?? ''; if (!can_manage($u, $cid)) fail('forbidden', 403);
    $t = trim(preg_replace('/\s+/', ' ', $b['title'] ?? '')); if ($t === '' || mb_strlen($t) > 160) fail('bad_title');
    $pos = (int)q('SELECT COALESCE(MAX(position), 0) + 1 FROM modules WHERE course_id = ?', [$cid])->fetchColumn();
    q('INSERT INTO modules (course_id, position, title, published) VALUES (?,?,?,0)', [$cid, $pos, $t]);   // hidden until the teacher publishes
    out(['id' => db()->lastInsertId(), 'position' => $pos], 201);
}

// the rest work on one existing module
$mid = (int)($b['module_id'] ?? 0); $cid = module_course($mid);
if (!can_manage($u, $cid)) fail('forbidden', 403);

if ($act === 'rename_module') {
    $t = trim(preg_replace('/\s+/', ' ', $b['title'] ?? '')); if ($t === '' || mb_strlen($t) > 160) fail('bad_title');
    q('UPDATE modules SET title = ? WHERE id = ?', [$t, $mid]);
    out(['kb' => export_modules()]);
}
if ($act === 'publish') {
    q('UPDATE modules SET published = ? WHERE id = ?', [empty($b['published']) ? 0 : 1, $mid]);
    out(['kb' => export_modules()]);
}
if ($act === 'delete_module') {
    foreach (q('SELECT stored_name FROM materials WHERE module_id = ? AND stored_name IS NOT NULL', [$mid])->fetchAll(PDO::FETCH_COLUMN) as $f) @unlink("$ROOT/storage/uploads/$cid/$f");
    q('DELETE FROM modules WHERE id = ?', [$mid]);
    out(['kb' => export_modules()]);
}
fail('unknown_action', 404);
