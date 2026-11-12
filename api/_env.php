<?php
// .env loader and database connection. Used by the API and by database/setup.php.
$ROOT = dirname(__DIR__);

// Same .env that server.js reads. A "# comment" after a value is ignored.
$ENV = [];
foreach (@file($ROOT . '/.env', FILE_IGNORE_NEW_LINES) ?: [] as $line) {
    if (preg_match('/^\s*([A-Z_]+)\s*=\s*(.*)$/', $line, $m)) {
        $ENV[$m[1]] = trim(trim(preg_replace('/\s+#.*$/', '', $m[2])), "\"'");
    }
}
function env($k, $d = '') { global $ENV; return $ENV[$k] ?? $d; }
date_default_timezone_set(env('TIMEZONE', 'Asia/Manila'));

function db() {
    static $pdo;
    if (!$pdo) {
        $dsn = 'mysql:host=' . env('DB_HOST', '127.0.0.1') . ';port=' . env('DB_PORT', '3306') . ';dbname=' . env('DB_NAME', 'learnlink') . ';charset=utf8mb4';
        $pdo = new PDO($dsn, env('DB_USER', 'root'), env('DB_PASS', ''), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    }
    return $pdo;
}
function q($sql, $args = []) { $st = db()->prepare($sql); $st->execute($args); return $st; }
