<?php
header("Content-Type: application/json");
include "db.php";

$data = json_decode(file_get_contents("php://input"), true);

// Check if all fields are filled
if (!$data || empty($data['username']) || empty($data['password']) || empty($data['fullname']) || empty($data['email'])) {
    echo json_encode(["success" => false, "message" => "All fields are required"]);
    exit;
}

$username = trim($data['username']);
$password = $data['password'];
$name = trim($data['fullname']);
$email = trim($data['email']);
$role = "user"; // Default role for new users

// Enforce input length limits
if (strlen($username) > 50) {
    echo json_encode(["success" => false, "message" => "Username too long. Maximum 50 characters."]);
    exit;
}
if (strlen($name) > 150) {
    echo json_encode(["success" => false, "message" => "Full name too long. Maximum 150 characters."]);
    exit;
}
if (strlen($email) > 150) {
    echo json_encode(["success" => false, "message" => "Email too long. Maximum 150 characters."]);
    exit;
}
if (strlen($password) < 6) {
    echo json_encode(["success" => false, "message" => "Password must be at least 6 characters."]);
    exit;
}

// Check if username already exists
$sql = "SELECT id FROM users WHERE username = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $username);
$stmt->execute();
if ($stmt->get_result()->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Username already taken"]);
    exit;
}

// Check if email already exists
$sql = "SELECT id FROM users WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
if ($stmt->get_result()->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "Email already registered"]);
    exit;
}

// Hash the password for security
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Insert new user
$sql = "INSERT INTO users (username, password, name, email, role) VALUES (?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sssss", $username, $hashedPassword, $name, $email, $role);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "message" => "Registration failed"]);
}
?>