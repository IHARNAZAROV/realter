<?php
header('Content-Type: application/json; charset=utf-8');

function respond(int $statusCode, array $payload): void {
  http_response_code($statusCode);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function readBearerToken(): ?string {
  $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['Authorization'] ?? '';
  if (!$header) return null;

  if (preg_match('/^Bearer\s+(.+)$/i', trim($header), $m)) {
    return trim($m[1]);
  }

  return null;
}

function authorizeRequest(): void {
  $authFile = __DIR__ . '/auth.php';

  if (is_file($authFile)) {
    require_once $authFile;

    if (function_exists('realterAuthorizeSaveRequest')) {
      $ok = (bool) realterAuthorizeSaveRequest();
      if (!$ok) {
        respond(401, ['error' => 'Unauthorized']);
      }
      return;
    }

    return;
  }

  $expectedToken = getenv('REALTER_ADMIN_TOKEN') ?: '';
  if ($expectedToken === '') {
    respond(500, ['error' => 'Auth is not configured: add adminka_objects/auth.php or REALTER_ADMIN_TOKEN']);
  }

  $providedToken = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? readBearerToken() ?? '';
  if (!$providedToken || !hash_equals($expectedToken, $providedToken)) {
    respond(401, ['error' => 'Unauthorized']);
  }
}

function requireJsonPost(): void {
  if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    respond(405, ['error' => 'Method Not Allowed']);
  }

  $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
  if (stripos($contentType, 'application/json') !== 0) {
    respond(415, ['error' => 'Content-Type must be application/json']);
  }
}

function validateDateDdMmYyyy(string $value): bool {
  return (bool) preg_match('/^\d{2}\.\d{2}\.\d{4}$/', $value);
}

function validateBlogArticle(array $item, int $index): array {
  $errors = [];

  foreach (['id', 'slug', 'title', 'date', 'publishAt'] as $field) {
    if (!array_key_exists($field, $item) || !is_string($item[$field]) || trim($item[$field]) === '') {
      $errors[] = "#$index: field '$field' is required";
    }
  }

  if (isset($item['date']) && is_string($item['date']) && !validateDateDdMmYyyy($item['date'])) {
    $errors[] = "#$index: field 'date' must match DD.MM.YYYY";
  }

  if (isset($item['publishAt']) && is_string($item['publishAt'])) {
    try {
      new DateTime($item['publishAt']);
    } catch (Exception $e) {
      $errors[] = "#$index: field 'publishAt' must be a valid datetime";
    }
  }

  return $errors;
}

function validatePayload($decoded): array {
  if (!is_array($decoded)) {
    return ['Payload must be an array of articles'];
  }

  $errors = [];
  foreach ($decoded as $i => $item) {
    if (!is_array($item)) {
      $errors[] = "#$i: object expected";
      continue;
    }
    $errors = array_merge($errors, validateBlogArticle($item, $i));
  }

  return $errors;
}

function saveWithBackupAndLock(array $decoded): array {
  $dataDir = realpath(__DIR__ . '/../data') ?: (__DIR__ . '/../data');
  $file = $dataDir . '/blog-articles.json';
  $backupDir = $dataDir . '/backups';
  $lockFile = $dataDir . '/blog-articles.json.lock';

  if (!is_dir($backupDir) && !mkdir($backupDir, 0700, true) && !is_dir($backupDir)) {
    respond(500, ['error' => 'Cannot create backup directory']);
  }

  $lockHandle = fopen($lockFile, 'c');
  if (!$lockHandle) {
    respond(500, ['error' => 'Cannot open lock file']);
  }

  if (!flock($lockHandle, LOCK_EX)) {
    fclose($lockHandle);
    respond(500, ['error' => 'Cannot lock storage']);
  }

  $backupFile = null;
  if (is_file($file)) {
    $backupFile = $backupDir . '/blog-articles-' . date('Ymd-His') . '.json';
    if (!copy($file, $backupFile)) {
      flock($lockHandle, LOCK_UN);
      fclose($lockHandle);
      respond(500, ['error' => 'Cannot create backup']);
    }
  }

  $prettyJson = json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if ($prettyJson === false) {
    flock($lockHandle, LOCK_UN);
    fclose($lockHandle);
    respond(500, ['error' => 'Cannot encode JSON']);
  }

  $tmpFile = $file . '.tmp.' . getmypid();
  if (file_put_contents($tmpFile, $prettyJson . PHP_EOL, LOCK_EX) === false) {
    flock($lockHandle, LOCK_UN);
    fclose($lockHandle);
    @unlink($tmpFile);
    respond(500, ['error' => 'Cannot write temp file']);
  }

  if (!rename($tmpFile, $file)) {
    flock($lockHandle, LOCK_UN);
    fclose($lockHandle);
    @unlink($tmpFile);
    respond(500, ['error' => 'Cannot replace storage file']);
  }

  flock($lockHandle, LOCK_UN);
  fclose($lockHandle);

  return [
    'status' => 'ok',
    'savedAt' => date(DATE_ATOM),
    'count' => count($decoded),
    'backup' => $backupFile ? basename($backupFile) : null
  ];
}

requireJsonPost();
authorizeRequest();

$rawData = file_get_contents('php://input');
if ($rawData === false || trim($rawData) === '') {
  respond(400, ['error' => 'Empty payload']);
}

$decoded = json_decode($rawData, true);
if (json_last_error() !== JSON_ERROR_NONE) {
  respond(400, ['error' => 'Invalid JSON: ' . json_last_error_msg()]);
}

$errors = validatePayload($decoded);
if ($errors) {
  respond(422, ['error' => 'Validation failed', 'details' => $errors]);
}

$result = saveWithBackupAndLock($decoded);
respond(200, $result);
