<?php
include "auth-check.php";
requireAdmin();
verifyCsrf();
include "r2.php";

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

$maxSize = 5 * 1024 * 1024;
if ($_FILES['resume']['size'] > $maxSize) {
    echo json_encode(["success" => false, "message" => "File too large. Maximum size is 5MB."]);
    exit;
}

$filename = $_FILES['resume']['name'];
$tmpname  = $_FILES['resume']['tmp_name'];

$safeName = preg_replace('/[^a-zA-Z0-9._-]/', '_', $filename);
$newName  = time() . "_" . $safeName;

$r2Key = "resumes/" . $newName;

try {
    $filePath = uploadToR2($tmpname, $r2Key, 'application/pdf');
} catch (\Aws\S3\Exception\S3Exception $e) {
    error_log("R2 upload failed for resume '$r2Key': " . $e->getMessage());
    echo json_encode(["success" => false, "message" => "Failed to upload resume. Please try again later."]);
    exit;
}

$stmt = $conn->prepare("INSERT INTO resumes (file_name, file_path) VALUES (?, ?)");
$stmt->bind_param("ss", $safeName, $filePath);
$stmt->execute();

echo json_encode(["success" => true, "message" => "Resume uploaded successfully"]);
?>