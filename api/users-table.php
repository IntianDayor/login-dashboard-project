<?php
include "auth-check.php";
requireAdmin();
verifyCsrf();

header("Content-Type: application/json");

$sql = "SELECT id, username, name, email, DATE(`created_at`) AS created_at, role FROM users";

$result = $conn->query($sql);

$users = array();
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
}

echo json_encode($users);
?>
