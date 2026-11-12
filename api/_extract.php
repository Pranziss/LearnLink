<?php
// Pulls plain text out of an uploaded file. Throws RuntimeException with a short reason when it cannot.
function extract_text($path, $ext) {
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

function pdf_text($path) {
    // 1) the pdftotext program, if installed  2) the smalot/pdfparser package, if installed with composer
    $find = stripos(PHP_OS, 'WIN') === 0 ? 'where pdftotext' : 'command -v pdftotext';
    exec($find . ' 2>&1', $o, $rc);
    if ($rc === 0) {
        $p = proc_open(['pdftotext', '-enc', 'UTF-8', $path, '-'], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);   // stderr kept apart so an error message is never mistaken for text
        $t = stream_get_contents($pipes[1]); fclose($pipes[1]); fclose($pipes[2]);
        if (proc_close($p) !== 0) throw new RuntimeException('Could not read this PDF (damaged or password-protected?)');
        return str_replace("\f", "\n\n", (string)$t);
    }
    $auto = dirname(__DIR__) . '/vendor/autoload.php';
    if (is_file($auto)) require_once $auto;
    if (class_exists('Smalot\PdfParser\Parser')) return (new Smalot\PdfParser\Parser)->parseFile($path)->getText();
    throw new RuntimeException('PDF reading is not set up on this server (run: composer require smalot/pdfparser)');
}

function clean_text($t, $joinLines = false) {
    $t = str_replace(["\r\n", "\r"], "\n", $t);
    $t = preg_replace('/[ \t\x{00A0}]+/u', ' ', $t);
    $t = preg_replace('/ *\n */', "\n", $t);
    if ($joinLines) $t = preg_replace('/(?<!\n)\n(?!\n)/', ' ', $t);      // PDF: a paragraph arrives broken into short lines
    return trim(preg_replace("/\n{3,}/", "\n\n", $t));
}
