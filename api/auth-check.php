<?php
require_once __DIR__ . '/bootstrap.php';

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
    $headers = array_change_key_case(getallheaders(), CASE_LOWER);
    $token = $headers['x-csrf-token'] ?? '';
    $sessionToken = $_SESSION['csrf_token'] ?? '';

    if (empty($token) || empty($sessionToken) || !hash_equals($sessionToken, $token)) {
        echo json_encode(["success" => false, "message" => "Invalid CSRF token"]);
        exit;
    }
}
?>