<?php
declare(strict_types=1);

// -----------------------------
// НАСТРОЙКИ
// -----------------------------
$DATA_FILE = __DIR__ . '/../data/objects.json';
$BACKUP_DIR = __DIR__ . '/../data/backups';

// -----------------------------
// HEADERS
// -----------------------------
header('Content-Type: application/json; charset=utf-8');

// -----------------------------
// ТОЛЬКО POST
// -----------------------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Only POST allowed'
    ]);
    exit;
}

// -----------------------------
// ЧТЕНИЕ ВХОДНЫХ ДАННЫХ
// -----------------------------
$rawInput = file_get_contents('php://input');

if (!$rawInput) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Empty request body'
    ]);
    exit;
}

// -----------------------------
// ПРОВЕРКА JSON
// -----------------------------
$data = json_decode($rawInput, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid JSON: ' . json_last_error_msg()
    ]);
    exit;
}

// -----------------------------
// ПРОВЕРКА СТРУКТУРЫ
// -----------------------------
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'JSON must be an array of objects'
    ]);
    exit;
}

// -----------------------------
// СОЗДАНИЕ BACKUP
// -----------------------------
if (!is_dir($BACKUP_DIR)) {
    mkdir($BACKUP_DIR, 0755, true);
}

if (file_exists($DATA_FILE)) {
    $backupFile = $BACKUP_DIR . '/objects_' . date('Y-m-d_H-i-s') . '.json';
    copy($DATA_FILE, $backupFile);
}

// -----------------------------
// ЗАПИСЬ ФАЙЛА
// -----------------------------
$jsonToSave = json_encode(
    $data,
    JSON_UNESCAPED_UNICODE |
    JSON_PRETTY_PRINT |
    JSON_THROW_ON_ERROR
);

$result = file_put_contents($DATA_FILE, $jsonToSave, LOCK_EX);

if ($result === false) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to write file'
    ]);
    exit;
}

// -----------------------------
// УСПЕХ
// -----------------------------
echo json_encode([
    'status' => 'ok',
    'saved' => true,
    'count' => count($data),
    'timestamp' => date('c')
]);
