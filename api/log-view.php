<?php
require_once __DIR__ . '/bootstrap.php';
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

$data = json_decode(file_get_contents("php://input"), true);
$page = trim($data['page'] ?? '');

if ($page === '' || strlen($page) > 255 || !preg_match('#^[a-zA-Z0-9_\-./]+$#', $page)) {
    echo json_encode(["success" => false]);
    exit;
}

$username = $_SESSION['username'] ?? null;

$stmt = $conn->prepare("INSERT INTO page_views (page_path, username) VALUES (?, ?)");
$stmt->bind_param("ss", $page, $username);
$stmt->execute();

echo json_encode(["success" => true]);
?>