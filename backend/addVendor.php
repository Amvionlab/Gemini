<?php
include 'config.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if (isset($data["name"])) {
    $name = $conn->real_escape_string($data["name"]);

    // ✅ Insert the vendor (engineer) into the database
    $sql = "INSERT INTO vendor (name) VALUES ('$name')";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(["success" => true, "message" => "Engineer added successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to add engineer."]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid input."]);
}

$conn->close();
?>
