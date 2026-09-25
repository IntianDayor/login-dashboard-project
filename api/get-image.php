<?php
include "auth-check.php";
requireLogin();
require_once __DIR__ . '/portfolio-data.php';

$key = $_GET['key'] ?? '';

if (!$key || !preg_match('#^images/(projects|profile)/[a-zA-Z0-9._-]+$#', $key)) {
    http_response_code(400);
    exit;
}

try {
    $image = getProjectImageBytes($key);

    header('Content-Type: ' . $image['contentType']);
    header('Cache-Control: public, max-age=86400');
    echo $image['body'];

} catch (\Aws\S3\Exception\S3Exception $e) {
    error_log("R2 getObject failed for key '$key': " . $e->getMessage());
    http_response_code(404);
}
?>