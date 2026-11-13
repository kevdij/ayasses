<?php
/**
 * Club des Ayasses : fonctions communes du backend.
 * Compatible PHP 7.4+. Aucune dépendance, aucune base de données :
 * les données sont stockées dans le dossier data/ (fichiers protégés).
 */

// Ce fichier ne s'appelle pas directement.
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === realpath(__FILE__)) {
    http_response_code(404);
    exit;
}

const SESSION_IDLE = 30 * 60;        // déconnexion après 30 min d'inactivité
const SESSION_MAX = 8 * 3600;        // session de 8 h au maximum
const MAX_ATTEMPTS = 5;              // tentatives avant blocage
const LOCK_SECONDS = 15 * 60;        // durée du blocage
const MIN_PASSWORD = 12;
const CONTENT_KEYS = ['club', 'activities', 'events', 'news', 'structures', 'volRando', 'volRandoInfo'];
const MAX_BODY = 5 * 1024 * 1024;    // 5 Mo

function data_dir(): string
{
    $dir = getenv('AYASSES_DATA_DIR') ?: dirname(__DIR__) . '/data';
    if (!is_dir($dir)) {
        @mkdir($dir, 0750, true);
    }
    return rtrim($dir, '/\\');
}

/* ------------------------------------------------------------------ */
/* Réponses HTTP                                                       */
/* ------------------------------------------------------------------ */

function send_security_headers(): void
{
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Cache-Control: no-store');
}

function json_out($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $status = 400, array $extra = []): void
{
    json_out(['ok' => false, 'error' => $message] + $extra, $status);
}

/** Corps JSON de la requête (taille limitée). */
function body(): array
{
    $len = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($len > MAX_BODY) {
        fail('Données trop volumineuses.', 413);
    }
    $raw = file_get_contents('php://input', false, null, 0, MAX_BODY + 1);
    if ($raw === false || strlen($raw) > MAX_BODY) {
        fail('Données trop volumineuses.', 413);
    }
    $data = json_decode($raw ?: '{}', true);
    if (!is_array($data)) {
        fail('Requête invalide.');
    }
    return $data;
}

/**
 * Protection CSRF : les requêtes d'écriture doivent venir du site lui-même
 * (en-tête personnalisé + origine identique). Le cookie est aussi SameSite=Strict.
 */
function require_same_origin_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
        fail('Méthode non autorisée.', 405);
    }
    if (($_SERVER['HTTP_X_AYASSES'] ?? '') !== '1') {
        fail('Requête refusée.', 403);
    }
    $host = $_SERVER['HTTP_HOST'] ?? '';
    foreach (['HTTP_ORIGIN', 'HTTP_REFERER'] as $h) {
        if (!empty($_SERVER[$h])) {
            $originHost = parse_url($_SERVER[$h], PHP_URL_HOST);
            $originPort = parse_url($_SERVER[$h], PHP_URL_PORT);
            $full = $originHost . ($originPort ? ':' . $originPort : '');
            if ($full !== $host && $originHost !== $host) {
                fail('Origine refusée.', 403);
            }
            break;
        }
    }
}

/* ------------------------------------------------------------------ */
/* Stockage : fichiers .php protégés (illisibles depuis le web)        */
/* ------------------------------------------------------------------ */

const GUARD = "<?php http_response_code(404); exit; ?>\n";

function store_path(string $name): string
{
    return data_dir() . '/' . $name . '.php';
}

function store_read(string $name, $default = [])
{
    $file = store_path($name);
    if (!is_file($file)) {
        return $default;
    }
    $raw = file_get_contents($file);
    if ($raw === false) {
        return $default;
    }
    if (strpos($raw, GUARD) === 0) {
        $raw = substr($raw, strlen(GUARD));
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : $default;
}

function store_write(string $name, $data): void
{
    $file = store_path($name);
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        fail('Données invalides.', 400);
    }
    $tmp = $file . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (file_put_contents($tmp, GUARD . $json, LOCK_EX) === false || !rename($tmp, $file)) {
        @unlink($tmp);
        fail('Impossible d’écrire dans le dossier data/ : vérifiez les droits d’écriture.', 500);
    }
    @chmod($file, 0640);
}

/** Lecture-modification-écriture protégée par un verrou. */
function store_update(string $name, callable $fn, $default = [])
{
    $lock = fopen(data_dir() . '/.' . $name . '.lock', 'c');
    if ($lock) {
        flock($lock, LOCK_EX);
    }
    try {
        $data = store_read($name, $default);
        $result = $fn($data);
        store_write($name, $data);
        return $result;
    } finally {
        if ($lock) {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
}

/* ------------------------------------------------------------------ */
/* Journal                                                              */
/* ------------------------------------------------------------------ */

function audit(string $action, string $detail = '', ?string $email = null): void
{
    store_update('audit', function (&$log) use ($action, $detail, $email) {
        $log[] = [
            'at' => date('c'),
            'user' => $email ?? (current_user()['email'] ?? null),
            'action' => $action,
            'detail' => $detail,
            'ip' => client_ip(),
        ];
        if (count($log) > 1000) {
            $log = array_slice($log, -1000);
        }
    });
}

function client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/* ------------------------------------------------------------------ */
/* Limitation des tentatives                                           */
/* ------------------------------------------------------------------ */

function rl_keys(string $email = ''): array
{
    $keys = ['ip:' . client_ip()];
    if ($email !== '') {
        $keys[] = 'email:' . strtolower($email);
    }
    return $keys;
}

function rl_check(string $email = ''): void
{
    $rl = store_read('ratelimit');
    $now = time();
    foreach (rl_keys($email) as $k) {
        if (!empty($rl[$k]['until']) && $rl[$k]['until'] > $now) {
            $wait = (int) ceil(($rl[$k]['until'] - $now) / 60);
            fail("Trop de tentatives. Réessayez dans {$wait} min.", 429);
        }
    }
}

function rl_fail(string $email = ''): void
{
    store_update('ratelimit', function (&$rl) use ($email) {
        $now = time();
        foreach ($rl as $k => $v) { // ménage
            if (($v['until'] ?? 0) < $now && ($v['first'] ?? 0) < $now - LOCK_SECONDS) {
                unset($rl[$k]);
            }
        }
        foreach (rl_keys($email) as $k) {
            $e = $rl[$k] ?? ['count' => 0, 'first' => $now, 'until' => 0];
            if ($e['first'] < $now - LOCK_SECONDS) {
                $e = ['count' => 0, 'first' => $now, 'until' => 0];
            }
            $e['count']++;
            if ($e['count'] >= MAX_ATTEMPTS) {
                $e['until'] = $now + LOCK_SECONDS;
                $e['count'] = 0;
                $e['first'] = $now;
            }
            $rl[$k] = $e;
        }
    });
}

function rl_success(string $email = ''): void
{
    store_update('ratelimit', function (&$rl) use ($email) {
        foreach (rl_keys($email) as $k) {
            unset($rl[$k]);
        }
    });
}

/* ------------------------------------------------------------------ */
/* Sessions                                                             */
/* ------------------------------------------------------------------ */

function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
        || (($_SERVER['SERVER_PORT'] ?? '') === '443');
}

function start_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', (string) SESSION_MAX);
    session_name('ayasses_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => is_https(),
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();

    $now = time();
    if (!empty($_SESSION['user_id'])) {
        $idle = $now - ($_SESSION['last'] ?? 0);
        $age = $now - ($_SESSION['started'] ?? 0);
        if ($idle > SESSION_IDLE || $age > SESSION_MAX) {
            $_SESSION = [];
            session_regenerate_id(true);
            $_SESSION['expired'] = true;
        } else {
            $_SESSION['last'] = $now;
        }
    }
    // Une étape de connexion à moitié faite expire au bout de 10 min
    if (!empty($_SESSION['pending']) && $now - ($_SESSION['pending']['at'] ?? 0) > 600) {
        unset($_SESSION['pending']);
    }
}

/* ------------------------------------------------------------------ */
/* Comptes                                                              */
/* ------------------------------------------------------------------ */

function users(): array
{
    return store_read('users', ['users' => []])['users'] ?? [];
}

function find_user(callable $pred): ?array
{
    foreach (users() as $u) {
        if ($pred($u)) {
            return $u;
        }
    }
    return null;
}

function user_by_email(string $email): ?array
{
    $email = strtolower(trim($email));
    return find_user(function ($u) use ($email) { return $u['email'] === $email; });
}

function user_by_id(string $id): ?array
{
    return find_user(function ($u) use ($id) { return $u['id'] === $id; });
}

/** Modifie un utilisateur et enregistre. */
function update_user(string $id, callable $fn): void
{
    store_update('users', function (&$data) use ($id, $fn) {
        foreach ($data['users'] as &$u) {
            if ($u['id'] === $id) {
                $fn($u);
            }
        }
    }, ['users' => []]);
}

function current_user(): ?array
{
    if (session_status() !== PHP_SESSION_ACTIVE || empty($_SESSION['user_id'])) {
        return null;
    }
    return user_by_id($_SESSION['user_id']);
}

/** Exige un admin entièrement connecté (mot de passe + 2FA). */
function require_admin(): array
{
    start_session();
    $u = current_user();
    if (!$u || empty($u['totp_secret'])) {
        fail('Session expirée : reconnectez-vous.', 401);
    }
    return $u;
}

function public_user(array $u): array
{
    return [
        'id' => $u['id'],
        'email' => $u['email'],
        'twoFactor' => !empty($u['totp_secret']),
        'created' => $u['created'] ?? null,
        'lastLogin' => $u['last_login'] ?? null,
    ];
}

function str_length(string $s): int
{
    // Compte les caractères UTF-8 sans dépendre de l'extension mbstring
    $n = preg_match_all('/./us', $s);
    return $n === false ? strlen($s) : $n;
}

function valid_password(string $p): ?string
{
    if (str_length($p) < MIN_PASSWORD) {
        return 'Le mot de passe doit faire au moins ' . MIN_PASSWORD . ' caractères.';
    }
    if (strlen($p) > 200) {
        return 'Mot de passe trop long.';
    }
    return null;
}

/* ------------------------------------------------------------------ */
/* TOTP (RFC 6238) : codes des applications d'authentification         */
/* ------------------------------------------------------------------ */

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function totp_new_secret(): string
{
    $bytes = random_bytes(20);
    $bits = '';
    foreach (str_split($bytes) as $c) {
        $bits .= str_pad(decbin(ord($c)), 8, '0', STR_PAD_LEFT);
    }
    $out = '';
    foreach (str_split($bits, 5) as $chunk) {
        $out .= B32[bindec(str_pad($chunk, 5, '0'))];
    }
    return $out;
}

function base32_decode_str(string $s): string
{
    $s = strtoupper(preg_replace('/[^A-Za-z2-7]/', '', $s));
    $bits = '';
    foreach (str_split($s) as $c) {
        $bits .= str_pad(decbin(strpos(B32, $c)), 5, '0', STR_PAD_LEFT);
    }
    $out = '';
    foreach (str_split($bits, 8) as $byte) {
        if (strlen($byte) === 8) {
            $out .= chr(bindec($byte));
        }
    }
    return $out;
}

function totp_code(string $secret, int $step): string
{
    $key = base32_decode_str($secret);
    $msg = pack('N*', 0) . pack('N*', $step);
    $h = hash_hmac('sha1', $msg, $key, true);
    $o = ord($h[19]) & 0xf;
    $n = ((ord($h[$o]) & 0x7f) << 24) | (ord($h[$o + 1]) << 16) | (ord($h[$o + 2]) << 8) | ord($h[$o + 3]);
    return str_pad((string) ($n % 1000000), 6, '0', STR_PAD_LEFT);
}

/**
 * Vérifie un code (±30 s de tolérance). Renvoie le pas de temps utilisé,
 * ou null. $minStep empêche de réutiliser un code déjà accepté.
 */
function totp_verify(string $secret, string $code, int $minStep = 0): ?int
{
    $code = preg_replace('/\D/', '', $code);
    if (strlen($code) !== 6) {
        return null;
    }
    $now = (int) floor(time() / 30);
    for ($i = -1; $i <= 1; $i++) {
        $step = $now + $i;
        if ($step > $minStep && hash_equals(totp_code($secret, $step), $code)) {
            return $step;
        }
    }
    return null;
}

function totp_uri(string $secret, string $email): string
{
    $issuer = 'Club des Ayasses';
    return 'otpauth://totp/' . rawurlencode($issuer . ':' . $email)
        . '?secret=' . $secret . '&issuer=' . rawurlencode($issuer) . '&algorithm=SHA1&digits=6&period=30';
}
