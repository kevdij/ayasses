<?php
/**
 * Serveur PHP de développement (ne va PAS sur le serveur de production).
 *   npm run php   → php -S 127.0.0.1:8787 dev-server.php
 * Les données de test sont rangées dans .dev-data/ (jamais dans public/ ni www/).
 */
putenv('AYASSES_DATA_DIR=' . __DIR__ . '/.dev-data');

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (preg_match('#^/api/(auth|content)\.php$#', $path, $m)) {
    $_SERVER['SCRIPT_FILENAME'] = __DIR__ . '/public/api/' . $m[1] . '.php';
    require $_SERVER['SCRIPT_FILENAME'];
    return true;
}
http_response_code(404);
echo 'Not found';
