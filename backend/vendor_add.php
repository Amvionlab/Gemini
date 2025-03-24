<?php
include 'config.php';
header("Content-Type: application/json");

// Collect POST data from FormData submission
$vendor   = $_POST['vendor'] ?? '';
$vendorid = $_POST['vendorid'] ?? '';
$mobile   = $_POST['mobile'] ?? '';
$location = $_POST['location'] ?? '';
$address  = $_POST['address'] ?? '';
$state    = $_POST['state'] ?? '';

// Debug
file_put_contents('debug_log.txt', print_r($_POST, true));

if ($vendor && $vendorid && $mobile && $location && $address && $state) {
    $name       = $conn->real_escape_string($vendor);
    $vendor_id  = $conn->real_escape_string($vendorid);
    $mobile     = $conn->real_escape_string($mobile);
    $location   = $conn->real_escape_string($location);
    $address    = $conn->real_escape_string($address);
    $state      = $conn->real_escape_string($state);

    // Check if vendor already exists
    $checkQuery = "SELECT * FROM vendor WHERE vendor_id = '$vendor_id'";
    $checkResult = $conn->query($checkQuery);

    if ($checkResult && $checkResult->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "Vendor Already Exists"]);
    } else {
        $sql = "INSERT INTO vendor (name, vendor_id, mobile, location, address, state)
                VALUES ('$name', '$vendor_id', '$mobile', '$location', '$address', '$state')";

        if ($conn->query($sql) === TRUE) {
            echo json_encode(["success" => true, "message" => "Vendor added successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to add vendor.", "error" => $conn->error]);
        }
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid input. All fields are required."]);
}

$conn->close();
?>
