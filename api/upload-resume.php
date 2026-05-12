<?php
include "auth-check.php";
requireAdmin();
verifyCsrf();

header("Content-Type: application/json");

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

// Unique File Name to avoid overwriting and replaces any character that isn't a letter, number, dot, dash, or underscore with a "_".
$safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);
$newName = time() . "_" . $safeName;

$uploadDir = __DIR__ . "/../assets/uploads/resumes/";

// Check if move succeeded before touching the database
if (!move_uploaded_file($tmpname, $uploadDir . $newName)) {
    echo json_encode(["success" => false, "message" => "Failed to save file. Check folder permissions."]);
    exit;
}

// Only runs if file was saved successfully
$filePath = "assets/uploads/resumes/" . $newName;
$stmt = $conn->prepare("INSERT INTO resumes (file_name, file_path) VALUES (?, ?)");
$stmt->bind_param("ss", $safeName, $filePath);
$stmt->execute();

echo json_encode(["success" => true, "message" => "Resume uploaded successfully"]);
?>