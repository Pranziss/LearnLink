<?php
// Forgot a password and can't use the login page? Run:  php database/reset_password.php someone@bisu.edu.ph
// Sets a new random password for that account and prints it once. (Admins can also do this from Users -> Edit -> Reset password.)
if (PHP_SAPI !== 'cli') exit('Run this from the terminal.');
require __DIR__ . '/../api/_env.php';

$em = strtolower(trim($argv[1] ?? ''));
if ($em !== '' && strpos($em, '@') === false) $em .= '@bisu.edu.ph';
$u = $em ? q('SELECT id, role, name, email FROM users WHERE email = ?', [$em])->fetch() : null;
if (!$u) exit("No account found" . ($em ? " for $em" : "") . ".\nUsage: php database/reset_password.php maria.santos@bisu.edu.ph\n");

$pw = substr(bin2hex(random_bytes(4)), 0, 6) . 'Ll1';
q('UPDATE users SET password_hash = ?, status = "active" WHERE id = ?', [password_hash($pw, PASSWORD_DEFAULT), $u['id']]);
q('INSERT INTO audit_log (user_id, actor, action) VALUES (NULL, "Server terminal", ?)', ["Reset password for {$u['email']}"]);
echo "Done. {$u['name']} ({$u['role']}) can now log in with:\n  Email:    {$u['email']}\n  Password: $pw\n";
