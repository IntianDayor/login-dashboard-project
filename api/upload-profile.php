<?php
include "auth-check.php";
requireAdmin();
verifyCsrf();
include "r2.php";
include "sanitize.php";

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
    exit;
}

$description = sanitizeRichText(trim($_POST['description'] ?? ''));
$imagePath   = null;

function sanitizeSocialUrl(string $url): ?string {
    $url = trim($url);
    if ($url === '') {
        return null;
    }

    if (strlen($url) > 500 || !filter_var($url, FILTER_VALIDATE_URL)) {
        return false;
    }

    $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
    return in_array($scheme, ['http', 'https'], true) ? $url : false;
}

$socialFields = ['github_url', 'linkedin_url', 'instagram_url', 'facebook_url'];
$postedSocialUrls = $_POST['social_urls'] ?? [];
if (!is_array($postedSocialUrls)) {
    $postedSocialUrls = [];
}
$socialLinks = [];
foreach ($socialFields as $index => $field) {
    $rawUrl = array_key_exists($index, $postedSocialUrls)
        ? $postedSocialUrls[$index]
        : ($_POST[$field] ?? '');
    $socialLinks[$field] = sanitizeSocialUrl($rawUrl);
    if ($socialLinks[$field] === false) {
        echo json_encode(["success" => false, "message" => "Please enter valid social links that start with http:// or https://."]);
        exit;
    }
}

if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] === UPLOAD_ERR_OK) {

    $allowed = ['image/jpeg', 'image/png', 'image/webp'];
    $mime    = mime_content_type($_FILES['profile_picture']['tmp_name']);

    if ($_FILES['profile_picture']['size'] > 2 * 1024 * 1024) {
        echo json_encode(["success" => false, "message" => "Image too large. Maximum size is 2MB."]);
        exit;
    }

    if (!in_array($mime, $allowed)) {
        echo json_encode(["success" => false, "message" => "Only JPG, PNG, or WebP images are allowed"]);
        exit;
    }

    $mimeToExt = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $extension = $mimeToExt[$mime];
    $newName   = uniqid('profile_', true) . '.' . $extension;

    $r2Key = "images/profile/" . $newName;

    try {
        $imagePath = uploadToR2($_FILES['profile_picture']['tmp_name'], $r2Key, $mime);
    } catch (\Aws\S3\Exception\S3Exception $e) {
        error_log("R2 upload failed for profile picture '$r2Key': " . $e->getMessage());
        echo json_encode(["success" => false, "message" => "Failed to upload profile picture. Please try again later."]);
        exit;
    }
}

if ($imagePath !== null) {
    $stmt = $conn->prepare("
        INSERT INTO profile (id, description, profile_picture)
        VALUES (1, ?, ?)
        ON DUPLICATE KEY UPDATE description = VALUES(description), profile_picture = VALUES(profile_picture)
    ");
    $stmt->bind_param("ss", $description, $imagePath);
} else {
    $stmt = $conn->prepare("
        INSERT INTO profile (id, description)
        VALUES (1, ?)
        ON DUPLICATE KEY UPDATE description = VALUES(description)
    ");
    $stmt->bind_param("s", $description);
}

if ($stmt->execute()) {
    $socialStmt = $conn->prepare("
        INSERT INTO social_links (id, github_url, linkedin_url, instagram_url, facebook_url)
        VALUES (1, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            github_url = VALUES(github_url),
            linkedin_url = VALUES(linkedin_url),
            instagram_url = VALUES(instagram_url),
            facebook_url = VALUES(facebook_url)
    ");
    $socialStmt->bind_param(
        "ssss",
        $socialLinks['github_url'],
        $socialLinks['linkedin_url'],
        $socialLinks['instagram_url'],
        $socialLinks['facebook_url']
    );

    if (!$socialStmt->execute()) {
        echo json_encode(["success" => false, "message" => "Profile saved, but social links could not be saved. Run the latest database migration."]);
        exit;
    }

    echo json_encode(["success" => true, "message" => "Profile updated successfully"]);
} else {
    echo json_encode(["success" => false, "message" => "Database error"]);
}
?>
