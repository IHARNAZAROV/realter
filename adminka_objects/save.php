<?php require __DIR__ . '/auth.php'; ?>
<?php
$data = file_get_contents("php://input");

if (!$data) {
  http_response_code(400);
  echo json_encode(["error" => "No data"]);
  exit;
}

$file = __DIR__ . "/../data/objects.json";

file_put_contents($file, $data);

echo json_encode(["status" => "ok"]);
