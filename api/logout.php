<?php
require_once __DIR__ . '/db.php';        // db connection must come first
require_once __DIR__ . '/session-db.php'; // register handler before session_start
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header("Content-Type: application/json");
echo json_encode(["success" => true]);
?>