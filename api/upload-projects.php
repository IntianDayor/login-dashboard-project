<?php
include "auth-check.php";
requireAdmin();
verifyCsrf();
include "r2.php";
include "sanitize.php";

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $title        = trim($_POST['title'] ?? '');
    $description  = sanitizeRichText(trim($_POST['description'] ?? ''));
    $project_link = trim($_POST['link'] ?? '') ?: null;

    if (empty($title)) {
        echo json_encode(["success" => false, "message" => "Project title is required."]);
        exit;
    }
    if (strlen($title) > 255) {
        echo json_encode(["success" => false, "message" => "Title too long. Maximum 255 characters."]);
        exit;
    }

    $stmt = $conn->prepare("
        INSERT INTO projects (title, description, project_link)
        VALUES (?, ?, ?)
    ");
    $stmt->bind_param("sss", $title, $description, $project_link);

    if ($stmt->execute()) {

        $project_id = $stmt->insert_id;

        if (!empty($_FILES['images']['name'][0])) {

            $imgStmt = $conn->prepare("
                INSERT INTO project_previews (project_id, image_path)
                VALUES (?, ?)
            ");

            foreach ($_FILES['images']['tmp_name'] as $key => $tmpName) {

                if ($_FILES['images']['size'][$key] > 5 * 1024 * 1024) {
                    continue;
                }

                $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
                $fileMime     = mime_content_type($_FILES['images']['tmp_name'][$key]);
                if (!in_array($fileMime, $allowedMimes)) {
                    continue;
                }

                $mimeToExt = [
                    'image/jpeg' => 'jpg',
                    'image/png'  => 'png',
                    'image/webp' => 'webp',
                    'image/gif'  => 'gif',
                ];
                $safeExt   = $mimeToExt[$fileMime];
                $imageName = uniqid() . '.' . $safeExt;

                $r2Key = "images/projects/" . $imageName;

                try {
                    $imagePath = uploadToR2($tmpName, $r2Key, $fileMime);
                } catch (\Aws\S3\Exception\S3Exception $e) {
                    error_log("R2 upload failed for project image '$r2Key': " . $e->getMessage());
                    continue; // skip this image, keep processing the rest
                }

                $imgStmt->bind_param("is", $project_id, $imagePath);
                $imgStmt->execute();
            }

            $imgStmt->close();
        }

        echo json_encode([
            "success" => true,
            "message" => "Project and previews uploaded"
        ]);

    } else {
        error_log("Project insert failed: " . $stmt->error);
        echo json_encode([
            "success" => false,
            "message" => "Failed to upload project. Please try again."
        ]);
    }

    $stmt->close();

} else {
    echo json_encode(["success" => false, "message" => "Invalid request"]);
}
?>