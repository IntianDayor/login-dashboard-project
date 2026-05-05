<?php
session_start();
header("Content-Type: application/json");
include "db.php";

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

        $_SESSION['username'] = $user['username'];
        $_SESSION['isAdmin']  = ($user['role'] === 'admin');

        echo json_encode([
            "success" => true, 
            "isAdmin" => $user['role'] === 'admin',
            "user" => [
                "username" => $user['username'],
                "name"     => $user['name'],
            ]
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid Username or Password"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid Username or Password"]);
}
?>