<?php
session_start();

$USER = 'admin';
$PASS = 'LidaNeXX2910';

if (
  !isset($_SERVER['PHP_AUTH_USER']) ||
  $_SERVER['PHP_AUTH_USER'] !== $USER ||
  $_SERVER['PHP_AUTH_PW'] !== $PASS
) {
  header('WWW-Authenticate: Basic realm="Admin Area"');
  header('HTTP/1.0 401 Unauthorized');
  exit;
}
