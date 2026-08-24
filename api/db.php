<?php

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . "/..");
$dotenv->safeLoad();

$host  = getenv('DB_HOST') ?: $_ENV['DB_HOST'] ?? '';
$user  = getenv('DB_USER') ?: $_ENV['DB_USER'] ?? '';
$pass  = getenv('DB_PASS') ?: $_ENV['DB_PASS'] ?? '';
$name  = getenv('DB_NAME') ?: $_ENV['DB_NAME'] ?? '';
$port  = (int) (getenv('DB_PORT') ?: $_ENV['DB_PORT'] ?? 3306);
$sslCa = getenv('DB_SSL_CA') ?: $_ENV['DB_SSL_CA'] ?? '';

$conn = mysqli_init();

if ($sslCa) {
    $conn->ssl_set(null, null, $sslCa, null, null);
    $conn->real_connect($host, $user, $pass, $name, $port, null, MYSQLI_CLIENT_SSL);
} else {
    $conn->real_connect($host, $user, $pass, $name, $port);
}

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Database connection error."]));
}

?>