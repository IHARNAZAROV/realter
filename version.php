<?php
// version.php — единый номер версии сайта

$deployFile = __DIR__ . '/.deploy';

if (file_exists($deployFile)) {
    echo filemtime($deployFile);
} else {
    // fallback, если файл случайно удалят
    echo time();
}