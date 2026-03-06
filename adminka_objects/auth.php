<?php
/**
 * Local auth hook for adminka_objects/save.php
 *
 * Variant B: keep auth logic in this file.
 * save.php will call realterAuthorizeSaveRequest() if it exists.
 *
 * Configure ONE of the options below:
 * 1) Static token in this file (REALTER_ADMIN_SAVE_TOKEN)
 * 2) Environment token (REALTER_ADMIN_TOKEN)
 * 3) Existing PHP session flag ($_SESSION['is_admin'] === true)
 */

// 1) File-based token (change this value on production).
const REALTER_ADMIN_SAVE_TOKEN = 'change-this-token-to-a-long-random-string';

$realterAuthError = null;

function realterReadBearerToken(): ?string {
  $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['Authorization'] ?? '';
  if (!$header) {
    return null;
  }

  if (preg_match('/^Bearer\s+(.+)$/i', trim($header), $m)) {
    return trim($m[1]);
  }

  return null;
}

function realterAuthorizeSaveRequest(): bool {
  global $realterAuthError;
  // 3) Optional session-based allow.
  if (session_status() !== PHP_SESSION_ACTIVE) {
    @session_start();
  }
  if (!empty($_SESSION['is_admin']) && $_SESSION['is_admin'] === true) {
    $realterAuthError = null;
    return true;
  }

  // 1/2) Token-based allow.
  $expected = getenv('REALTER_ADMIN_TOKEN') ?: REALTER_ADMIN_SAVE_TOKEN;
  if (!$expected || $expected === 'change-this-token-to-a-long-random-string') {
    // Default token is intentionally invalid: must be configured.
    $realterAuthError = 'Auth is not configured: set REALTER_ADMIN_TOKEN or REALTER_ADMIN_SAVE_TOKEN in adminka_objects/auth.php';
    return false;
  }

  $provided = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? realterReadBearerToken() ?? '';
  if (!$provided) {
    $realterAuthError = 'Missing admin token. Set localStorage.adminSaveToken in browser.';
    return false;
  }

  $ok = hash_equals($expected, trim($provided));
  if (!$ok) {
    $realterAuthError = 'Invalid admin token. Check token in localStorage.adminSaveToken and server config.';
  } else {
    $realterAuthError = null;
  }

  return $ok;
}

function realterGetAuthErrorMessage(): ?string {
  global $realterAuthError;
  return $realterAuthError;
}
