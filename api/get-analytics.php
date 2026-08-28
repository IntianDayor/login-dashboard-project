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
        visitor_id VARCHAR(64) NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_page_path (page_path),
        INDEX idx_viewed_at (viewed_at),
        INDEX idx_visitor_id (visitor_id)
    )"
);

$colCheck = $conn->query("SHOW COLUMNS FROM page_views LIKE 'visitor_id'");
if ($colCheck && $colCheck->num_rows === 0) {
    $conn->query("ALTER TABLE page_views ADD COLUMN visitor_id VARCHAR(64) NULL, ADD INDEX idx_visitor_id (visitor_id)");
}

$filterType = $_GET['filter'] ?? 'days';
$singleDate = $_GET['date'] ?? null;
$startDate  = $_GET['start_date'] ?? null;
$endDate    = $_GET['end_date'] ?? null;
$days       = isset($_GET['days']) ? max(1, min(180, (int) $_GET['days'])) : 30;

// All-time summary metrics
$totalViews = (int) ($conn->query("SELECT COUNT(*) AS c FROM page_views")->fetch_assoc()['c'] ?? 0);
$totalUnique = (int) ($conn->query("SELECT COUNT(DISTINCT COALESCE(visitor_id, username)) AS c FROM page_views")->fetch_assoc()['c'] ?? 0);

// Today metrics
$todayViews = (int) ($conn->query("SELECT COUNT(*) AS c FROM page_views WHERE DATE(viewed_at) = CURDATE()")->fetch_assoc()['c'] ?? 0);
$todayUnique = (int) ($conn->query("SELECT COUNT(DISTINCT COALESCE(visitor_id, username)) AS c FROM page_views WHERE DATE(viewed_at) = CURDATE()")->fetch_assoc()['c'] ?? 0);

$chartData = [];
$periodViews = 0;
$periodUnique = 0;
$timeUnit = 'day';
$byPage = [];

if ($filterType === 'single_date' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $singleDate)) {
    // Single Date Filter (Grouped by Hour 00:00 - 23:00)
    $timeUnit = 'hour';

    $stmt = $conn->prepare("
        SELECT 
            DATE_FORMAT(viewed_at, '%H:00') AS hour_slot,
            COUNT(*) AS views,
            COUNT(DISTINCT COALESCE(visitor_id, username)) AS unique_visitors
        FROM page_views
        WHERE DATE(viewed_at) = ?
        GROUP BY DATE_FORMAT(viewed_at, '%H:00')
        ORDER BY hour_slot ASC
    ");
    $stmt->bind_param("s", $singleDate);
    $stmt->execute();
    $res = $stmt->get_result();

    $hourlyMap = [];
    while ($row = $res->fetch_assoc()) {
        $hourlyMap[$row['hour_slot']] = [
            'views' => (int) $row['views'],
            'unique_visitors' => (int) $row['unique_visitors']
        ];
    }

    // Populate full 24-hour range
    for ($h = 0; $h < 24; $h++) {
        $label = sprintf("%02d:00", $h);
        $views = $hourlyMap[$label]['views'] ?? 0;
        $uniques = $hourlyMap[$label]['unique_visitors'] ?? 0;
        $chartData[] = [
            'label' => $label,
            'day' => $label, // backwards compatibility
            'views' => $views,
            'unique_visitors' => $uniques
        ];
        $periodViews += $views;
    }

    // Unique count for the whole date
    $stmtSum = $conn->prepare("SELECT COUNT(DISTINCT COALESCE(visitor_id, username)) AS u FROM page_views WHERE DATE(viewed_at) = ?");
    $stmtSum->bind_param("s", $singleDate);
    $stmtSum->execute();
    $periodUnique = (int) ($stmtSum->get_result()->fetch_assoc()['u'] ?? 0);

    // Top Pages for this date
    $stmtPages = $conn->prepare("
        SELECT page_path, COUNT(*) AS views, COUNT(DISTINCT COALESCE(visitor_id, username)) AS unique_visitors
        FROM page_views
        WHERE DATE(viewed_at) = ?
        GROUP BY page_path
        ORDER BY views DESC
        LIMIT 10
    ");
    $stmtPages->bind_param("s", $singleDate);
    $stmtPages->execute();
    $resultPages = $stmtPages->get_result();
    while ($row = $resultPages->fetch_assoc()) {
        $byPage[] = $row;
    }

} elseif ($filterType === 'custom' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) {
    // Custom Date Range (Grouped by Day)
    $stmt = $conn->prepare("
        SELECT 
            DATE(viewed_at) AS label,
            COUNT(*) AS views,
            COUNT(DISTINCT COALESCE(visitor_id, username)) AS unique_visitors
        FROM page_views
        WHERE DATE(viewed_at) BETWEEN ? AND ?
        GROUP BY DATE(viewed_at)
        ORDER BY label ASC
    ");
    $stmt->bind_param("ss", $startDate, $endDate);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) {
        $v = (int) $row['views'];
        $u = (int) $row['unique_visitors'];
        $chartData[] = [
            'label' => $row['label'],
            'day' => $row['label'],
            'views' => $v,
            'unique_visitors' => $u
        ];
        $periodViews += $v;
    }

    $stmtSum = $conn->prepare("SELECT COUNT(DISTINCT COALESCE(visitor_id, username)) AS u FROM page_views WHERE DATE(viewed_at) BETWEEN ? AND ?");
    $stmtSum->bind_param("ss", $startDate, $endDate);
    $stmtSum->execute();
    $periodUnique = (int) ($stmtSum->get_result()->fetch_assoc()['u'] ?? 0);

    // Top Pages for custom range
    $stmtPages = $conn->prepare("
        SELECT page_path, COUNT(*) AS views, COUNT(DISTINCT COALESCE(visitor_id, username)) AS unique_visitors
        FROM page_views
        WHERE DATE(viewed_at) BETWEEN ? AND ?
        GROUP BY page_path
        ORDER BY views DESC
        LIMIT 10
    ");
    $stmtPages->bind_param("ss", $startDate, $endDate);
    $stmtPages->execute();
    $resultPages = $stmtPages->get_result();
    while ($row = $resultPages->fetch_assoc()) {
        $byPage[] = $row;
    }

} else {
    // Presets (7, 14, 30, etc. days)
    $stmt = $conn->prepare("
        SELECT 
            DATE(viewed_at) AS label,
            COUNT(*) AS views,
            COUNT(DISTINCT COALESCE(visitor_id, username)) AS unique_visitors
        FROM page_views
        WHERE viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(viewed_at)
        ORDER BY label ASC
    ");
    $stmt->bind_param("i", $days);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) {
        $v = (int) $row['views'];
        $u = (int) $row['unique_visitors'];
        $chartData[] = [
            'label' => $row['label'],
            'day' => $row['label'],
            'views' => $v,
            'unique_visitors' => $u
        ];
        $periodViews += $v;
    }

    $stmtSum = $conn->prepare("SELECT COUNT(DISTINCT COALESCE(visitor_id, username)) AS u FROM page_views WHERE viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)");
    $stmtSum->bind_param("i", $days);
    $stmtSum->execute();
    $periodUnique = (int) ($stmtSum->get_result()->fetch_assoc()['u'] ?? 0);

    // Top Pages
    $stmtPages = $conn->prepare("
        SELECT page_path, COUNT(*) AS views, COUNT(DISTINCT COALESCE(visitor_id, username)) AS unique_visitors
        FROM page_views
        WHERE viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY page_path
        ORDER BY views DESC
        LIMIT 10
    ");
    $stmtPages->bind_param("i", $days);
    $stmtPages->execute();
    $resultPages = $stmtPages->get_result();
    while ($row = $resultPages->fetch_assoc()) {
        $byPage[] = $row;
    }
}

echo json_encode([
    "success"       => true,
    "total"         => $totalViews,
    "totalViews"    => $totalViews,
    "totalUnique"   => $totalUnique,
    "today"         => $todayViews,
    "todayViews"    => $todayViews,
    "todayUnique"   => $todayUnique,
    "periodViews"   => $periodViews,
    "periodUnique"  => $periodUnique,
    "timeUnit"      => $timeUnit,
    "byPage"        => $byPage,
    "chartData"     => $chartData,
    "viewsByDay"    => $chartData
]);
?>