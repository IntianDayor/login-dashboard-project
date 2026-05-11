<?php
include "auth-check.php";
requireAdmin();
verifyCsrf();

header("Content-Type: application/json");
include "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$id   = intval($data['id'] ?? 0);
$role = $data['role'] ?? '';

if (!$id || !in_array($role, ['user', 'admin'])) {
    echo json_encode(['success' => false, 'error' => 'Invalid input']);
    exit;
}

$stmt = $conn->prepare("UPDATE users SET role = ? WHERE id = ?");
$stmt->bind_param("si", $role, $id);
$stmt->execute();

if ($stmt->affected_rows >= 0) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Update failed']);
}

$stmt->close();
$conn->close();
?>