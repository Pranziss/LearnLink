<?php
// The AI (server.js) searches the .md files in modules/. Whenever teachers change something, rebuild them from the database
// and tell Node to reload. Only PUBLISHED modules that have at least one readable file are written.
function slug($t) { return strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $t), '-')) ?: 'module'; }

function export_modules() {
    global $ROOT;
    $dir = $ROOT . '/modules'; $meta = [];
    foreach (q('SELECT id, name, college FROM courses ORDER BY id')->fetchAll() as $c) {
        $meta[$c['id']] = ['name' => $c['name'], 'college' => $c['college']];
        if (!is_dir("$dir/{$c['id']}")) mkdir("$dir/{$c['id']}", 0777, true);
        $keep = [];
        foreach (q('SELECT id, position, title FROM modules WHERE course_id = ? AND published = 1 ORDER BY position', [$c['id']])->fetchAll() as $m) {
            $texts = array_filter(array_map('trim', q('SELECT extracted_text FROM materials WHERE module_id = ? AND status = "ready" ORDER BY id', [$m['id']])->fetchAll(PDO::FETCH_COLUMN)));
            if (!$texts) continue;
            $f = $m['position'] . '-' . slug($m['title']) . '.md';
            file_put_contents("$dir/{$c['id']}/$f", "# Module {$m['position']}: {$m['title']}\n\n" . implode("\n\n", $texts) . "\n");
            $keep[$f] = 1;
        }
        foreach (glob("$dir/{$c['id']}/*.md") as $old) if (!isset($keep[basename($old)])) unlink($old);   // hidden or deleted modules disappear from the AI
    }
    file_put_contents($dir . '/courses.json', json_encode($meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    return ping_node();
}

function ping_node() {
    $ctx = stream_context_create(['http' => ['method' => 'POST', 'timeout' => 4, 'ignore_errors' => true, 'header' => "x-reload-key: " . env('RELOAD_KEY') . "\r\nContent-Length: 0\r\n"]]);
    $r = @file_get_contents(rtrim(env('NODE_URL', 'http://127.0.0.1:3000'), '/') . '/api/reload', false, $ctx);
    return $r !== false;       // false = Node is not running. It reads the files when it starts, so nothing is lost.
}
