<?php
require_once __DIR__ . '/auth-check.php';
requireLogin();

header('Content-Type: application/json');

$conn->query(
    'CREATE TABLE IF NOT EXISTS dashboard_content (
        id INT PRIMARY KEY DEFAULT 1,
        content TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )'
);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $conn->query('SELECT content FROM dashboard_content WHERE id = 1 LIMIT 1');
    $content = $result ? ($result->fetch_assoc()['content'] ?? null) : null;
    echo json_encode(['success' => true, 'content' => $content]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

requireAdmin();
verifyCsrf();
require_once __DIR__ . '/sanitize.php';

$content = sanitizeRichText(trim($_POST['content'] ?? ''));
if ($content === '') {
    echo json_encode(['success' => false, 'message' => 'About content cannot be empty.']);
    exit;
}

$stmt = $conn->prepare(
    'INSERT INTO dashboard_content (id, content) VALUES (1, ?)
     ON DUPLICATE KEY UPDATE content = VALUES(content)'
);
$stmt->bind_param('s', $content);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'About section updated successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error.']);
}
