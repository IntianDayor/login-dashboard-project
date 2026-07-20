<?php
include "auth-check.php";
requireAdmin();
verifyCsrf();
include "r2.php";
include "sanitize.php";

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request"]);
    exit;
}

if (!isset($_POST['id'])) {
    echo json_encode(["success" => false, "message" => "Project ID is required."]);
    exit;
}

$projectId = intval($_POST['id'] ?? 0);
$title = trim($_POST['title'] ?? '');
$description = sanitizeRichText(trim($_POST['description'] ?? ''));
$projectLink = trim($_POST['link'] ?? '') ?: null;
$replaceExisting = !empty($_POST['replace_existing']);

if (!$projectId) {
    echo json_encode(["success" => false, "message" => "Invalid project ID"]);
    exit;
}

if (empty($title)) {
    echo json_encode(["success" => false, "message" => "Project title is required."]);
    exit;
}

if (strlen($title) > 255) {
    echo json_encode(["success" => false, "message" => "Title too long. Maximum 255 characters."]);
    exit;
}

$stmt = $conn->prepare("UPDATE projects SET title = ?, description = ?, project_link = ? WHERE id = ?");
$stmt->bind_param("sssi", $title, $description, $projectLink, $projectId);

if (!$stmt->execute()) {
    $stmt->close();
    echo json_encode(["success" => false, "message" => "Failed to update project."]);
    exit;
}
$stmt->close();

if ($replaceExisting) {
    $imgStmt = $conn->prepare("SELECT image_path FROM project_previews WHERE project_id = ?");
    $imgStmt->bind_param("i", $projectId);
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

    $delPrev = $conn->prepare("DELETE FROM project_previews WHERE project_id = ?");
    $delPrev->bind_param("i", $projectId);
    $delPrev->execute();
    $delPrev->close();
}

if (!empty($_FILES['images']['name'][0])) {
    $imgStmt = $conn->prepare("INSERT INTO project_previews (project_id, image_path) VALUES (?, ?)");

    foreach ($_FILES['images']['tmp_name'] as $key => $tmpName) {
        if (empty($_FILES['images']['name'][$key])) {
            continue;
        }

        if ($_FILES['images']['size'][$key] > 5 * 1024 * 1024) {
            continue;
        }

        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $fileMime = mime_content_type($_FILES['images']['tmp_name'][$key]);
        if (!in_array($fileMime, $allowedMimes)) {
            continue;
        }

        $mimeToExt = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif',
        ];
        $safeExt = $mimeToExt[$fileMime];
        $imageName = uniqid() . '.' . $safeExt;

        $r2Key = "images/projects/" . $imageName;
        $imagePath = uploadToR2($tmpName, $r2Key, $fileMime);

        $imgStmt->bind_param("is", $projectId, $imagePath);
        $imgStmt->execute();
    }

    $imgStmt->close();
}

echo json_encode(["success" => true, "message" => "Project updated successfully"]);
?>
