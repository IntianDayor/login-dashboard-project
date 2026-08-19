<?php
include "auth-check.php";
requireAdmin();
verifyCsrf();

header("Content-Type: application/json");

$conn->query(
    "CREATE TABLE IF NOT EXISTS page_views (
        id INT AUTO_INCREMENT PRIMARY KEY,
        page_path VARCHAR(255) NOT NULL,
        username VARCHAR(100) NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_page_path (page_path),
        INDEX idx_viewed_at (viewed_at)
    )"
);

$total = (int) ($conn->query("SELECT COUNT(*) AS c FROM page_views")->fetch_assoc()['c'] ?? 0);
$today = (int) ($conn->query("SELECT COUNT(*) AS c FROM page_views WHERE DATE(viewed_at) = CURDATE()")->fetch_assoc()['c'] ?? 0);

$byPage = [];
$result = $conn->query("
    SELECT page_path, COUNT(*) AS views
    FROM page_views
    GROUP BY page_path
    ORDER BY views DESC
    LIMIT 10
");

if ($result) {
    while ($row = $result->fetch_assoc()) $byPage[] = $row;
}

$days = isset($_GET['days']) ? max(1, min(90, (int) $_GET['days'])) : 30;

$viewsByDay = [];
$stmt = $conn->prepare("
    SELECT DATE(viewed_at) AS day, COUNT(*) AS views
    FROM page_views
    WHERE viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY DATE(viewed_at)
    ORDER BY day ASC
");
$stmt->bind_param("i", $days);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) $viewsByDay[] = $row;

echo json_encode([
    "success"    => true,
    "total"      => $total,
    "today"      => $today,
    "byPage"     => $byPage,
    "viewsByDay" => $viewsByDay
]);
?>