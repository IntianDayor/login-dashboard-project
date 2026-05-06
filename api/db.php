<?php

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . "/..");
$dotenv->safeLoad();

$host = getenv('DB_HOST') ?: $_ENV['DB_HOST'] ?? '';
$user = getenv('DB_USER') ?: $_ENV['DB_USER'] ?? '';
$pass = getenv('DB_PASS') ?: $_ENV['DB_PASS'] ?? '';
$name = getenv('DB_NAME') ?: $_ENV['DB_NAME'] ?? '';

$conn = new mysqli($host, $user, $pass, $name);

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Database connection error."]));
}
?>