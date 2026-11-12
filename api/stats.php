<?php
// Anonymous statistics from saved chats, for the faculty Insights tab and the admin overview.
// A question belongs to a course when its answer came from that course's modules, or when it was asked
// in a chat that belongs to that course. Greetings and small talk are not counted. No names are returned.
require __DIR__ . '/_boot.php';
$act = $_GET['action'] ?? 'course';
$u = need('faculty', 'admin');

const ST_STOP = ['what', 'when', 'where', 'which', 'with', 'that', 'this', 'from', 'about', 'does', 'have', 'there', 'their', 'they',
  'your', 'into', 'than', 'then', 'them', 'these', 'those', 'explain', 'define', 'difference', 'between', 'tell', 'give', 'example',
  'examples', 'meaning', 'means', 'mean', 'important', 'importance', 'please', 'help', 'know', 'want', 'like', 'thing', 'things',
  'simple', 'simply', 'would', 'could', 'should', 'how', 'why', 'also', 'more', 'some', 'many', 'much', 'used', 'using', 'kaya', 'yung', 'ano', 'paano'];

function st_days($n) {                          // the last $n dates, oldest first, as Y-m-d
    $a = []; for ($i = $n - 1; $i >= 0; $i--) $a[] = date('Y-m-d', strtotime("-$i day")); return $a;
}
function st_terms($q) {
    preg_match_all('/[a-z][a-z0-9\-]{3,}/', strtolower($q), $m);
    return array_values(array_unique(array_filter($m[0], fn($w) => !in_array($w, ST_STOP))));
}
function st_module_index($title, $mods) {        // "Module 3: Risk Management" -> index in the course's module list
    $t = strtolower(trim(preg_replace('/^Module\s+\d+\s*:\s*/i', '', (string)$title)));
    foreach ($mods as $i => $m) if (strtolower($m['title']) === $t) return $i;
    return -1;
}
function st_not_found($row) {
    return in_array($row['mode'], ['general', 'none']) || ($row['mode'] === 'grounded' && stripos($row['content'], "couldn't find that in your course modules") === 0)
        || ($row['mode'] === 'grounded' && stripos($row['content'], 'I couldn’t find that in your course modules') === 0);
}

// Everything the Insights tab needs for one window of days.
function st_window($rows, $mods, $n) {
    $from = date('Y-m-d', strtotime('-' . ($n - 1) . ' day'));
    $rows = array_values(array_filter($rows, fn($r) => substr($r['created_at'], 0, 10) >= $from));
    $days = array_fill_keys(st_days($n), ['t' => 0, 'm' => 0]);
    $terms = []; $termMods = []; $gaps = []; $poor = []; $use = array_fill(0, count($mods), 0); $cites = 0;
    foreach ($rows as $r) {
        $d = substr($r['created_at'], 0, 10);
        $miss = st_not_found($r);
        if (isset($days[$d])) { $days[$d]['t']++; if (!$miss) $days[$d]['m']++; }
        $src = json_decode($r['sources'] ?: '[]', true) ?: [];
        $first = $src ? st_module_index($src[0]['title'] ?? '', $mods) : -1;
        if (!$miss) foreach ($src as $s) { $i = st_module_index($s['title'] ?? '', $mods); if ($i > -1) { $use[$i]++; $cites++; } }
        $q = trim((string)$r['q']);
        if ($q === '') continue;
        if ($miss) { $k = mb_strtolower(rtrim($q, " ?.!")); $gaps[$k] = ($gaps[$k] ?? ['q' => $q, 'n' => 0]); $gaps[$k]['n']++; }
        else foreach (st_terms($q) as $w) { $terms[$w] = ($terms[$w] ?? 0) + 1; if ($first > -1) $termMods[$w][$first] = ($termMods[$w][$first] ?? 0) + 1; }
        if ((int)$r['rating'] === -1) {
            $k = mb_strtolower($q) . '|' . $r['reason'];
            $poor[$k] = $poor[$k] ?? ['q' => $q, 'why' => $r['reason'] ?: 'Not helpful', 'n' => 0, 'mi' => max(0, $first)];
            $poor[$k]['n']++;
        }
    }
    arsort($terms);
    $top = [];
    foreach (array_slice($terms, 0, 5, true) as $w => $n2) {
        $mm = $termMods[$w] ?? [0 => 0]; arsort($mm);
        $top[] = [ucfirst($w), $n2, (int)array_key_first($mm)];
    }
    usort($gaps, fn($a, $b) => $b['n'] <=> $a['n']);
    usort($poor, fn($a, $b) => $b['n'] <=> $a['n']);
    return [
        'days' => array_map(fn($d, $v) => ['d' => $d, 't' => $v['t'], 'm' => $v['m']], array_keys($days), $days),
        'top' => $top,
        'gaps' => array_map(fn($g) => [$g['q'], $g['n']], array_slice($gaps, 0, 5)),
        'poor' => array_map(fn($p) => [$p['q'], $p['why'], $p['n'], $p['mi']], array_slice($poor, 0, 10)),
        'use' => array_map(fn($x) => $cites ? (int)round($x / $cites * 100) : 0, $use),
    ];
}

// Answers in the last 30 days, with the question that came before each one and any rating.
function st_rows($courseId = null) {
    $sql = 'SELECT a.created_at, a.mode, a.course_id, c.course_id AS chat_course, a.sources, a.content, uq.content AS q, f.rating, f.reason
            FROM messages a JOIN chats c ON c.id = a.chat_id
            LEFT JOIN messages uq ON uq.id = a.id - 1 AND uq.chat_id = a.chat_id AND uq.role = "user"
            LEFT JOIN feedback f ON f.message_id = a.id
            WHERE a.role = "assistant" AND (a.mode IS NULL OR a.mode <> "chat") AND a.created_at >= CURDATE() - INTERVAL 29 DAY';
    if ($courseId === null) return q($sql)->fetchAll();
    return q($sql . ' AND (a.course_id = ? OR (a.course_id IS NULL AND c.course_id = ?))', [$courseId, $courseId])->fetchAll();
}

if ($act === 'course') {
    $cid = $_GET['course_id'] ?? '';
    if (!can_manage($u, $cid)) fail('forbidden', 403);
    $mods = q('SELECT id, title FROM modules WHERE course_id = ? ORDER BY position', [$cid])->fetchAll();
    $rows = st_rows($cid);
    out(['w7' => st_window($rows, $mods, 7), 'w30' => st_window($rows, $mods, 30)]);
}

// Totals for every course this user can see (faculty: own courses; admin: all), plus active students.
if ($act === 'overview') {
    $courses = $u['role'] === 'admin' ? q('SELECT id, name FROM courses ORDER BY name')->fetchAll() : q('SELECT id, name FROM courses WHERE faculty_id = ? ORDER BY name', [$u['id']])->fetchAll();
    $rows = st_rows();
    $days = array_fill_keys(st_days(30), ['t' => 0, 'm' => 0]);
    $per = [];
    $mine = array_flip(array_column($courses, 'id'));
    foreach ($rows as $r) {
        $c = $r['course_id'] ?: $r['chat_course'];
        if ($u['role'] !== 'admin' && !isset($mine[$c])) continue;
        $d = substr($r['created_at'], 0, 10);
        $miss = st_not_found($r);
        if (isset($days[$d])) { $days[$d]['t']++; if (!$miss) $days[$d]['m']++; }
        if ($c) { $per[$c] = $per[$c] ?? ['t' => 0, 'm' => 0]; $per[$c]['t']++; if (!$miss) $per[$c]['m']++; }
    }
    // per course for 7 and 30 days, today's answer sources and busy hours, top terms this week, active students
    $c7 = []; $from7 = date('Y-m-d', strtotime('-6 day')); $today = date('Y-m-d');
    $modes = ['grounded' => 0, 'general' => 0, 'none' => 0]; $hours = array_fill(0, 16, 0); $terms = [];
    foreach ($rows as $r) {
        $c = $r['course_id'] ?: $r['chat_course'];
        if ($u['role'] !== 'admin' && !isset($mine[$c])) continue;
        $d = substr($r['created_at'], 0, 10); $miss = st_not_found($r);
        if ($d >= $from7) {
            if ($c) { $c7[$c] = $c7[$c] ?? ['t' => 0, 'm' => 0]; $c7[$c]['t']++; if (!$miss) $c7[$c]['m']++; }
            if (!$miss) foreach (st_terms((string)$r['q']) as $w) $terms[$w] = ($terms[$w] ?? 0) + 1;
        }
        if ($d === $today) {
            $modes[$miss ? ($r['mode'] === 'general' ? 'general' : 'none') : 'grounded']++;
            $h = (int)substr($r['created_at'], 11, 2) - 6; if ($h >= 0 && $h < 16) $hours[$h]++;
        }
    }
    arsort($terms);
    $names = array_column(q('SELECT id, name FROM courses')->fetchAll(), 'name', 'id');
    $active = fn($n) => (int)q('SELECT COUNT(DISTINCT c.user_id) FROM messages m JOIN chats c ON c.id = m.chat_id WHERE m.role = "user" AND m.created_at >= CURDATE() - INTERVAL ' . ($n - 1) . ' DAY')->fetchColumn();
    out([
        'days' => array_map(fn($d, $v) => ['d' => $d, 't' => $v['t'], 'm' => $v['m']], array_keys($days), $days),
        'names' => $names,
        'courses7' => $c7,
        'modes' => $modes, 'hours' => $hours,
        'terms' => array_map(fn($w, $n) => [ucfirst($w), $n], array_keys(array_slice($terms, 0, 5, true)), array_slice($terms, 0, 5, true)),
        'active7' => $active(7), 'active30' => $active(30),
        'courses' => $per,
        'students' => (int)q('SELECT COUNT(*) FROM users WHERE role = "student" AND status = "active"')->fetchColumn(),
        'today' => (int)q('SELECT COUNT(*) FROM messages WHERE role = "user" AND created_at >= CURDATE()')->fetchColumn(),
    ]);
}
fail('unknown_action', 404);
