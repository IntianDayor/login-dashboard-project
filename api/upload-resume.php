<?php
include "auth-check.php";
requireAdmin();

header("Content-Type: application/json");
include "db.php";

if (!isset($_FILES['resume']) || $_FILES['resume']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(["success" => false, "message" => "No file uploaded or upload error"]);
    exit;
}

$mime = mime_content_type($_FILES['resume']['tmp_name']);
if (!in_array($mime, ['application/pdf'])) {
    echo json_encode(["success" => false, "message" => "Only PDF files are allowed"]);
    exit;
}

// Reject files over 5MB
$maxSize = 5 * 1024 * 1024; // 5MB in bytes
if ($_FILES['resume']['size'] > $maxSize) {
    echo json_encode(["success" => false, "message" => "File too large. Maximum size is 5MB."]);
    exit;
}

$filename = $_FILES['resume']['name'];
$tmpname = $_FILES['resume']['tmp_name'];

// Unique File Name to avoid overwriting
$newName = time() . "_" . $filename;

$uploadDir = __DIR__ . "/../assets/uploads/resumes/";

// Check if move succeeded before touching the database
if (!move_uploaded_file($tmpname, $uploadDir . $newName)) {
    echo json_encode(["success" => false, "message" => "Failed to save file. Check folder permissions."]);
    exit;
}

// Only runs if file was saved successfully
$stmt = $conn->prepare("INSERT INTO resumes (file_name, file_path) VALUES (?, ?)");
$stmt->bind_param("ss", $filename, $newName);
$stmt->execute();

echo json_encode(["success" => true, "message" => "Resume uploaded successfully"]);
?>