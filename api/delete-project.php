<?php
include "auth-check.php";
requireAdmin();
verifyCsrf();

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$id = intval($data['id'] ?? 0);

if (!$id) {
    echo json_encode(["success" => false, "message" => "Invalid project ID"]);
    exit;
}

// Get image paths before deleting so we can remove the files from disk
$imgStmt = $conn->prepare("SELECT image_path FROM project_previews WHERE project_id = ?");
$imgStmt->bind_param("i", $id);
$imgStmt->execute();
$imgResult = $imgStmt->get_result();
while ($row = $imgResult->fetch_assoc()) {
    $filePath = __DIR__ . "/../" . $row['image_path'];
    if (file_exists($filePath)) unlink($filePath);
}
$imgStmt->close();

// Delete preview rows
$delPrev = $conn->prepare("DELETE FROM project_previews WHERE project_id = ?");
$delPrev->bind_param("i", $id);
$delPrev->execute();
$delPrev->close();

// Delete the project
$stmt = $conn->prepare("DELETE FROM projects WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to delete project"]);
}
$stmt->close();
?>