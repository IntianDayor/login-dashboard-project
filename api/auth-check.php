<?php
session_start();


function requireLogin() {
    if (empty($_SESSION['username'])) {
        echo json_encode(["success" => false, "message" => "Not logged in"]);
        exit;
    }
}

// Call this in any API that requires admin
function requireAdmin() {
    requireLogin();
    if (empty($_SESSION['isAdmin'])) {
        echo json_encode(["success" => false, "message" => "Access denied"]);
        exit;
    }
}
?>
?>