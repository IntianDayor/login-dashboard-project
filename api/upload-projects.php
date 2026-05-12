<?php
include "auth-check.php";
requireAdmin();
verifyCsrf();

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $project_link = trim($_POST['link'] ?? '') ?: null;

    if (empty($title)) {
        echo json_encode(["success" => false, "message" => "Project title is required."]);
        exit;
    }
    if (strlen($title) > 255) {
        echo json_encode(["success" => false, "message" => "Title too long. Maximum 255 characters."]);
        exit;
    }

    // Insert Projects First
    $stmt = $conn->prepare("
        INSERT INTO projects (title, description, project_link)
        VALUES (?, ?, ?)
    ");
    $stmt->bind_param("sss", $title, $description, $project_link);

    if ($stmt->execute()) {

        // Get the inserted project ID
        $project_id = $stmt->insert_id;

        // Handle MULTIPLE preview images
        if (!empty($_FILES['images']['name'][0])) {

            $uploadDir = __DIR__ . "/../assets/uploads/images/projects/";
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            // Insert into previews table
            $imgStmt = $conn->prepare("
                INSERT INTO project_previews (project_id, image_path)
                VALUES (?, ?)
            ");

            foreach ($_FILES['images']['tmp_name'] as $key => $tmpName) {

                // Skip files over 5MB
                if ($_FILES['images']['size'][$key] > 5 * 1024 * 1024) {
                    continue;
                }

                // Validate MIME type — only allow real images
                $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
                $fileMime = mime_content_type($_FILES['images']['tmp_name'][$key]);
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
                
                $imagePath = "assets/uploads/images/projects/" . $imageName;

                // Skip DB insert for this image if move failed
                if (!move_uploaded_file($tmpName, $uploadDir . $imageName)) {
                    continue;
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
        error_log("Project insert failed: " . $stmt->error); // logs to server, invisible to users
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