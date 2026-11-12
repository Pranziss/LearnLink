<?php
// Google Classroom sync: sign-in (OAuth), reading Classroom and Drive, and turning attachments into drafts.
// Needs GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env (see README, "Google Classroom sync").
// Only outgoing requests are made, so the campus server never has to be reachable from the internet.

const GC_SCOPES = [
    'openid', 'email',
    'https://www.googleapis.com/auth/classroom.courses.readonly',
    'https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
    'https://www.googleapis.com/auth/classroom.topics.readonly',
    'https://www.googleapis.com/auth/classroom.rosters.readonly',     // the class list, so only enrolled students see the course
    'https://www.googleapis.com/auth/classroom.profile.emails',       // ...with their BISU emails
    'https://www.googleapis.com/auth/drive.readonly',
];

// Base URLs can be changed in .env (only needed for testing against a fake Google server).
function gc_url($which) {
    $d = ['accounts' => 'https://accounts.google.com', 'oauth' => 'https://oauth2.googleapis.com',
          'classroom' => 'https://classroom.googleapis.com', 'drive' => 'https://www.googleapis.com'];
    return rtrim(env('GOOGLE_' . strtoupper($which) . '_BASE', $d[$which]), '/');
}
function gc_configured() { return env('GOOGLE_CLIENT_ID') !== '' && env('GOOGLE_CLIENT_SECRET') !== ''; }
function gc_redirect() { return env('GOOGLE_REDIRECT_URI', 'http://localhost:' . env('PORT', '3000') . '/oauth/google'); }

class GcNetError extends RuntimeException {}   // no internet / Google unreachable
class GcAuthError extends RuntimeException {}  // the teacher's Google access is no longer valid

// One HTTP request. $form = array sends application/x-www-form-urlencoded. Returns [status, body].
function gc_http($method, $url, $token = null, $form = null, $timeout = 60) {
    $ch = curl_init($url);
    $h = ['Accept: application/json'];
    if ($token) $h[] = 'Authorization: Bearer ' . $token;
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => $h,
        CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_TIMEOUT => $timeout, CURLOPT_FOLLOWLOCATION => true]);
    if ($form !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($form));
    if (env('GOOGLE_CA_BUNDLE')) curl_setopt($ch, CURLOPT_CAINFO, env('GOOGLE_CA_BUNDLE'));
    $body = curl_exec($ch);
    if ($body === false) { $e = curl_error($ch); curl_close($ch); throw new GcNetError($e); }
    $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    return [$code, $body];
}
function gc_json($method, $url, $token = null, $form = null) {
    [$code, $body] = gc_http($method, $url, $token, $form);
    $j = json_decode($body, true) ?: [];
    if ($code === 401) throw new GcAuthError('Google sign-in expired');
    if ($code >= 400) throw new RuntimeException('Google said: ' . ($j['error']['message'] ?? $j['error_description'] ?? $j['error'] ?? "HTTP $code"));
    return $j;
}

// Quick "do we have internet" check, remembered for 60 seconds.
function gc_online() {
    $f = sys_get_temp_dir() . '/learnlink_netcheck';
    if (is_file($f) && time() - filemtime($f) < 60) return file_get_contents($f) === '1';
    try { gc_http('GET', gc_url('oauth') . '/', null, null, 4); $ok = true; } catch (GcNetError $e) { $ok = false; }
    @file_put_contents($f, $ok ? '1' : '0');
    return $ok;
}

/* ---------- sign-in ---------- */
function gc_auth_url($state, $hint) {
    return gc_url('accounts') . '/o/oauth2/v2/auth?' . http_build_query([
        'client_id' => env('GOOGLE_CLIENT_ID'), 'redirect_uri' => gc_redirect(), 'response_type' => 'code',
        'scope' => implode(' ', GC_SCOPES), 'access_type' => 'offline', 'prompt' => 'consent',
        'include_granted_scopes' => 'true', 'state' => $state, 'login_hint' => $hint, 'hd' => env('GOOGLE_HD', 'bisu.edu.ph'),
    ]);
}
function gc_exchange_code($code) {
    $t = gc_json('POST', gc_url('oauth') . '/token', null, ['code' => $code, 'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'), 'redirect_uri' => gc_redirect(), 'grant_type' => 'authorization_code']);
    // The id_token comes straight from Google's token endpoint over HTTPS, so its payload can be read without re-verifying.
    $p = explode('.', $t['id_token'] ?? '');
    $claims = isset($p[1]) ? json_decode(base64_decode(strtr($p[1], '-_', '+/')), true) : [];
    return ['refresh' => $t['refresh_token'] ?? '', 'email' => strtolower($claims['email'] ?? '')];
}
function gc_access_token($userId) {
    $r = q('SELECT refresh_token FROM google_accounts WHERE user_id = ?', [$userId])->fetchColumn();
    if (!$r) throw new GcAuthError('No Google account connected');
    [$code, $body] = gc_http('POST', gc_url('oauth') . '/token', null, ['refresh_token' => $r, 'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'), 'grant_type' => 'refresh_token']);
    $j = json_decode($body, true) ?: [];
    if ($code >= 400 || empty($j['access_token'])) throw new GcAuthError($j['error_description'] ?? $j['error'] ?? 'refresh failed');
    return $j['access_token'];
}

/* ---------- "Sign in with Google" for everyone (students too) ----------
   Only asks for name and email, so it can use its own Google project published "In production"
   (no 100-user cap, no weekly logout). Falls back to the Classroom client when no separate one is set. */
function gs_client() {
    $id = env('GOOGLE_SIGNIN_CLIENT_ID');
    return $id !== '' ? [$id, env('GOOGLE_SIGNIN_CLIENT_SECRET')] : [env('GOOGLE_CLIENT_ID'), env('GOOGLE_CLIENT_SECRET')];
}
function gs_configured() { [$i, $s] = gs_client(); return $i !== '' && $s !== ''; }
function gs_redirect() { return env('GOOGLE_SIGNIN_REDIRECT_URI', 'http://localhost:' . env('PORT', '3000') . '/oauth/signin'); }
function gs_auth_url($state) {
    return gc_url('accounts') . '/o/oauth2/v2/auth?' . http_build_query([
        'client_id' => gs_client()[0], 'redirect_uri' => gs_redirect(), 'response_type' => 'code',
        'scope' => 'openid email profile', 'prompt' => 'select_account', 'state' => $state, 'hd' => env('GOOGLE_HD', 'bisu.edu.ph'),
    ]);
}
// Returns ['email','name','verified','hd'] for the Google account that just signed in.
function gs_exchange($code) {
    [$id, $secret] = gs_client();
    $t = gc_json('POST', gc_url('oauth') . '/token', null, ['code' => $code, 'client_id' => $id, 'client_secret' => $secret,
        'redirect_uri' => gs_redirect(), 'grant_type' => 'authorization_code']);
    $p = explode('.', $t['id_token'] ?? '');
    $c = isset($p[1]) ? json_decode(base64_decode(strtr($p[1], '-_', '+/')), true) : [];
    if (($c['aud'] ?? '') !== $id) throw new RuntimeException('id_token is for another app');
    return ['email' => strtolower($c['email'] ?? ''), 'name' => trim($c['name'] ?? ''), 'verified' => !empty($c['email_verified']), 'hd' => $c['hd'] ?? ''];
}

/* ---------- reading Classroom ---------- */
function gc_list($token, $url, $key) {               // follows nextPageToken
    $all = []; $page = null;
    do {
        $j = gc_json('GET', $url . (strpos($url, '?') ? '&' : '?') . 'pageSize=100' . ($page ? '&pageToken=' . urlencode($page) : ''), $token);
        $all = array_merge($all, $j[$key] ?? []);
        $page = $j['nextPageToken'] ?? null;
    } while ($page);
    return $all;
}
function gc_classes($token) {
    return array_map(fn($c) => ['id' => $c['id'], 'name' => trim($c['name'] . (empty($c['section']) ? '' : ' · ' . $c['section']))],
        gc_list($token, gc_url('classroom') . '/v1/courses?teacherId=me&courseStates=ACTIVE', 'courses'));
}

// Students in a class: [[email, name], ...]. Needs the roster scopes (teachers who connected earlier must reconnect).
function gc_roster($token, $cid) {
    $out = [];
    foreach (gc_list($token, gc_url('classroom') . '/v1/courses/' . rawurlencode($cid) . '/students', 'students') as $s) {
        $em = strtolower($s['profile']['emailAddress'] ?? '');
        if ($em !== '') $out[] = [$em, $s['profile']['name']['fullName'] ?? null];
    }
    return $out;
}
function gc_save_roster($courseId, $rows) {
    db()->beginTransaction();
    q('DELETE FROM classroom_roster WHERE course_id = ?', [$courseId]);
    foreach ($rows as [$em, $nm]) q('INSERT IGNORE INTO classroom_roster (course_id, email, name) VALUES (?,?,?)', [$courseId, $em, $nm ? mb_substr($nm, 0, 120) : null]);
    db()->commit();
}

// Only the class's Materials (Classroom "Material" posts) are read. Assignments and announcements are never imported:
// the AI should learn only from what teachers deliberately share as learning material.
// Each post as [id, title, topicId, time, materials[], text].
function gc_posts($token, $cid) {
    $b = gc_url('classroom') . '/v1/courses/' . rawurlencode($cid);
    $posts = [];
    foreach (gc_list($token, "$b/courseWorkMaterials?courseWorkMaterialStates=PUBLISHED", 'courseWorkMaterial') as $p)
        $posts[] = ['id' => 'm' . $p['id'], 'title' => $p['title'] ?? 'Material', 'topic' => $p['topicId'] ?? null, 'time' => $p['updateTime'] ?? $p['creationTime'] ?? null, 'materials' => $p['materials'] ?? [], 'text' => $p['description'] ?? ''];
    return $posts;
}
function gc_topics($token, $cid) {
    $m = [];
    try { foreach (gc_list($token, gc_url('classroom') . '/v1/courses/' . rawurlencode($cid) . '/topics', 'topic') as $t) $m[$t['topicId']] = $t['name']; }
    catch (RuntimeException $e) {}                     // topics are only used to suggest a module
    return $m;
}

// Suggest the module whose title shares the most words with the topic and file name.
function gc_suggest_module($courseId, $topic, $title) {
    $mods = q('SELECT id, title FROM modules WHERE course_id = ? ORDER BY position', [$courseId])->fetchAll();
    if (!$mods) return null;
    $words = fn($s) => array_filter(preg_split('/[^a-z0-9]+/', strtolower($s)), fn($w) => strlen($w) > 3);
    $want = array_merge($words($topic ?? ''), $words($title));
    $best = $mods[0]['id']; $score = 0;
    foreach ($mods as $m) {
        $s = count(array_intersect($want, $words($m['title'])));
        if ($s > $score) { $score = $s; $best = $m['id']; }
    }
    return $best;
}

// Drive file -> [kind, ext, how to download] or [kind, null, reason it cannot be used]
function gc_drive_kind($mime) {
    $m = [
        'application/vnd.google-apps.document' => ['Google Doc', 'txt', 'export'],
        'application/vnd.google-apps.presentation' => ['Google Slides', 'txt', 'export'],
        'application/pdf' => ['PDF', 'pdf', 'media'],
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' => ['PPTX', 'pptx', 'media'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => ['DOCX', 'docx', 'media'],
        'text/plain' => ['Text', 'txt', 'media'], 'text/markdown' => ['Markdown', 'md', 'media'],
    ];
    if (isset($m[$mime])) return $m[$mime];
    if ($mime === 'application/vnd.google-apps.spreadsheet') return ['Google Sheet', null, 'Spreadsheets are not added. Put the content in a document instead.'];
    if (strpos($mime, 'video/') === 0) return ['Video', null, 'Videos have no text LearnLink can read'];
    if (strpos($mime, 'image/') === 0) return ['Image', null, 'Images have no text LearnLink can read'];
    if ($mime === 'application/msword' || $mime === 'application/vnd.ms-powerpoint') return ['Old Office file', null, 'Old .doc/.ppt files are not supported. Save it as .docx or .pptx.'];
    return ['File', null, 'This file type has no text LearnLink can read'];
}

/* ---------- one sync ---------- */
function gc_log($courseId, $ok, $msg) { q('INSERT INTO classroom_sync_log (course_id, ok, message) VALUES (?,?,?)', [$courseId, $ok ? 1 : 0, mb_substr($msg, 0, 255)]); }

function gc_add_item($courseId, $key, $f) {
    q('INSERT IGNORE INTO classroom_items (course_id, gc_key, title, kind, topic, posted_at, status, reason, stored_name, mime, size_bytes, extracted_text, module_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [$courseId, $key, mb_substr($f['title'], 0, 255), $f['kind'], $f['topic'] ? mb_substr($f['topic'], 0, 160) : null, $f['time'], $f['status'], $f['reason'] ?? null,
       $f['stored'] ?? null, $f['mime'] ?? null, $f['size'] ?? 0, $f['text'] ?? null, $f['module'] ?? null]);
}

// Reads the linked class and adds anything new as a draft. Returns a summary array. Never throws.
function gc_sync($courseId) {
    global $ROOT;
    @set_time_limit(600);
    $l = q('SELECT * FROM classroom_links WHERE course_id = ?', [$courseId])->fetch();
    if (!$l) return ['ok' => false, 'message' => 'not_linked'];
    $new = 0; $drafts = 0; $off = 0;
    try {
        $tok = gc_access_token($l['user_id']);
        $topics = gc_topics($tok, $l['gc_course_id']);
        // the class list: who may see this course. A token from before the roster scopes were added gets 403 here.
        $rosterNote = '';
        try { $r = gc_roster($tok, $l['gc_course_id']); gc_save_roster($courseId, $r); $rosterNote = ' · ' . count($r) . ' student' . (count($r) === 1 ? '' : 's') . ' on the class list'; }
        catch (GcAuthError $e) { throw $e; }
        catch (GcNetError $e) { throw $e; }
        catch (RuntimeException $e) { $rosterNote = ' · class list not read (reconnect Google to allow it)'; }
        $seen = array_flip(q('SELECT gc_key FROM classroom_items WHERE course_id = ?', [$courseId])->fetchAll(PDO::FETCH_COLUMN));
        $dir = "$ROOT/storage/uploads/$courseId"; if (!is_dir($dir)) mkdir($dir, 0777, true);
        foreach (gc_posts($tok, $l['gc_course_id']) as $p) {
            $topic = $p['topic'] ? ($topics[$p['topic']] ?? null) : null;
            $time = $p['time'] ? date('Y-m-d H:i:s', strtotime($p['time'])) : null;
            $base = ['topic' => $topic, 'time' => $time];
            // a long post description is itself teaching material
            if (mb_strlen(trim($p['text'])) >= 300 && !isset($seen[$p['id'] . ':text'])) {
                $new++; $drafts++;
                gc_add_item($courseId, $p['id'] . ':text', $base + ['title' => $p['title'] . ' (post text)', 'kind' => 'Classroom post', 'status' => 'draft',
                    'text' => trim($p['text']), 'size' => strlen($p['text']), 'module' => gc_suggest_module($courseId, $topic, $p['title'])]);
            }
            foreach ($p['materials'] as $m) {
                if (isset($m['driveFile'])) {
                    $d = $m['driveFile']['driveFile'] ?? [];
                    $key = $p['id'] . ':d' . ($d['id'] ?? '');
                    if (isset($seen[$key]) || empty($d['id'])) continue;
                    $new++;
                    $meta = gc_json('GET', gc_url('drive') . '/drive/v3/files/' . rawurlencode($d['id']) . '?fields=id,name,mimeType,size&supportsAllDrives=true', $tok);
                    $title = $meta['name'] ?? ($d['title'] ?? 'Drive file');
                    [$kind, $ext, $how] = gc_drive_kind($meta['mimeType'] ?? '');
                    if ($ext === null) { $off++; gc_add_item($courseId, $key, $base + ['title' => $title, 'kind' => $kind, 'status' => 'unreadable', 'reason' => $how]); continue; }
                    if (($meta['size'] ?? 0) > 25 * 1048576) { $off++; gc_add_item($courseId, $key, $base + ['title' => $title, 'kind' => $kind, 'status' => 'unreadable', 'reason' => 'Over 25 MB']); continue; }
                    $url = gc_url('drive') . '/drive/v3/files/' . rawurlencode($d['id']) . ($how === 'export' ? '/export?mimeType=text%2Fplain' : '?alt=media&supportsAllDrives=true');
                    [$code, $body] = gc_http('GET', $url, $tok);
                    if ($code >= 400) { $off++; gc_add_item($courseId, $key, $base + ['title' => $title, 'kind' => $kind, 'status' => 'unreadable', 'reason' => "Could not download it from Drive (HTTP $code)"]); continue; }
                    $stored = bin2hex(random_bytes(16)) . '.' . $ext;
                    file_put_contents("$dir/$stored", $body);
                    try {
                        $text = extract_text("$dir/$stored", $ext);
                        $drafts++;
                        gc_add_item($courseId, $key, $base + ['title' => $title, 'kind' => $kind, 'status' => 'draft', 'stored' => $stored, 'mime' => $meta['mimeType'],
                            'size' => strlen($body), 'text' => $text, 'module' => gc_suggest_module($courseId, $topic, $title)]);
                    } catch (Throwable $e) {
                        @unlink("$dir/$stored"); $off++;
                        gc_add_item($courseId, $key, $base + ['title' => $title, 'kind' => $kind, 'status' => 'unreadable', 'reason' => mb_substr($e->getMessage(), 0, 250)]);
                    }
                } else {
                    [$kind, $title, $why, $key] = isset($m['youtubeVideo']) ? ['YouTube video', $m['youtubeVideo']['title'] ?? 'Video', 'Videos have no text LearnLink can read', 'y' . ($m['youtubeVideo']['id'] ?? '')]
                        : (isset($m['form']) ? ['Google Form', $m['form']['title'] ?? 'Form', 'Quizzes and forms stay in Classroom', 'f' . ($m['form']['formUrl'] ?? '')]
                        : (isset($m['link']) ? ['Link', $m['link']['title'] ?? $m['link']['url'] ?? 'Link', 'Links to websites are not added', 'l' . ($m['link']['url'] ?? '')]
                        : ['Attachment', 'Attachment', 'This attachment type is not supported', 'x' . md5(json_encode($m))]));
                    $key = $p['id'] . ':' . substr($key, 0, 150);
                    if (isset($seen[$key])) continue;
                    $new++; $off++;
                    gc_add_item($courseId, $key, $base + ['title' => $title, 'kind' => $kind, 'status' => 'unreadable', 'reason' => $why]);
                }
            }
        }
        q('UPDATE classroom_links SET last_sync_at = NOW() WHERE course_id = ?', [$courseId]);
        $msg = ($new ? "Found $new new item" . ($new > 1 ? 's' : '') . " · $drafts waiting for your review, $off not added" : 'Up to date · no new materials') . $rosterNote;
        gc_log($courseId, true, $msg);
        return ['ok' => true, 'message' => $msg, 'new' => $new, 'drafts' => $drafts];
    } catch (GcNetError $e) {
        $msg = 'Campus server had no internet. Student answers kept working; LearnLink will try again later.';
    } catch (GcAuthError $e) {
        $msg = 'Google access expired or was removed. Reconnect your Google account in the Classroom tab.';
    } catch (Throwable $e) {
        $msg = 'Sync stopped: ' . $e->getMessage();
    }
    gc_log($courseId, false, $msg);
    return ['ok' => false, 'message' => $msg];
}
