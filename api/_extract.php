<?php
// Pulls plain text out of an uploaded file. Throws RuntimeException with a short reason when it cannot.
function extract_text($path, $ext) {
    if (($ext === 'docx' || $ext === 'pptx') && !class_exists('ZipArchive'))
        throw new RuntimeException('Word and PowerPoint reading is not set up on this server (turn on extension=zip in php.ini, then restart Laragon)');
    if ($ext === 'docx') $t = zip_xml_text($path, ['word/document.xml'], '</w:p>', "\n\n");
    elseif ($ext === 'pptx') {
        $z = new ZipArchive;
        if ($z->open($path) !== true) throw new RuntimeException('Could not open the file');
        $names = [];
        for ($i = 0; $i < $z->numFiles; $i++) if (preg_match('#^ppt/slides/slide\d+\.xml$#', $z->getNameIndex($i))) $names[] = $z->getNameIndex($i);
        $z->close();
        natsort($names);
        $t = zip_xml_text($path, $names, '</a:p>', "\n");        // one slide = one block; its lines stay together
    }
    elseif ($ext === 'pdf') $t = pdf_text($path);
    elseif ($ext === 'md' || $ext === 'txt') {
        $t = file_get_contents($path);
        if (!mb_check_encoding($t, 'UTF-8')) $t = mb_convert_encoding($t, 'UTF-8', 'Windows-1252');
        $t = preg_replace('/^\s*#\s+Module\s+\d+.*\n/', '', $t);  // the export adds its own "# Module N: Title" line
    }
    else throw new RuntimeException('Unsupported file type');
    $t = clean_text($t, $ext === 'pdf');
    if ($ext !== 'md') $t = preg_replace('/^(#{1,3})(\s)/m', "$1\u{200B}$2", $t);   // a "# of students" line must not become a heading
    if (mb_strlen($t) < 40) throw new RuntimeException('No readable text found (a scanned file?). Upload a text-based version.');
    return $t;
}

// Reads the XML parts of an Office file. Each paragraph end ($endTag) becomes $sep; slides/pages are joined by a blank line.
function zip_xml_text($path, $parts, $endTag, $sep) {
    $z = new ZipArchive;
    if ($z->open($path) !== true) throw new RuntimeException('Could not open the file');
    $pages = [];
    foreach ($parts as $p) {
        $st = $z->statName($p);
        if (!$st || $st['size'] > 30 * 1048576) continue;
        $x = $z->getFromName($p);
        $x = str_replace([$endTag, '<w:br/>', '<w:tab/>'], [$sep, "\n", ' '], $x);
        $pages[] = trim(html_entity_decode(strip_tags($x), ENT_QUOTES | ENT_XML1, 'UTF-8'));
    }
    $z->close();
    return implode("\n\n", array_filter($pages));
}

// Where the pdftotext program is: PDFTOTEXT in .env, the PATH, or a few usual places. Apache/PHP on Windows often
// doesn't have Git's folders on its PATH, even when pdftotext works in Git Bash. '' = not found.
function pdftotext_path() {
    $set = function_exists('env') ? env('PDFTOTEXT') : '';
    if ($set) return is_file($set) ? $set : '';
    $win = stripos(PHP_OS, 'WIN') === 0;
    exec(($win ? 'where pdftotext' : 'command -v pdftotext') . ' 2>&1', $o, $rc);
    if ($rc === 0 && !empty($o[0]) && is_file(trim($o[0]))) return trim($o[0]);
    $places = $win ? array_merge(['C:/Program Files/Git/ucrt64/bin/pdftotext.exe', 'C:/Program Files/Git/mingw64/bin/pdftotext.exe'],
        glob('C:/laragon/bin/poppler*/{Library/bin,bin}/pdftotext.exe', GLOB_BRACE) ?: [], glob('C:/poppler*/{Library/bin,bin}/pdftotext.exe', GLOB_BRACE) ?: [])
        : ['/usr/bin/pdftotext', '/usr/local/bin/pdftotext', '/opt/homebrew/bin/pdftotext'];
    foreach ($places as $f) if (is_file($f)) return $f;
    return '';
}

function pdf_text($path) {
    // 1) the pdftotext program (-layout keeps each printed line and table row)  2) the smalot/pdfparser package, if installed with composer
    if ($exe = pdftotext_path()) {
        $p = proc_open([$exe, '-layout', '-enc', 'UTF-8', $path, '-'], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);   // stderr kept apart so an error message is never mistaken for text
        $t = stream_get_contents($pipes[1]); fclose($pipes[1]); fclose($pipes[2]);
        if (proc_close($p) !== 0) throw new RuntimeException('Could not read this PDF (damaged or password-protected?)');
        return str_replace("\f", "\n\n", (string)$t);
    }
    $auto = dirname(__DIR__) . '/vendor/autoload.php';
    if (is_file($auto)) require_once $auto;
    if (class_exists('Smalot\PdfParser\Parser')) return (new Smalot\PdfParser\Parser)->parseFile($path)->getText();
    throw new RuntimeException('PDF reading is not set up on this server (install Git for Windows or Poppler, or set PDFTOTEXT in .env)');
}

function clean_text($t, $isPdf = false) {
    $t = str_replace(["\r\n", "\r"], "\n", $t);
    // invisible marks (zero-width spaces from Google Docs, soft hyphens), unreadable symbols, emoji
    $t = preg_replace('/[\x{200B}-\x{200D}\x{2060}\x{FEFF}\x{00AD}\x{FFFD}\x{E000}-\x{F8FF}\x{1F000}-\x{1FAFF}\x{FE0F}]/u', '', $t);
    if ($isPdf) $t = preg_replace('/(?<=\S)[ \x{00A0}]{3,}(?=\S)/u', ' | ', $t);      // -layout: a wide gap inside a line separates table columns
    $t = preg_replace('/[ \t\x{00A0}]+/u', ' ', $t);
    $t = preg_replace('/ *\n */', "\n", $t);
    if ($isPdf) $t = pdf_lines($t);
    return trim(preg_replace("/\n{3,}/", "\n\n", $t));
}

// A PDF gives one line per printed line. Join the lines of a sentence again, but keep list items and headings on
// their own line, and turn bullet marks into "- " (the module viewer and the AI read that as a list).
function pdf_lines($t) {
    $bullet = '/^(?:[●•▪◦○■□➢➤►▸✓✔∙·*–-]|o(?= ))\s*/u';
    $item = '/^(?:\d{1,2}[.)]|[A-Za-z][.)]|[IVX]{1,5}\.)\s/u';        // 1.  a)  B.  IV.
    $out = [];
    $t = preg_replace('/ [●•▪](?: +(?=\S)|\n)/u', "\n• ", $t);         // a bullet in the middle or at the end of a line starts a new item
    foreach (explode("\n\n", $t) as $block) {
        $lines = [];
        foreach (explode("\n", $block) as $l) {
            $l = trim($l);
            if ($l === '' || !preg_match('/[\p{L}\p{N}]/u', $l)) continue;   // nothing readable left (a formula drawn with symbols)
            $isBullet = preg_match($bullet, $l) && mb_strlen($l) > 2;
            if ($isBullet) $l = '- ' . preg_replace($bullet, '', $l);
            $prev = $lines ? end($lines) : null;
            $newLine = $prev === null || $isBullet || preg_match($item, $l)
                || mb_strlen($prev) < 45 && !preg_match('/[,(–-]$/u', $prev)       // a short line: a heading, or a paragraph's last line
                || preg_match('/[:?]$/', $prev);
            if ($newLine) $lines[] = $l; else $lines[key($lines)] .= ' ' . $l;
        }
        if ($lines) $out[] = implode("\n", $lines);
    }
    return implode("\n\n", $out);
}
