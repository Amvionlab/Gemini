<?php
include 'config.php';

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Decode JSON input from the request body
    $input = json_decode(file_get_contents('php://input'), true);

    // Extract data from JSON input
    $username = $input['username'];
    $newPassword = $input['newPassword'];

    // Initialize response array
    $response = [];

    // Check if the username exists
    $query = "SELECT username FROM user WHERE username = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("s", $username);

    if ($stmt->execute()) {
        $stmt->store_result();
        if ($stmt->num_rows > 0) {
            // Username exists, proceed to update password
            $stmt->close();

            $query = "UPDATE user SET password = ? WHERE username = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("ss", $newPassword, $username);

            if ($stmt->execute()) {
                $response['success'] = true;
                $response['message'] = "Password updated successfully";
            } else {
                $response['success'] = false;
                $response['message'] = "Failed to update password";
            }
        } else {
            // Username does not exist
            $response['success'] = false;
            $response['message'] = "Username not found";
        }
    } else {
        $response['success'] = false;
        $response['message'] = "Error checking username";
    }

    // Close statement and database connection
    $stmt->close();
    $conn->close();

    // Send JSON response
    echo json_encode($response);
} else {
    // If request method is not POST, return an error message
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}
