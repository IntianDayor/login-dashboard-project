<?php
include "db.php";

$result = $conn->query("SELECT * FROM resumes ORDER BY uploaded_at DESC");
$resumes = [];

while ($row = $result->fetch_assoc()) {
    $resumes[] = $row;
}

echo json_encode($resumes);

?>