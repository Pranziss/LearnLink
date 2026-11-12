<?php
// A user's chat history. The browser sends one finished question + answer; both are saved and the answer's id is returned (needed for feedback).
require __DIR__ . '/_boot.php';
$act = $_GET['action'] ?? 'list';
$u = need();
$b = body();

function own_chat($id, $uid) {
    $c = q('SELECT id, title, course_id FROM chats WHERE id = ? AND user_id = ?', [$id, $uid])->fetch();
    if (!$c) fail('not_found', 404);
    return $c;
}

// Data Privacy Act (RA 10173): a student can download everything LearnLink keeps about them, or delete their chats.
if ($act === 'export') {
    $acct = q('SELECT role, name, username, email, student_id, college, program, year_level, section, status, created_at, last_login_at FROM users WHERE id = ?', [$u['id']])->fetch();
    $chats = q('SELECT id, title, course_id, created_at, updated_at FROM chats WHERE user_id = ? ORDER BY id', [$u['id']])->fetchAll();
    foreach ($chats as &$c) {
        $c['messages'] = q('SELECT m.role, m.content, m.mode, m.sources, m.created_at, f.rating, f.reason, f.comment FROM messages m LEFT JOIN feedback f ON f.message_id = m.id AND f.user_id = ? WHERE m.chat_id = ? ORDER BY m.id', [$u['id'], $c['id']])->fetchAll();
        foreach ($c['messages'] as &$m) { $m['sources'] = $m['sources'] ? json_decode($m['sources'], true) : []; if ($m['rating'] === null) unset($m['rating'], $m['reason'], $m['comment']); }
        unset($c['id']);
    }
    audit($u, 'Downloaded their own data');
    header('Content-Disposition: attachment; filename="learnlink-my-data-' . date('Y-m-d') . '.json"');
    echo json_encode(['exported_at' => date('c'), 'about' => 'Everything LearnLink stores about your account: your profile, your chats, and the ratings you gave.',
        'account' => $acct, 'chats' => $chats], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
if ($act === 'delete_all') {
    $n = q('DELETE FROM chats WHERE user_id = ?', [$u['id']])->rowCount();      // messages and ratings go with them
    audit($u, "Deleted all of their chats ($n)");
    out(['ok' => true, 'deleted' => $n]);
}

if ($act === 'list') {
    out(['chats' => q('SELECT id, title, course_id, updated_at FROM chats WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100', [$u['id']])->fetchAll()]);
}

if ($act === 'open') {
    $c = own_chat($_GET['id'] ?? 0, $u['id']);
    $m = q('SELECT m.id, m.role, m.content, m.mode, m.sources, m.retrieval, f.rating FROM messages m LEFT JOIN feedback f ON f.message_id = m.id AND f.user_id = ? WHERE m.chat_id = ? ORDER BY m.id', [$u['id'], $c['id']])->fetchAll();
    foreach ($m as &$x) { $x['sources'] = $x['sources'] ? json_decode($x['sources'], true) : []; $x['rating'] = $x['rating'] === null ? 0 : (int)$x['rating']; }
    out(['chat' => $c, 'messages' => $m]);
}

if ($act === 'save') {
    $qs = trim((string)($b['q'] ?? '')); $text = (string)($b['text'] ?? ''); $meta = $b['meta'] ?? []; $t = $b['timings'] ?? [];
    if ($qs === '') fail('empty_question');
    $mode = in_array($meta['mode'] ?? '', ['grounded', 'general', 'chat', 'none']) ? $meta['mode'] : null;
    $src = [];                                    // keep only what the answer panel needs
    foreach (array_slice((array)($meta['sources'] ?? []), 0, 5) as $s) $src[] = ['n' => (int)($s['n'] ?? 0), 'title' => mb_substr((string)($s['title'] ?? ''), 0, 160), 'course' => mb_substr((string)($s['course'] ?? ''), 0, 120), 'text' => mb_substr((string)($s['text'] ?? ''), 0, 1000), 'bm25' => (float)($s['bm25'] ?? 0), 'dense' => (float)($s['dense'] ?? 0)];
    $cid = $src ? q('SELECT id FROM courses WHERE name = ?', [$src[0]['course']])->fetchColumn() ?: null : null;

    db()->beginTransaction();
    if (!empty($b['chat_id'])) { $chat = own_chat($b['chat_id'], $u['id']); $chatId = $chat['id']; q('UPDATE chats SET updated_at = NOW() WHERE id = ?', [$chatId]); }
    else { q('INSERT INTO chats (user_id, course_id, title) VALUES (?,?,?)', [$u['id'], $cid, mb_substr($qs, 0, 40)]); $chatId = db()->lastInsertId(); }
    q('INSERT INTO messages (chat_id, role, content) VALUES (?, "user", ?)', [$chatId, mb_substr($qs, 0, 500)]);
    q('INSERT INTO messages (chat_id, role, content, course_id, mode, sources, retrieval, model, retrieve_ms, queue_ms, generate_ms) VALUES (?, "assistant", ?,?,?,?,?,?,?,?,?)',
      [$chatId, mb_substr($text, 0, 4000), $cid, $mode, json_encode($src, JSON_UNESCAPED_UNICODE), $meta['retrieval'] ?? null, mb_substr((string)($meta['model'] ?? ''), 0, 80), $t['retrieveMs'] ?? null, $t['queueMs'] ?? null, $t['generateMs'] ?? null]);
    $mid = db()->lastInsertId();
    db()->commit();
    out(['chat_id' => (int)$chatId, 'message_id' => (int)$mid], 201);
}

if ($act === 'rename') {
    $c = own_chat($b['id'] ?? 0, $u['id']);
    $t = mb_substr(trim((string)($b['title'] ?? '')), 0, 80); if ($t === '') fail('bad_title');
    q('UPDATE chats SET title = ? WHERE id = ?', [$t, $c['id']]);
    out(['ok' => true]);
}
if ($act === 'delete') {
    $c = own_chat($b['id'] ?? 0, $u['id']);
    q('DELETE FROM chats WHERE id = ?', [$c['id']]);
    out(['ok' => true]);
}
fail('unknown_action', 404);
