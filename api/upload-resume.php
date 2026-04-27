<?php
header("Content-Type: application/json");
include "db.php";

if ($_FILES['resume']['error'] == 0) {

    $filename = $_FILES['resume']['name'];
    $tmpname = $_FILES['resume']['tmp_name'];

    // Make file name unique to avoid overwriting
    $newName = time() . "_" . $filename;

    // Move the uploaded file to the "resumes" directory
    $uploadPath = "../assets/uploads/resumes/" . $newName;

    move_uploaded_file($tmpname, $uploadPath);

    //Save to Database
    $stmt = $conn->prepare("INSERT INTO resumes (file_name, file_path) VALUES (?, ?)");
    $stmt->bind_param("ss", $filename, $newName);
    $stmt->execute();

    echo json_encode(["success" => true, "message" => "Resume uploaded successfully"]);
}
?>