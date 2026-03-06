<?php
$authFile = __DIR__ . '/auth.php';
if (is_file($authFile)) {
  require $authFile;
}

header('Content-Type: application/json; charset=utf-8');

$data = file_get_contents('php://input');
if (!$data) {
  http_response_code(400);
  echo json_encode(['error' => 'No data'], JSON_UNESCAPED_UNICODE);
  exit;
}

$decoded = json_decode($data, true);
if (!is_array($decoded)) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid JSON'], JSON_UNESCAPED_UNICODE);
  exit;
}

$file = __DIR__ . '/../data/objects.json';
$backupDir = __DIR__ . '/../data/backups';
if (!is_dir($backupDir)) {
  mkdir($backupDir, 0775, true);
}

if (is_file($file)) {
  $backupFile = $backupDir . '/objects-' . date('Ymd-His') . '.json';
  @copy($file, $backupFile);
}

$fp = fopen($file, 'c+');
if (!$fp) {
  http_response_code(500);
  echo json_encode(['error' => 'Cannot open storage file'], JSON_UNESCAPED_UNICODE);
  exit;
}

if (!flock($fp, LOCK_EX)) {
  fclose($fp);
  http_response_code(500);
  echo json_encode(['error' => 'Cannot lock storage file'], JSON_UNESCAPED_UNICODE);
  exit;
}

$prettyJson = json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($prettyJson === false) {
  flock($fp, LOCK_UN);
  fclose($fp);
  http_response_code(500);
  echo json_encode(['error' => 'Cannot encode JSON'], JSON_UNESCAPED_UNICODE);
  exit;
}

ftruncate($fp, 0);
rewind($fp);
$written = fwrite($fp, $prettyJson . PHP_EOL);
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

if ($written === false) {
  http_response_code(500);
  echo json_encode(['error' => 'Cannot write data'], JSON_UNESCAPED_UNICODE);
  exit;
}

echo json_encode([
  'status' => 'ok',
  'savedAt' => date(DATE_ATOM),
  'count' => count($decoded)
], JSON_UNESCAPED_UNICODE);
