<?php
include "auth-check.php";
requireLogin();

header("Content-Type: application/json");

$result = $conn->query("SELECT id, file_name, file_path, uploaded_at FROM resumes ORDER BY uploaded_at DESC");
if (!$result) { echo json_encode([]); exit; }
$resumes = [];

while ($row = $result->fetch_assoc()) {
    $resumes[] = $row;
}

echo json_encode($resumes);

?>