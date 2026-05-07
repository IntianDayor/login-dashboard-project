<?php
require_once __DIR__ . '/db.php';        // db connection must come first
require_once __DIR__ . '/session-db.php'; // register handler before session_start
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function requireLogin() {
    if (empty($_SESSION['username'])) {
        echo json_encode(["success" => false, "message" => "Not logged in"]);
        exit;
    }
}

function requireAdmin() {
    requireLogin();
    if (empty($_SESSION['isAdmin'])) {
        echo json_encode(["success" => false, "message" => "Access denied"]);
        exit;
    }
}

function verifyCsrf() {
    $headers = getallheaders();
    $token = $headers['X-CSRF-Token'] ?? '';

    if (empty($token) || $token !== ($_SESSION['csrf_token'] ?? '')) {
        echo json_encode(["success" => false, "message" => "Invalid CSRF token"]);
        exit;
    }
}
?>