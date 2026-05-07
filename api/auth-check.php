<?php
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