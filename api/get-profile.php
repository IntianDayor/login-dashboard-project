<?php
include "auth-check.php";
requireLogin();
require_once __DIR__ . '/portfolio-data.php';

header('Content-Type: application/json');

echo json_encode(getProfileData($conn));
?>
