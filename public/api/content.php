<?php
/**
 * Contenu du site.
 *  GET  content.php               contenu publié (public)
 *  GET  content.php?audit=1       journal des modifications (admin)
 *  POST content.php               { key, value }  ou  { values: {key: value, …} }  (admin)
 */
require __DIR__ . '/_lib.php';

send_security_headers();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'GET') {
    if (!empty($_GET['audit'])) {
        require_admin();
        $log = array_reverse(store_read('audit'));
        json_out(['ok' => true, 'log' => array_slice($log, 0, 50)]);
    }
    $store = store_read('content', ['values' => [], 'updated' => null]);
    json_out(['ok' => true, 'content' => (object) ($store['values'] ?? []), 'updated' => $store['updated'] ?? null]);
}

require_same_origin_post();
start_session();
$u = require_admin();
if (!empty($u['must_change_password'])) {
    fail('Changez d’abord votre mot de passe provisoire.', 403);
}

$in = body();
$values = isset($in['values']) && is_array($in['values']) ? $in['values'] : [($in['key'] ?? '') => $in['value'] ?? null];

foreach ($values as $key => $value) {
    if (!in_array($key, CONTENT_KEYS, true)) {
        fail('Bloc de contenu inconnu : ' . $key);
    }
    if (!is_array($value) && !is_string($value)) {
        fail('Valeur invalide pour ' . $key);
    }
}

store_update('content', function (&$store) use ($values) {
    if (!isset($store['values']) || !is_array($store['values'])) {
        $store['values'] = [];
    }
    foreach ($values as $key => $value) {
        $store['values'][$key] = $value;
    }
    $store['updated'] = date('c');
}, ['values' => [], 'updated' => null]);

audit('modification', implode(', ', array_keys($values)));
json_out(['ok' => true]);
