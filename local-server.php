<?php
/**
 * Aperçu local du dossier www/, comme sur un vrai serveur (ne va PAS sur le serveur).
 *   npm run serveur   → http://localhost:8080
 * Reproduit les règles du .htaccess : données interdites, adresses du site → index.php.
 */
$root = __DIR__ . '/www';
$path = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

if (strpos($path, '/data/') === 0) {
    http_response_code(403);
    echo 'Accès interdit';
    return true;
}

$file = realpath($root . $path);
if ($file && is_file($file) && strpos($file, realpath($root)) === 0) {
    if (substr($file, -4) === '.php') {
        $_SERVER['SCRIPT_FILENAME'] = $file;
        chdir(dirname($file));
        require $file;
        return true;
    }
    return false; // fichier statique servi tel quel
}

$_SERVER['SCRIPT_FILENAME'] = $root . '/index.php';
require $root . '/index.php';
return true;
