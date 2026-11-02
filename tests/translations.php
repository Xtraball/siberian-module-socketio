<?php
/**
 * The module ships its texts in the 14 locales of the Siberian core (resources/translations/<code>/<file>.po, same file
 * name and contexts as resources/translations/default/<file>.po, English stays the default).
 * Plain PHP, no framework needed:
 *
 *     php tests/translations.php [module-root]
 *
 * Checks: every text the code extracts (static p__ calls) is in the default catalog, every default text is translated
 * in every locale, placeholders and the mobile flag are kept, the module never ships a languages/ folder nor a file the
 * default catalog does not have (a user's own locale is never replaced: the core ranks shipped locales after the
 * user's, this module only adds files named like its own catalog). Exit code 1 on failure.
 */

$root = rtrim($argv[1] ?? dirname(__DIR__), '/\\');
$codes = ['ca', 'cs', 'de', 'el', 'es', 'fr', 'hi', 'it', 'ja', 'nl', 'pt_BR', 'ru', 'tr', 'zh_Hans'];
$failures = [];

$check = function ($ok, $message) use (&$failures) {
    if (!$ok) {
        $failures[] = $message;
    }
    echo ($ok ? 'ok   ' : 'FAIL ') . $message . "\n";
};

$unq = function ($s) {
    return stripcslashes(substr(trim($s), 1, -1));
};

/** @return array [header, entries] entries = list of ['ctx', 'id', 'str', 'flags'] (plural entries are skipped) */
$parse = function ($file) use ($unq) {
    $entries = [];
    $header = '';
    foreach (preg_split('/\n\s*\n/', str_replace("\r\n", "\n", trim((string) file_get_contents($file)))) as $part) {
        $e = ['ctx' => null, 'id' => '', 'str' => '', 'flags' => '', 'plural' => false];
        $field = null;
        foreach (explode("\n", $part) as $line) {
            if (strpos($line, '#,') === 0) {
                $e['flags'] = trim(substr($line, 2));
            } elseif ($line !== '' && $line[0] === '#') {
                continue;
            } elseif (preg_match('/^(msgctxt|msgid_plural|msgid|msgstr(?:\[\d+\])?)\s+(".*")\s*$/', $line, $m)) {
                $field = $m[1];
                $v = $unq($m[2]);
                if ($field === 'msgctxt') {
                    $e['ctx'] = $v;
                } elseif ($field === 'msgid') {
                    $e['id'] = $v;
                } elseif ($field === 'msgid_plural') {
                    $e['plural'] = true;
                } else {
                    $e['str'] .= $v;
                }
            } elseif ($line !== '' && $line[0] === '"' && $field) {
                $v = $unq($line);
                if ($field === 'msgctxt') {
                    $e['ctx'] .= $v;
                } elseif ($field === 'msgid') {
                    $e['id'] .= $v;
                } elseif (strpos($field, 'msgstr') === 0) {
                    $e['str'] .= $v;
                }
            }
        }
        if ($e['id'] === '' && stripos($part, 'msgid') !== false && $header === '') {
            $header = $part;
        } elseif ($e['id'] !== '' && !$e['plural']) {
            $entries[] = $e;
        }
    }
    return [$header, $entries];
};

$tokens = function ($s) {
    preg_match_all('/%\d*\$?[sdifu]|\{[^{}]*\}|<\/?[a-zA-Z][^<>]*>|&[a-z]+;|\$[A-Za-z_]\w*|\\\\n/', $s, $m);
    sort($m[0]);
    return $m[0];
};

// the default catalog
$defaults = glob($root . '/resources/translations/default/*.po');
$check(count($defaults) === 1, 'one default catalog (resources/translations/default/*.po)');
$defaultFile = $defaults[0] ?? '';
$name = basename($defaultFile);
list(, $default) = $parse($defaultFile);
$defaultKeys = [];
foreach ($default as $e) {
    // a key listed twice in the default catalog counts once, the first entry rules
    $defaultKeys[$e['ctx'] . "\0" . $e['id']] = $defaultKeys[$e['ctx'] . "\0" . $e['id']] ?? $e;
}

// 1. what the code extracts is in the default catalog
$missingFromDefault = [];
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS));
foreach ($iterator as $file) {
    $path = str_replace('\\', '/', $file->getPathname());
    if (!preg_match('/\.(php|phtml)$/', $path) || preg_match('#/(vendor|libs|tests|node_modules|\.git)/#', $path)) {
        continue;
    }
    $src = (string) file_get_contents($path);
    // static calls only: p__("context", "text"), a text joined with "." or a variable is not extractable
    if (preg_match_all('/\bp__\(\s*(["\'])([a-z0-9_-]+)\1\s*,\s*(["\'])((?:\\\\.|(?!\3).)*)\3\s*[,)]/s', $src, $calls, PREG_SET_ORDER)) {
        foreach ($calls as $c) {
            $text = $c[3] === '"' ? stripcslashes($c[4]) : str_replace(["\\'", '\\\\'], ["'", '\\'], $c[4]);
            if ($text === '') {
                continue; // an empty text cannot be in a catalog (an empty msgid is the header)
            }
            if (!isset($defaultKeys[$c[2] . "\0" . $text])) {
                $missingFromDefault[] = $c[2] . ': ' . $text;
            }
        }
    }
}
$check(!$missingFromDefault, 'every static p__() text is in the default catalog' . ($missingFromDefault ? ' (missing: ' . implode(' | ', array_slice(array_unique($missingFromDefault), 0, 30)) . ')' : ''));

// 2. every locale
foreach ($codes as $code) {
    $file = "{$root}/resources/translations/{$code}/{$name}";
    if (!is_file($file)) {
        $check(false, "{$code}: {$name} exists");
        continue;
    }
    list($header, $entries) = $parse($file);
    $check(preg_match('/Language:\s*' . preg_quote($code, '/') . '\\\\n/', $header) === 1, "{$code}: header Language is {$code}");

    $seen = [];
    $badTokens = $badFlags = $unknown = $dupes = 0;
    foreach ($entries as $e) {
        $key = $e['ctx'] . "\0" . $e['id'];
        if (isset($seen[$key])) {
            $dupes++;
        }
        $seen[$key] = true;
        if (!isset($defaultKeys[$key])) {
            $unknown++;
            continue;
        }
        if ($tokens($e['str']) !== $tokens($e['id'])) {
            $badTokens++;
        }
        if ($e['flags'] !== $defaultKeys[$key]['flags']) {
            $badFlags++;
        }
    }
    $missing = array_diff_key($defaultKeys, $seen);
    // a text with no letter to translate, or a pattern kept in English on purpose, may be absent
    $missing = array_filter($missing, function ($e) {
        return preg_match('/\p{L}/u', $e['id']) === 1 && !preg_match('/[A-Za-z]%s/', $e['id']);
    });
    $check(!$missing, "{$code}: every default text is translated" . ($missing ? ' (' . count($missing) . ' missing, e.g. ' . json_encode(reset($missing)['id']) . ')' : ''));
    $check($unknown === 0 && $dupes === 0, "{$code}: no text outside the default catalog, no duplicate");
    $check($badTokens === 0, "{$code}: placeholders and markup are the same as the English");
    $check($badFlags === 0, "{$code}: flags (mobile) are kept");
}

// 3. nothing that could replace a user's own locale
$check(!is_dir($root . '/languages'), 'the module ships no languages/ folder');
$extra = [];
foreach (glob($root . '/resources/translations/*', GLOB_ONLYDIR) as $dir) {
    $code = basename($dir);
    if ($code === 'default') {
        continue;
    }
    $check(in_array($code, $codes, true), "translations/{$code} is one of the 14 shipped codes");
    foreach (glob($dir . '/*') as $f) {
        if (basename($f) !== $name) {
            $extra[] = $code . '/' . basename($f);
        }
    }
}
$check(!$extra, 'each locale folder holds only ' . $name . ($extra ? ' (also: ' . implode(', ', $extra) . ')' : ''));

echo "\n" . (count($failures) ? count($failures) . " failed\n" : "all passed\n");
exit(count($failures) ? 1 : 0);
