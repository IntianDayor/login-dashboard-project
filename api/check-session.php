<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');

echo json_encode([
    "loggedIn"   => !empty($_SESSION['username']),
    "isAdmin"    => !empty($_SESSION['isAdmin']),
    "username"   => $_SESSION['username'] ?? null,
    "csrf_token" => $_SESSION['csrf_token'] ?? null
]);
?>