<?php
include "auth-check.php";
requireAdmin();

header("Content-Type: application/json");
include "db.php";

$sql = "SELECT id, username, name, email, DATE(`created_at`) AS created_at FROM users";

$result = $conn->query($sql);

$users = array();
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
}

echo json_encode($users);
$conn->close();
?>