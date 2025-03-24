<?php
include 'config.php';
header("Content-Type: application/json");

// Decode JSON input
$data = json_decode(file_get_contents("php://input"), true);

// Check if all required fields are set
if (
    isset($data["name"]) &&
    isset($data["vendor_id"]) &&
    isset($data["mobile"]) &&
    isset($data["location"]) &&
    isset($data["address"]) &&
    isset($data["state"])
) {
    $name       = $conn->real_escape_string($data["name"]);
    $vendor_id  = $conn->real_escape_string($data["vendor_id"]);
    $mobile     = $conn->real_escape_string($data["mobile"]);
    $location   = $conn->real_escape_string($data["location"]);
    $address    = $conn->real_escape_string($data["address"]);
    $state      = $conn->real_escape_string($data["state"]);

    // Check if vendor already exists
    $checkQuery = "SELECT * FROM vendor WHERE vendor_id = '$vendor_id'";
    $checkResult = $conn->query($checkQuery);

    if ($checkResult && $checkResult->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "Vendor Already Exists"]);
    } else {
        // Insert into database
        $sql = "INSERT INTO vendor (name, vendor_id, mobile, location, address, state)
                VALUES ('$name', '$vendor_id', '$mobile', '$location', '$address', '$state')";

        if ($conn->query($sql) === TRUE) {
            echo json_encode(["success" => true, "message" => "Engineer added successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to add engineer.", "error" => $conn->error]);
        }
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid input. All fields are required."]);
}

$conn->close();
?>
