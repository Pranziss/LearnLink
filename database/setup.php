<?php
// One-time setup. Run in the Laragon terminal, inside the learnlink folder:   php database/setup.php
// Creates the database and tables, makes a .env if there is none, adds demo accounts, and imports modules/ into the database.
// Safe to run again: it only fills in what is missing.
if (PHP_SAPI !== 'cli') exit('Run this from the terminal.');
$ROOT = dirname(__DIR__);

// .env: copy the example if missing, and make sure there is a RELOAD_KEY (PHP uses it to tell Node "new materials, reload").
if (!is_file("$ROOT/.env")) copy("$ROOT/.env.example", "$ROOT/.env");
$envText = file_get_contents("$ROOT/.env");
if (!preg_match('/^RELOAD_KEY=\S+/m', $envText)) {
    $envText = preg_replace('/^RELOAD_KEY=.*\R?/m', '', $envText);
    file_put_contents("$ROOT/.env", rtrim($envText) . "\nRELOAD_KEY=" . bin2hex(random_bytes(16)) . "\n");
}
require "$ROOT/api/_env.php";

// 1. database + tables
$name = env('DB_NAME', 'learnlink');
try {
    $root = new PDO('mysql:host=' . env('DB_HOST', '127.0.0.1') . ';port=' . env('DB_PORT', '3306'), env('DB_USER', 'root'), env('DB_PASS', ''), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (Throwable $e) { exit("Cannot connect to MySQL: " . $e->getMessage() . "\nIs MySQL started in Laragon? Check DB_USER / DB_PASS in .env.\n"); }
$root->exec("CREATE DATABASE IF NOT EXISTS `$name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$sql = preg_replace('/--[^\n]*/', '', file_get_contents(__DIR__ . '/schema.sql'));
foreach (array_filter(array_map('trim', explode(';', $sql))) as $st) db()->exec($st);
echo "Database '$name' ready.\n";

// 2. demo accounts (only when there are no users yet). Passwords are random and shown once.
$made = [];
if (!q('SELECT COUNT(*) FROM users')->fetchColumn()) {
    foreach ([['admin', 'LearnLink Admin', 'admin@bisu.edu.ph'], ['faculty', 'Faculty Member', 'faculty@bisu.edu.ph'], ['student', 'Maria Santos', 'maria.santos@bisu.edu.ph']] as [$role, $n, $em]) {
        $pw = substr(bin2hex(random_bytes(8)), 0, 8) . 'a1';
        q('INSERT INTO users (role, name, username, email, password_hash, college) VALUES (?,?,?,?,?,?)', [$role, $n, $role === 'student' ? 'maria_santos' : null, $em, password_hash($pw, PASSWORD_DEFAULT), 'CCIS']);
        $made[] = "  $role: $em  /  $pw";
    }
}

// 3. import the existing modules/ folder (courses.json + the .md files) as courses, modules and materials
if (!q('SELECT COUNT(*) FROM courses')->fetchColumn()) {
    $fac = q('SELECT id FROM users WHERE role = "faculty" ORDER BY id LIMIT 1')->fetchColumn() ?: null;
    $meta = json_decode(@file_get_contents("$ROOT/modules/courses.json"), true) ?: [];
    foreach (glob("$ROOT/modules/*", GLOB_ONLYDIR) as $d) {
        $id = basename($d); $c = $meta[$id] ?? ['name' => $id, 'college' => ''];
        q('INSERT INTO courses (id, name, college, faculty_id) VALUES (?,?,?,?)', [$id, $c['name'], $c['college'], $fac]);
        $files = glob("$d/*.md"); sort($files, SORT_NATURAL);
        foreach ($files as $i => $f) {
            $md = str_replace("\r", '', file_get_contents($f));
            preg_match('/^(\d+)-/', basename($f), $pm);
            if (preg_match('/^#\s+Module\s+(\d+)\s*:\s*(.+)\n/', $md, $hm)) { $pos = (int)$hm[1]; $title = trim($hm[2]); $md = substr($md, strlen($hm[0])); }
            else { $pos = (int)($pm[1] ?? $i + 1); $title = ucfirst(str_replace('-', ' ', preg_replace('/^\d+-|\.md$/', '', basename($f)))); }
            q('INSERT INTO modules (course_id, position, title) VALUES (?,?,?)', [$id, $pos, $title]);
            $mid = db()->lastInsertId();
            q('INSERT INTO materials (module_id, uploaded_by, original_name, mime, size_bytes, extracted_text) VALUES (?,?,?,?,?,?)', [$mid, $fac, basename($f), 'text/markdown', strlen($md), trim($md)]);
        }
        echo "Imported $id (" . count($files) . " modules)\n";
    }
}

if ($made) echo "\nDemo accounts (shown once, change them after the first login):\n" . implode("\n", $made) . "\n";
echo "\nDone. Start the AI server with: npm start   then open http://localhost:" . env('PORT', '3000') . "\n";
