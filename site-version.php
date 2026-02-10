<?php
require __DIR__ . '/env.php';

$deployFile = __DIR__ . '/.deploy';

if (ENV === 'dev') {
    // В dev всегда новая версия
    $version = time();
} else {
    // В prod версия = время деплоя
    if (file_exists($deployFile)) {
        $version = filemtime($deployFile);
    } else {
        $version = time();
    }
}

// Отдаём JS
header('Content-Type: application/javascript');
header('Cache-Control: no-cache');

echo "window.SITE_VERSION = {$version};";
