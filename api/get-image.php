<?php
include "auth-check.php";
requireLogin();
include "r2.php";

$key = $_GET['key'] ?? '';

if (!$key || !preg_match('#^images/(projects|profile)/[a-zA-Z0-9._-]+$#', $key)) {
    http_response_code(400);
    exit;
}

$s3 = getR2Client();

try {
    $result = $s3->getObject([
        'Bucket' => envValue('R2_BUCKET'),
        'Key'    => $key,
    ]);

    header('Content-Type: ' . ($result['ContentType'] ?? 'application/octet-stream'));
    header('Cache-Control: public, max-age=86400');
    echo $result['Body'];

} catch (\Aws\S3\Exception\S3Exception $e) {
    error_log("R2 getObject failed for key '$key': " . $e->getMessage());
    http_response_code(404);
}
?>