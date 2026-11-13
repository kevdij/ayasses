<?php
/**
 * Point d'entrée du site : renvoie l'application React (index.html) pour
 * toutes les adresses (/vol-rando, /actualites/…, /admin…).
 * Ajoute au passage les en-têtes de sécurité.
 */
$csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
    . "font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self'; "
    . "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";

header('Content-Security-Policy: ' . $csp);
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()');
if ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') {
    header('Strict-Transport-Security: max-age=31536000');
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
if (strpos($path, '/admin') === 0) {
    header('X-Robots-Tag: noindex, nofollow');
    header('Cache-Control: no-store');
}

header('Content-Type: text/html; charset=utf-8');
readfile(__DIR__ . '/index.html');
