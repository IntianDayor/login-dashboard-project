<?php
include "auth-check.php";
requireLogin();

header('Content-Type: application/json');
include "db.php";

$sql = "SELECT * FROM profile";

$result = $conn->query($sql);

$profiles = [];
while ($row = $result->fetch_assoc()) {
    $profiles[] = $row;
}

echo json_encode($profiles);
?>