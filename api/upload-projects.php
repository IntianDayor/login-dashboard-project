<?php
header("Content-Type: application/json");
include "db.php";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $title = $_POST['title'] ?? '';
    $description = $_POST['description'] ?? '';
    $project_link = $_POST['link'] ?? null;

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

            foreach ($_FILES['images']['tmp_name'] as $key => $tmpName) {

                $imageName = uniqid() . '_' . $_FILES['images']['name'][$key];
                $imagePath = "assets/uploads/images/projects/" . $imageName;

                move_uploaded_file($tmpName, $uploadDir . $imageName);

                // Insert into previews table
                $imgStmt = $conn->prepare("
                    INSERT INTO project_previews (project_id, image_path)
                    VALUES (?, ?)
                ");
                $imgStmt->bind_param("is", $project_id, $imagePath);
                $imgStmt->execute();
                $imgStmt->close();
            }
        }

        echo json_encode([
            "success" => true,
            "message" => "Project and previews uploaded"
        ]);

    } else {
        echo json_encode([
            "success" => false,
            "message" => "Database error: " . $stmt->error
        ]);
    }

    $stmt->close();

} else {
    echo json_encode(["success" => false, "message" => "Invalid request"]);
}
?>