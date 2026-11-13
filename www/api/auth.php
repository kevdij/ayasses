<?php
/**
 * Connexion des administrateurs : mot de passe + double authentification (TOTP).
 *
 *  GET  auth.php?action=status          état de la session
 *  POST auth.php?action=setup-code      (1re installation) génère le code d'installation
 *  POST auth.php?action=setup           (1re installation) crée le premier compte
 *  POST auth.php?action=login           e-mail + mot de passe
 *  POST auth.php?action=totp            code à 6 chiffres
 *  POST auth.php?action=enroll-start    nouvelle clé 2FA (QR code)
 *  POST auth.php?action=enroll-confirm  validation de la clé 2FA
 *  POST auth.php?action=logout
 *  POST auth.php?action=change-password
 *  POST auth.php?action=users | user-add | user-delete | user-reset-2fa
 */
require __DIR__ . '/_lib.php';

send_security_headers();
start_session();

$action = $_GET['action'] ?? 'status';

if ($action === 'status') {
    $setupNeeded = count(users()) === 0;
    $u = current_user();
    if ($u && !empty($u['totp_secret'])) {
        json_out(['ok' => true, 'stage' => 'ok', 'user' => public_user($u), 'mustChangePassword' => !empty($u['must_change_password'])]);
    }
    $pending = $_SESSION['pending'] ?? null;
    if ($pending && ($pu = user_by_id($pending['user_id']))) {
        json_out(['ok' => true, 'stage' => empty($pu['totp_secret']) ? 'enroll' : 'totp', 'email' => $pu['email']]);
    }
    $expired = !empty($_SESSION['expired']);
    unset($_SESSION['expired']);
    json_out(['ok' => true, 'stage' => $setupNeeded ? 'setup' : 'signin', 'expired' => $expired]);
}

require_same_origin_post();
$in = body();

/** Ouvre la session complète après mot de passe + 2FA. */
function finish_login(array $u, int $step): void
{
    update_user($u['id'], function (&$x) use ($step) {
        $x['last_step'] = $step;
        $x['last_login'] = date('c');
    });
    session_regenerate_id(true);
    $_SESSION = ['user_id' => $u['id'], 'started' => time(), 'last' => time()];
    rl_success($u['email']);
    audit('connexion', '', $u['email']);
    $u = user_by_id($u['id']);
    json_out(['ok' => true, 'stage' => 'ok', 'user' => public_user($u), 'mustChangePassword' => !empty($u['must_change_password'])]);
}

function pending_user(): array
{
    $p = $_SESSION['pending'] ?? null;
    $u = $p ? user_by_id($p['user_id']) : null;
    if (!$u) {
        fail('Étape expirée : reconnectez-vous.', 401, ['stage' => 'signin']);
    }
    return $u;
}

function new_user(string $email, string $password, bool $mustChange): array
{
    return [
        'id' => bin2hex(random_bytes(8)),
        'email' => $email,
        'hash' => password_hash($password, PASSWORD_DEFAULT),
        'totp_secret' => null,
        'last_step' => 0,
        'must_change_password' => $mustChange,
        'created' => date('c'),
        'last_login' => null,
    ];
}

function clean_email(string $email): string
{
    $email = strtolower(trim($email));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fail('Adresse e-mail invalide.');
    }
    return $email;
}

switch ($action) {
    /* ---------- Première installation ---------- */
    case 'setup-code':
        if (count(users()) > 0) {
            fail('Le site est déjà installé.', 403);
        }
        if (!is_file(store_path('setup-code'))) {
            $code = strtoupper(substr(bin2hex(random_bytes(6)), 0, 10));
            // Le code est lisible uniquement via FTP / gestionnaire de fichiers
            $file = store_path('setup-code');
            if (file_put_contents($file, GUARD . "CODE D'INSTALLATION : " . $code . "\n") === false) {
                fail('Impossible d’écrire dans le dossier data/ : vérifiez les droits d’écriture.', 500);
            }
        }
        json_out(['ok' => true]);

    case 'setup':
        rl_check();
        if (count(users()) > 0) {
            fail('Le site est déjà installé.', 403);
        }
        $file = store_path('setup-code');
        $stored = is_file($file) && preg_match('/CODE D\'INSTALLATION : ([A-F0-9]+)/', (string) file_get_contents($file), $m) ? $m[1] : '';
        $given = strtoupper(trim((string) ($in['code'] ?? '')));
        if ($stored === '' || !hash_equals($stored, $given)) {
            rl_fail();
            fail('Code d’installation incorrect.');
        }
        $email = clean_email((string) ($in['email'] ?? ''));
        $password = (string) ($in['password'] ?? '');
        if ($err = valid_password($password)) {
            fail($err);
        }
        $u = new_user($email, $password, false);
        store_update('users', function (&$data) use ($u) { $data['users'][] = $u; }, ['users' => []]);
        @unlink($file);
        session_regenerate_id(true);
        $_SESSION = ['pending' => ['user_id' => $u['id'], 'at' => time()]];
        audit('installation', 'premier compte admin', $email);
        json_out(['ok' => true, 'stage' => 'enroll', 'email' => $email]);

    /* ---------- Connexion ---------- */
    case 'login':
        $email = strtolower(trim((string) ($in['email'] ?? '')));
        $password = (string) ($in['password'] ?? '');
        rl_check($email);
        $u = $email !== '' ? user_by_email($email) : null;
        // Vérification même si le compte n'existe pas (temps de réponse identique)
        $hash = $u['hash'] ?? '$2y$10$abcdefghijklmnopqrstuuJp9pDgbS0mY1vWkHk8l5uYd3WqvB0e2';
        if (!password_verify($password, $hash) || !$u) {
            rl_fail($email);
            audit('échec connexion', $email, '-');
            fail('E-mail ou mot de passe incorrect.', 401);
        }
        if (password_needs_rehash($u['hash'], PASSWORD_DEFAULT)) {
            update_user($u['id'], function (&$x) use ($password) { $x['hash'] = password_hash($password, PASSWORD_DEFAULT); });
        }
        session_regenerate_id(true);
        $_SESSION = ['pending' => ['user_id' => $u['id'], 'at' => time()]];
        json_out(['ok' => true, 'stage' => empty($u['totp_secret']) ? 'enroll' : 'totp', 'email' => $u['email']]);

    case 'totp':
        $u = pending_user();
        if (empty($u['totp_secret'])) {
            fail('Double authentification non configurée.', 400, ['stage' => 'enroll']);
        }
        rl_check($u['email']);
        $step = totp_verify($u['totp_secret'], (string) ($in['code'] ?? ''), (int) ($u['last_step'] ?? 0));
        if ($step === null) {
            rl_fail($u['email']);
            audit('échec code 2FA', '', $u['email']);
            fail('Code invalide ou expiré.', 401);
        }
        finish_login($u, $step);

    case 'enroll-start':
        $u = pending_user();
        if (!empty($u['totp_secret'])) {
            fail('Double authentification déjà configurée.', 400, ['stage' => 'totp']);
        }
        if (empty($_SESSION['pending']['secret'])) {
            $_SESSION['pending']['secret'] = totp_new_secret();
        }
        $secret = $_SESSION['pending']['secret'];
        json_out(['ok' => true, 'secret' => $secret, 'uri' => totp_uri($secret, $u['email'])]);

    case 'enroll-confirm':
        $u = pending_user();
        $secret = $_SESSION['pending']['secret'] ?? '';
        if (!empty($u['totp_secret']) || $secret === '') {
            fail('Étape expirée : reconnectez-vous.', 401, ['stage' => 'signin']);
        }
        rl_check($u['email']);
        $step = totp_verify($secret, (string) ($in['code'] ?? ''));
        if ($step === null) {
            rl_fail($u['email']);
            fail('Code invalide. Vérifiez que l’heure de votre téléphone est juste.', 401);
        }
        update_user($u['id'], function (&$x) use ($secret) { $x['totp_secret'] = $secret; });
        audit('2FA activée', '', $u['email']);
        finish_login(user_by_id($u['id']), $step);

    case 'logout':
        $u = current_user();
        if ($u) {
            audit('déconnexion', '', $u['email']);
        }
        $_SESSION = [];
        session_regenerate_id(true);
        session_destroy();
        json_out(['ok' => true, 'stage' => 'signin']);

    /* ---------- Compte connecté ---------- */
    case 'change-password':
        $u = require_admin();
        if (!password_verify((string) ($in['current'] ?? ''), $u['hash'])) {
            fail('Mot de passe actuel incorrect.', 401);
        }
        $new = (string) ($in['password'] ?? '');
        if ($err = valid_password($new)) {
            fail($err);
        }
        update_user($u['id'], function (&$x) use ($new) {
            $x['hash'] = password_hash($new, PASSWORD_DEFAULT);
            $x['must_change_password'] = false;
        });
        audit('mot de passe modifié');
        json_out(['ok' => true]);

    /* ---------- Gestion des admins ---------- */
    case 'users':
        require_admin();
        json_out(['ok' => true, 'users' => array_map('public_user', users())]);

    case 'user-add':
        $me = require_admin();
        $email = clean_email((string) ($in['email'] ?? ''));
        if (user_by_email($email)) {
            fail('Ce compte existe déjà.');
        }
        // Mot de passe provisoire à transmettre ; il devra être changé à la 1re connexion
        $alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $temp = '';
        for ($i = 0; $i < 16; $i++) {
            $temp .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
        $u = new_user($email, $temp, true);
        store_update('users', function (&$data) use ($u) { $data['users'][] = $u; }, ['users' => []]);
        audit('admin ajouté', $email);
        json_out(['ok' => true, 'user' => public_user($u), 'tempPassword' => $temp]);

    case 'user-delete':
        $me = require_admin();
        $id = (string) ($in['id'] ?? '');
        if ($id === $me['id']) {
            fail('Vous ne pouvez pas supprimer votre propre compte.');
        }
        $target = user_by_id($id);
        if (!$target) {
            fail('Compte introuvable.', 404);
        }
        store_update('users', function (&$data) use ($id) {
            $data['users'] = array_values(array_filter($data['users'], function ($u) use ($id) { return $u['id'] !== $id; }));
        }, ['users' => []]);
        audit('admin supprimé', $target['email']);
        json_out(['ok' => true]);

    case 'user-reset-2fa':
        $me = require_admin();
        $id = (string) ($in['id'] ?? '');
        $target = user_by_id($id);
        if (!$target) {
            fail('Compte introuvable.', 404);
        }
        if ($id === $me['id']) {
            fail('Demandez à un autre admin de réinitialiser votre double authentification.');
        }
        update_user($id, function (&$x) {
            $x['totp_secret'] = null;
            $x['last_step'] = 0;
        });
        audit('2FA réinitialisée', $target['email']);
        json_out(['ok' => true]);

    default:
        fail('Action inconnue.', 404);
}
