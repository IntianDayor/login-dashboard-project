<?php
$host = "localhost";
$user = "root";
$pass = "password";
$db   = "fprojectdb_mysql";

$conn = new mysqli($host, $user, $pass, $db);

// Check connection
if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "message" => "Database connection failed"
    ]);
    exit;
}
?>