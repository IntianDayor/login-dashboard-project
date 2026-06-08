<?php
require_once __DIR__ . '/bootstrap.php';
header("Content-Type: application/json");

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;

function getClientIp(): string {
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function rejectIfLocked(mysqli $conn, string $username, string $ip): void {
    $stmt = $conn->prepare("
        SELECT locked_until
        FROM login_attempts
        WHERE username = ? AND ip_address = ? AND locked_until > NOW()
        LIMIT 1
    ");
    $stmt->bind_param("ss", $username, $ip);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        return;
    }

    $wait = max(1, ceil((strtotime($row['locked_until']) - time()) / 60));
    echo json_encode(["success" => false, "message" => "Too many attempts. Try again in {$wait} minute(s)."]);
    exit;
}

function recordFailedLogin(mysqli $conn, string $username, string $ip): void {
    $lockMinutes = LOGIN_LOCK_MINUTES;
    $maxAttempts = MAX_LOGIN_ATTEMPTS;

    $stmt = $conn->prepare("
        INSERT INTO login_attempts (username, ip_address, attempts, locked_until, last_attempt)
        VALUES (?, ?, 1, NULL, NOW())
        ON DUPLICATE KEY UPDATE
            attempts = CASE
                WHEN locked_until IS NOT NULL AND locked_until <= NOW() THEN 1
                WHEN last_attempt < DATE_SUB(NOW(), INTERVAL {$lockMinutes} MINUTE) THEN 1
                ELSE attempts + 1
            END,
            locked_until = CASE
                WHEN locked_until IS NOT NULL AND locked_until <= NOW() THEN NULL
                WHEN last_attempt < DATE_SUB(NOW(), INTERVAL {$lockMinutes} MINUTE) THEN NULL
                WHEN attempts + 1 >= {$maxAttempts} THEN DATE_ADD(NOW(), INTERVAL {$lockMinutes} MINUTE)
                ELSE locked_until
            END,
            last_attempt = NOW()
    ");
    $stmt->bind_param("ss", $username, $ip);
    $stmt->execute();
    $stmt->close();
}

function clearLoginAttempts(mysqli $conn, string $username, string $ip): void {
    $stmt = $conn->prepare("DELETE FROM login_attempts WHERE username = ? AND ip_address = ?");
    $stmt->bind_param("ss", $username, $ip);
    $stmt->execute();
    $stmt->close();
}

$data = json_decode(file_get_contents("php://input"), true);

// Validate input
if (empty($data['username']) || empty($data['password'])) {
  echo json_encode(["success" => false, "message" => "All fields required"]);
  exit;
}

$username = trim($data['username']);
$password = $data['password'];
$ip = getClientIp();

rejectIfLocked($conn, $username, $ip);

$sql = "SELECT username, password, name, role FROM users WHERE username=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $username);
$stmt->execute();

$result = $stmt->get_result();

// Check if user exists and verify password and if the user is an admin or not.
if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user['password'])) {

        clearLoginAttempts($conn, $username, $ip);

        session_regenerate_id(true);

        $_SESSION['username'] = $user['username'];
        $_SESSION['isAdmin']  = ($user['role'] === 'admin');
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

        echo json_encode([
            "success" => true,
            "isAdmin" => $user['role'] === 'admin',
            "csrf_token" => $_SESSION['csrf_token'],
            "user" => [
                "username" => $user['username'],
                "name"     => $user['name'],
            ]
        ]);
    } else {

        recordFailedLogin($conn, $username, $ip);
        echo json_encode(["success" => false, "message" => "Invalid Username or Password"]);
    }
} else {

    recordFailedLogin($conn, $username, $ip);
    echo json_encode(["success" => false, "message" => "Invalid Username or Password"]);
}
?>
