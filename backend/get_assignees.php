<?php
include 'config.php';

// Check if request method is GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get ticket ID from query parameter
    $id = $_GET['id'];

    // Prepare SQL statement to get ticket assignees
    $query = "SELECT assignees FROM ticket WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);

    // Initialize response array
    $response = [];

    // Execute SQL statement and handle success/error
    if ($stmt->execute()) {
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $response['assignees'] = explode(',', $row['assignees']);
        } else {
            $response['assignees'] = [];
        }
    } else {
        $response['message'] = "Failed to fetch assignees";
    }

    // Close statement and database connection
    $stmt->close();
    $conn->close();

    // Send JSON response
    echo json_encode($response);
} else {
    // If request method is not GET, return an error message
    echo json_encode(["message" => "Invalid request method"]);
}

