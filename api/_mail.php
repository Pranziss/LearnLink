<?php
// Sends a plain-text email through an SMTP server (for example a Gmail account with an App Password).
// No libraries needed. Set SMTP_* in .env (see README "Sending sign-up codes by email").
// Returns true when the server accepted the message, false otherwise (no internet, wrong password, ...). Never throws.

function mail_configured() { return env('SMTP_HOST') !== '' && env('SMTP_USER') !== '' && env('SMTP_PASS') !== ''; }

function mail_send($to, $subject, $text) {
    if (!mail_configured()) return false;
    $host = env('SMTP_HOST'); $port = (int)env('SMTP_PORT', '465'); $sec = strtolower(env('SMTP_SECURE', $port === 465 ? 'ssl' : 'tls'));
    $user = env('SMTP_USER'); $pass = str_replace(' ', '', env('SMTP_PASS'));   // Gmail shows App Passwords with spaces
    $from = env('SMTP_FROM', $user); $name = env('SMTP_FROM_NAME', 'LearnLink');
    $ctx = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true]
        + (env('GOOGLE_CA_BUNDLE') ? ['cafile' => env('GOOGLE_CA_BUNDLE')] : [])]);
    $s = @stream_socket_client(($sec === 'ssl' ? 'ssl://' : 'tcp://') . "$host:$port", $en, $es, 8, STREAM_CLIENT_CONNECT, $ctx);
    if (!$s) { error_log("LearnLink mail: cannot connect ($es)"); return false; }
    stream_set_timeout($s, 15);
    $read = function () use ($s) { $r = ''; while (($l = fgets($s, 1024)) !== false) { $r .= $l; if (strlen($l) < 4 || $l[3] === ' ') break; } return $r; };
    $cmd = function ($c, $want) use ($s, $read) { if ($c !== null) fwrite($s, $c . "\r\n"); $r = $read(); if ((int)substr($r, 0, 3) !== $want) throw new RuntimeException(trim($r) ?: 'no reply'); return $r; };
    try {
        $cmd(null, 220);
        $cmd('EHLO learnlink', 250);
        if ($sec === 'tls') {
            $cmd('STARTTLS', 220);
            if (!stream_socket_enable_crypto($s, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) throw new RuntimeException('STARTTLS failed');
            $cmd('EHLO learnlink', 250);
        }
        $cmd('AUTH LOGIN', 334); $cmd(base64_encode($user), 334); $cmd(base64_encode($pass), 235);
        $cmd("MAIL FROM:<$from>", 250);
        $cmd("RCPT TO:<$to>", 250);
        $cmd('DATA', 354);
        $body = preg_replace('/^\./m', '..', str_replace(["\r\n", "\n"], ["\n", "\r\n"], $text));
        $msg = 'From: =?UTF-8?B?' . base64_encode($name) . "?= <$from>\r\nTo: <$to>\r\nSubject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n"
             . 'Date: ' . date('r') . "\r\nMessage-ID: <" . bin2hex(random_bytes(8)) . '@learnlink>' . "\r\nMIME-Version: 1.0\r\n"
             . "Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n\r\n" . $body . "\r\n.";
        $cmd($msg, 250);
        @fwrite($s, "QUIT\r\n");
        fclose($s);
        return true;
    } catch (Throwable $e) {
        error_log('LearnLink mail: ' . $e->getMessage());
        @fclose($s);
        return false;
    }
}
