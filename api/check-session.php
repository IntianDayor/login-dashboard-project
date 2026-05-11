<?php
require_once __DIR__ . '/bootstrap.php';

header('Content-Type: application/json');

// Generate if missing
if (!empty($_SESSION['username']) && empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

echo json_encode([
    "loggedIn"   => !empty($_SESSION['username']),
    "isAdmin"    => !empty($_SESSION['isAdmin']),
    "username"   => $_SESSION['username'] ?? null,
    "csrf_token" => $_SESSION['csrf_token'] ?? null
]);
?>