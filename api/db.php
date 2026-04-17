<?php
$host = "localhost";
$user = "root";
$pass = "password";
$db   = "fprojectdb_mysql";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>