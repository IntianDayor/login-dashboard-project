<?php
include "auth-check.php";
requireLogin();

header('Content-Type: application/json');
include "db.php";

$sql = "SELECT description, profile_picture FROM profile WHERE id = 1 LIMIT 1";

$result = $conn->query($sql);

$profiles = [];
while ($row = $result->fetch_assoc()) {
    $profiles[] = $row;
}

echo json_encode($profiles);
?>