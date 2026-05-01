<?php
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

if (preg_match('#^/raion/([a-zA-Z0-9_\-]+)/?$#', $uri, $m)) {
    $_GET['slug'] = $m[1];
    include __DIR__ . '/raion.php';
    return;
}

return false;
