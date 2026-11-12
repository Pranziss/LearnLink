<?php
// Shared by every api/*.php: .env, database, session, JSON helpers, login checks.
header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/_env.php';

function out($data, $code = 200) { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE); exit; }
function fail($error, $code = 400, $extra = []) { out(['error' => $error] + $extra, $code); }
function body() { return json_decode(file_get_contents('php://input'), true) ?: []; }

set_exception_handler(function ($e) {
    error_log('LearnLink API: ' . $e->getMessage());
    fail(env('DEBUG') ? $e->getMessage() : 'server_error', 500);
});

// A POST must carry this header. A form on another site cannot add it, so it cannot act as the logged-in user.
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') !== 'learnlink') fail('bad_request', 400);

session_name('learnlink');
session_set_cookie_params(['path' => '/', 'httponly' => true, 'samesite' => 'Lax']);
session_start();

function me() {
    if (empty($_SESSION['uid'])) return null;
    $u = q('SELECT id, role, name, username, email, student_id, college, program, year_level, section, status, created_at FROM users WHERE id = ?', [$_SESSION['uid']])->fetch();
    return $u && $u['status'] === 'active' ? $u : null;
}
// need() = must be logged in; need('faculty','admin') = and must have one of these roles.
function need(...$roles) {
    $u = me();
    if (!$u) fail('not_logged_in', 401);
    if ($roles && !in_array($u['role'], $roles)) fail('forbidden', 403);
    return $u;
}
// Record an action in the audit log (actions only, never chat content).
function audit($u, $text) {
    q('INSERT INTO audit_log (user_id, actor, action) VALUES (?,?,?)', [$u['id'] ?? null, $u ? ucfirst($u['role']) . ' · ' . $u['name'] : 'System', mb_substr($text, 0, 255)]);
}
// Faculty manage only their own courses. Admin manages all.
function can_manage($u, $courseId) {
    if ($u['role'] === 'admin') return true;
    return $u['role'] === 'faculty' && q('SELECT 1 FROM courses WHERE id = ? AND faculty_id = ?', [$courseId, $u['id']])->fetch() !== false;
}
