<?php
include "auth-check.php";
requireLogin();

header('Content-Type: application/json');

$sql = "SELECT description, profile_picture FROM profile WHERE id = 1 LIMIT 1";
$result = $conn->query($sql);
$profile = $result->fetch_assoc();

$socialResult = $conn->query("SELECT github_url, linkedin_url, instagram_url, facebook_url FROM social_links WHERE id = 1 LIMIT 1");
$socialLinks = $socialResult ? $socialResult->fetch_assoc() : null;
$socialUrls = array_values(array_filter($socialLinks ?? [], static function ($value, $key) {
	return str_ends_with($key, '_url') && !empty($value);
}, ARRAY_FILTER_USE_BOTH));

echo json_encode(array_merge($profile ?? [], $socialLinks ?? [], ['social_urls' => $socialUrls]));
?>
