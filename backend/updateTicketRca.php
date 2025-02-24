<?php
// Allow CORS & JSON handling
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Enable error reporting for debugging (Remove in production)
error_reporting(E_ALL);
ini_set("display_errors", 1);

// Database credentials
$servername = "localhost";
$username = "root";  // Change if necessary
$password = "";      // Change if necessary
$dbname = "GEmini";  // Update database name

// Connect to MySQL
$conn = new mysqli($servername, $username, $password, $dbname);

// Check database connection
if ($conn->connect_error) {
    echo json_encode(["success" => false, "error" => "Database connection failed: " . $conn->connect_error]);
    exit;
}

// Read JSON request body
$data = json_decode(file_get_contents("php://input"), true);

// Extract required fields
$tid = $data['ticket_id'] ?? null; // Ticket ID
$rca_id = $data['rca_id'] ?? null; // RCA ID

// Validate inputs
if (!$tid || !$rca_id) {
    echo json_encode(["success" => false, "error" => "Missing required fields."]);
    exit;
}

// ✅ Update RCA ID in the correct ticket (Only update matching `tid`)
$update_ticket_sql = "UPDATE ticket SET rca_id = ? WHERE id = ?";
$stmt = $conn->prepare($update_ticket_sql);

if (!$stmt) {
    echo json_encode(["success" => false, "error" => "SQL Prepare Error: " . $conn->error]);
    exit;
}

$stmt->bind_param("ii", $rca_id, $tid);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Ticket RCA updated successfully."]);
} else {
    echo json_encode(["success" => false, "error" => "Failed to update ticket: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
