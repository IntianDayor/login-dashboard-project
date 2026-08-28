<?php
require_once __DIR__ . '/bootstrap.php';
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

$data = json_decode(file_get_contents("php://input"), true);
$page = trim($data['page'] ?? '');
$visitorId = trim($data['visitor_id'] ?? '');

if (empty($visitorId)) {
    if (!isset($_COOKIE['site_visitor_id'])) {
        $visitorId = bin2hex(random_bytes(16));
        setcookie('site_visitor_id', $visitorId, [
            'expires' => time() + (86400 * 365),
            'path' => '/',
            'httponly' => false,
            'samesite' => 'Lax'
        ]);
    } else {
        $visitorId = $_COOKIE['site_visitor_id'];
    }
}

// Sanitize visitorId
$visitorId = substr(preg_replace('/[^a-zA-Z0-9_\-]/', '', $visitorId), 0, 64);

if ($page === '' || strlen($page) > 255 || !preg_match('#^[a-zA-Z0-9_\-./]+$#', $page)) {
    echo json_encode(["success" => false]);
    exit;
}

$username = $_SESSION['username'] ?? null;

$stmt = $conn->prepare("INSERT INTO page_views (page_path, username, visitor_id) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $page, $username, $visitorId);
$stmt->execute();

echo json_encode(["success" => true]);
?>