<?php
include "auth-check.php";
requireLogin();
include "r2.php";

$result = $conn->query("SELECT file_path FROM resumes ORDER BY uploaded_at DESC LIMIT 1");
$resume = $result ? $result->fetch_assoc() : null;
$key = $resume ? getR2KeyFromPublicUrl($resume['file_path']) : null;

if (!$key || !preg_match('#^resumes/[a-zA-Z0-9._-]+\.pdf$#i', $key)) {
    http_response_code(404);
    exit;
}

try {
    $file = getR2Client()->getObject([
        'Bucket' => envValue('R2_BUCKET'),
        'Key' => $key,
    ]);

    header('Content-Type: application/pdf');
    header('Cache-Control: private, max-age=3600');
    echo $file['Body'];
} catch (\Aws\S3\Exception\S3Exception $e) {
    error_log("R2 getObject failed for resume '$key': " . $e->getMessage());
    http_response_code(404);
}
?>
