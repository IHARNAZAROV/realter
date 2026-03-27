<?php
require_once __DIR__ . '/../env.php';
header('Content-Type: application/json; charset=utf-8');

$token = getenv('CLARITY_API_TOKEN');
if (!$token && defined('CLARITY_API_TOKEN')) {
    $token = CLARITY_API_TOKEN;
}

if (!$token) {
    http_response_code(500);
    echo json_encode([
        'ok' => false,
        'error' => 'CLARITY_API_TOKEN is not configured on the server'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$numOfDays = isset($_GET['numOfDays']) ? (int)$_GET['numOfDays'] : 1;
if ($numOfDays < 1 || $numOfDays > 3) {
    $numOfDays = 1;
}

$query = http_build_query([
    'numOfDays' => $numOfDays,
]);

$url = 'https://www.clarity.ms/export-data/api/v1/project-live-insights?' . $query;

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $token,
        'Accept: application/json'
    ],
    CURLOPT_TIMEOUT => 20,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode([
        'ok' => false,
        'error' => 'Failed to reach Clarity API',
        'details' => $curlError,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$data = json_decode($response, true);
if ($httpCode < 200 || $httpCode >= 300) {
    http_response_code($httpCode ?: 502);
    echo json_encode([
        'ok' => false,
        'error' => 'Clarity API returned an error status',
        'status' => $httpCode,
        'response' => $data ?: $response,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

echo json_encode([
    'ok' => true,
    'status' => $httpCode,
    'numOfDays' => $numOfDays,
    'data' => $data,
], JSON_UNESCAPED_UNICODE);
