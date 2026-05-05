<?php
include "auth-check.php";
requireLogin();

header("Content-Type: application/json");
include "db.php";

$result = $conn->query("SELECT * FROM resumes ORDER BY uploaded_at DESC");
if (!$result) { echo json_encode([]); exit; }
$resumes = [];

while ($row = $result->fetch_assoc()) {
    $resumes[] = $row;
}

echo json_encode($resumes);

?>