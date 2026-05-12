<?php
require_once __DIR__ . '/bootstrap.php';
header("Content-Type: application/json");

// Brute-force protection: max 5 attempts per 15 minutes
$attemptKey = 'login_attempts_' . md5($_SERVER['REMOTE_ADDR']);
$lockoutKey = 'login_lockout_'  . md5($_SERVER['REMOTE_ADDR']);

if (!empty($_SESSION[$lockoutKey]) && time() < $_SESSION[$lockoutKey]) {
    $wait = ceil(($_SESSION[$lockoutKey] - time()) / 60);
    echo json_encode(["success" => false, "message" => "Too many attempts. Try again in {$wait} minute(s)."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

// Validate input
if (empty($data['username']) || empty($data['password'])) {
  echo json_encode(["success" => false, "message" => "All fields required"]);
  exit;
}

$username = $data['username'];
$password = $data['password'];

$sql = "SELECT * FROM users WHERE username=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $username);
$stmt->execute();

$result = $stmt->get_result();

// Check if user exists and verify password and if the user is an admin or not.
if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user['password'])) {

        // Clear Attempts on successful login
        unset($_SESSION[$attemptKey], $_SESSION[$lockoutKey]);

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

        $_SESSION[$attemptKey] = ($_SESSION[$attemptKey] ?? 0) + 1;
        if ($_SESSION[$attemptKey] >= 5) {
            $_SESSION[$lockoutKey] = time() + (15 * 60);
            unset($_SESSION[$attemptKey]);
        }

        echo json_encode(["success" => false, "message" => "Invalid Username or Password"]);
    }
} else {

    $_SESSION[$attemptKey] = ($_SESSION[$attemptKey] ?? 0) + 1;
    if ($_SESSION[$attemptKey] >= 5) {
        $_SESSION[$lockoutKey] = time() + (15 * 60);
        unset($_SESSION[$attemptKey]);
    }
    
    echo json_encode(["success" => false, "message" => "Invalid Username or Password"]);
}
?>