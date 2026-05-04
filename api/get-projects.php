<?php
header("Content-Type: application/json");
include "db.php";

$sql = "
SELECT 
    p.id,
    p.title,
    p.description,
    p.project_link,
    GROUP_CONCAT(pp.image_path) AS images
FROM projects p
LEFT JOIN project_previews pp ON p.id = pp.project_id
GROUP BY p.id
ORDER BY p.id DESC
";

$result = $conn->query($sql);
if (!$result) { echo json_encode([]); exit; }

$projects = [];

while ($row = $result->fetch_assoc()) {
    $row['images'] = $row['images'] 
        ? explode(",", $row['images']) 
        : [];
    $projects[] = $row;
}

echo json_encode($projects);
?>