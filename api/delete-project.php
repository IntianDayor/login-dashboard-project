<?php
include "auth-check.php";
requireAdmin();
verifyCsrf();
include "r2.php";

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

// Get image paths before deleting so we can remove stored objects.
$imgStmt = $conn->prepare("SELECT image_path FROM project_previews WHERE project_id = ?");
$imgStmt->bind_param("i", $id);
$imgStmt->execute();
$imgResult = $imgStmt->get_result();
while ($row = $imgResult->fetch_assoc()) {
    $imagePath = $row['image_path'];
    $r2Key = getR2KeyFromPublicUrl($imagePath);

    if ($r2Key !== null) {
        deleteFromR2($r2Key);
        continue;
    }

    $localPath = realpath(__DIR__ . "/../" . ltrim($imagePath, "/\\"));
    $uploadsRoot = realpath(__DIR__ . "/../assets/uploads");

    if ($localPath && $uploadsRoot && strpos($localPath, $uploadsRoot) === 0 && is_file($localPath)) {
        unlink($localPath);
    }
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
