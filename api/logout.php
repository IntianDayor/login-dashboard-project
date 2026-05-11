<?php

require_once __DIR__ . '/bootstrap.php';

header("Content-Type: application/json");

$_SESSION = [];
session_destroy();

echo json_encode(["success" => true]);
?>