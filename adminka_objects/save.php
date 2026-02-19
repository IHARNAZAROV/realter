<?php
header("Content-Type: application/json; charset=utf-8");

// ❗ защита (если позже подключишь сессии)
// session_start();
// if (!isset($_SESSION['admin'])) {
//   http_response_code(403);
//   echo json_encode(["error" => "Access denied"]);
//   exit;
// }

$data = file_get_contents("php://input");
$objects = json_decode($data, true);

if (!$objects || !is_array($objects)) {
  http_response_code(400);
  echo json_encode(["error" => "Invalid JSON"]);
  exit;
}

$path = __DIR__ . "/../data/objects.json";
$backupDir = __DIR__ . "/../data/backups";

if (!is_dir($backupDir)) {
  mkdir($backupDir, 0755, true);
}

// backup
copy(
  $path,
  $backupDir . "/objects_" . date("Y-m-d_H-i-s") . ".json"
);

// save
file_put_contents(
  $path,
  json_encode($objects, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
);

echo json_encode([
  "status" => "ok",
  "saved" => count($objects)
]);
