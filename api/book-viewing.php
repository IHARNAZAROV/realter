<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

$date = trim($data['date'] ?? '');
$time = trim($data['time'] ?? '');
$name = trim($data['name'] ?? '');
$phone = trim($data['phone'] ?? '');

$phonePattern = '/^\+?[\d\s()\-]{9,20}$/u';

if ($date === '' || $time === '' || mb_strlen($name) < 2 || !preg_match($phonePattern, $phone)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Validation failed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$botToken = getenv('TELEGRAM_BOT_TOKEN') ?: '';

if ($botToken === '') {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Telegram token is not configured'], JSON_UNESCAPED_UNICODE);
    exit;
}

$recipients = ['@TurkoOlga', '@y_tery'];
$message = "Новая заявка на просмотр недвижимости:%0A"
    . "Имя: " . rawurlencode($name) . "%0A"
    . "Телефон: " . rawurlencode($phone) . "%0A"
    . "Дата: " . rawurlencode($date) . "%0A"
    . "Время: " . rawurlencode($time);

$errors = [];

foreach ($recipients as $chatId) {
    $url = "https://api.telegram.org/bot{$botToken}/sendMessage?chat_id="
        . rawurlencode($chatId)
        . "&text=" . $message;

    $result = @file_get_contents($url);

    if ($result === false) {
        $errors[] = $chatId;
    }
}

if (!empty($errors)) {
    http_response_code(502);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to deliver to Telegram recipients',
        'failed' => $errors,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode(['ok' => true], JSON_UNESCAPED_UNICODE);
