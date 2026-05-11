<?php
include "auth-check.php";
requireLogin();

header('Content-Type: application/json');
require_once __DIR__ . '/db.php';

$sql = "SELECT description, profile_picture FROM profile WHERE id = 1 LIMIT 1";
$result = $conn->query($sql);
$profile = $result->fetch_assoc();

echo json_encode($profile ?? (object)[]);
?>