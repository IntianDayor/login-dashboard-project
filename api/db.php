<?php

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . "/..");
$dotenv->load();

$host = $_ENV['DB_HOST'];
$user = $_ENV['DB_USER'];
$pass = $_ENV['DB_PASS'];
$name = $_ENV['DB_NAME'];

$conn = new mysqli($host, $user, $pass, $name);

if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Database connection error."]));
}

?>