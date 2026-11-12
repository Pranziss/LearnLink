<?php
// Students rate answers (helpful / not helpful + reason). Faculty read the totals and the poorly rated questions. Ratings are anonymous.
require __DIR__ . '/_boot.php';
$act = $_GET['action'] ?? '';
$u = need();
$b = body();

if ($act === 'rate') {
    $mid = (int)($b['message_id'] ?? 0); $r = (int)($b['rating'] ?? 0);
    $own = q('SELECT 1 FROM messages m JOIN chats c ON c.id = m.chat_id WHERE m.id = ? AND m.role = "assistant" AND c.user_id = ?', [$mid, $u['id']])->fetch();
    if (!$own) fail('not_found', 404);
    if ($r === 0) { q('DELETE FROM feedback WHERE message_id = ? AND user_id = ?', [$mid, $u['id']]); out(['ok' => true]); }
    if ($r !== 1 && $r !== -1) fail('bad_rating');
    q('INSERT INTO feedback (message_id, user_id, rating, reason, comment) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE rating = VALUES(rating), reason = VALUES(reason), comment = VALUES(comment)',
      [$mid, $u['id'], $r, $r === -1 ? mb_substr((string)($b['reason'] ?? ''), 0, 60) ?: null : null, $r === -1 ? mb_substr((string)($b['comment'] ?? ''), 0, 500) ?: null : null]);
    out(['ok' => true]);
}

if ($act === 'summary') {
    need('faculty', 'admin');
    $days = max(1, min(365, (int)($_GET['days'] ?? 7)));
    $w = 'f.created_at >= NOW() - INTERVAL ' . $days . ' DAY'; $args = [];
    if ($u['role'] === 'faculty') { $w .= ' AND m.course_id IN (SELECT id FROM courses WHERE faculty_id = ?)'; $args[] = $u['id']; }
    if (!empty($_GET['course'])) { $w .= ' AND m.course_id = ?'; $args[] = $_GET['course']; }
    $tot = q("SELECT SUM(f.rating = 1) AS up, SUM(f.rating = -1) AS down FROM feedback f JOIN messages m ON m.id = f.message_id WHERE $w", $args)->fetch();
    $poor = q("SELECT m.course_id, f.reason, f.comment, f.created_at,
                 (SELECT content FROM messages u WHERE u.chat_id = m.chat_id AND u.id < m.id AND u.role = 'user' ORDER BY u.id DESC LIMIT 1) AS question
               FROM feedback f JOIN messages m ON m.id = f.message_id WHERE f.rating = -1 AND $w ORDER BY f.created_at DESC LIMIT 100", $args)->fetchAll();
    out(['up' => (int)$tot['up'], 'down' => (int)$tot['down'], 'poor' => $poor]);
}
fail('unknown_action', 404);
