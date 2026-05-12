<?php
include "auth-check.php";
requireLogin();

header('Content-Type: application/json');

$sql = "SELECT description, profile_picture FROM profile WHERE id = 1 LIMIT 1";
$result = $conn->query($sql);
$profile = $result->fetch_assoc();

echo json_encode($profile ?? (object)[]);
?>