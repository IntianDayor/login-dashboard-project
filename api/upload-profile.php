<?php
include "auth-check.php";
requireAdmin();
verifyCsrf();
include "r2.php";

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit;
}

$description = trim($_POST['description'] ?? '');
$imagePath   = null;

if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] === UPLOAD_ERR_OK) {

    $allowed = ['image/jpeg', 'image/png', 'image/webp'];
    $mime    = mime_content_type($_FILES['profile_picture']['tmp_name']);

    if ($_FILES['profile_picture']['size'] > 2 * 1024 * 1024) {
        echo json_encode(["success" => false, "message" => "Image too large. Maximum size is 2MB."]);
        exit;
    }

    if (!in_array($mime, $allowed)) {
        echo json_encode(["success" => false, "message" => "Only JPG, PNG, or WebP images are allowed"]);
        exit;
    }

    $mimeToExt = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $extension = $mimeToExt[$mime];
    $newName   = uniqid('profile_', true) . '.' . $extension;

    $r2Key     = "images/profile/" . $newName;
    $imagePath = uploadToR2($_FILES['profile_picture']['tmp_name'], $r2Key, $mime);
}

if ($imagePath !== null) {
    $stmt = $conn->prepare("
        INSERT INTO profile (id, description, profile_picture)
        VALUES (1, ?, ?)
        ON DUPLICATE KEY UPDATE description = VALUES(description), profile_picture = VALUES(profile_picture)
    ");
    $stmt->bind_param("ss", $description, $imagePath);
} else {
    $stmt = $conn->prepare("
        INSERT INTO profile (id, description)
        VALUES (1, ?)
        ON DUPLICATE KEY UPDATE description = VALUES(description)
    ");
    $stmt->bind_param("s", $description);
}

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Profile updated successfully"]);
} else {
    echo json_encode(["success" => false, "message" => "Database error"]);
}
?>