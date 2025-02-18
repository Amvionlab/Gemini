<?php
include 'config.php';

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Decode JSON input from the request body
    $input = json_decode(file_get_contents('php://input'), true);

    // Extract data from JSON input
    $id = $input['id'];
    $newStatus = $input['status'];

    // Prepare SQL statement to update ticket status
    $query = "UPDATE ticket SET status = ? WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ii", $newStatus, $id);

    // Initialize response array
    $response = [];

    // Execute SQL statement and handle success/error
    if ($stmt->execute()) {
        $response['message'] = "Status updated successfully";
    } else {
        $response['message'] = "Failed to update status";
    }

    // Close statement and database connection
    $stmt->close();
    $conn->close();

    // Send JSON response
    echo json_encode($response);
} else {
    // If request method is not POST, return an error message
    echo json_encode(["message" => "Invalid request method"]);
}
?>
