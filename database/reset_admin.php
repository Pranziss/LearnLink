<?php
// Forgot the admin password? Run:  php database/reset_admin.php
// Sets the admin password to a new random one and prints it. Creates an admin account if there is none.
require __DIR__ . '/../api/_env.php';

echo "Accounts in this database:\n";
foreach (q('SELECT role, email, status FROM users ORDER BY role, email')->fetchAll() as $r) echo "  {$r['role']}  {$r['email']}  ({$r['status']})\n";

$pw = substr(bin2hex(random_bytes(4)), 0, 6) . 'Ll1';
$a = q('SELECT id, email FROM users WHERE role = "admin" ORDER BY id LIMIT 1')->fetch();
if ($a) {
    q('UPDATE users SET password_hash = ?, status = "active" WHERE id = ?', [password_hash($pw, PASSWORD_DEFAULT), $a['id']]);
    $em = $a['email'];
} else {
    $em = 'admin@bisu.edu.ph';
    q('INSERT INTO users (role, name, email, password_hash) VALUES ("admin", "LearnLink Admin", ?, ?)', [$em, password_hash($pw, PASSWORD_DEFAULT)]);
}
echo "\nDone. Log in with:\n  Login type: Admin login (person button, bottom right)\n  Email:      $em\n  Password:   $pw\n";
