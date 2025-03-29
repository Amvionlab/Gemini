<?php
include 'config.php';

if (!isset($_GET['ticket_id'])) {
    echo json_encode(["success" => false, "error" => "Missing ticket_id parameter."]);
    exit;
}

$tid = intval($_GET['ticket_id']); // Ensure ticket ID is an integer

// Debugging log
error_log("Fetching fund_raised for Ticket ID: " . $tid);

$query = "SELECT fund_raised, vendor_id FROM ticket WHERE id = ?";
$stmt = $conn->prepare($query);

if (!$stmt) {
    error_log("SQL Prepare Error: " . $conn->error);
    echo json_encode(["success" => false, "error" => "SQL Prepare Error: " . $conn->error]);
    exit;
}

$stmt->bind_param("i", $tid);
$stmt->execute();
$stmt->bind_result($fund_raised, $vendor_id);

if ($stmt->fetch()) {
    error_log("Fund Raised: " . $fund_raised);
    echo json_encode(["success" => true, "fund_raised" => $fund_raised, "vendor_id" => $vendor_id]);
} else {
    error_log("Ticket ID not found: " . $tid);
    echo json_encode(["success" => false, "error" => "Ticket not found."]);
}

$stmt->close();
$conn->close();
?>
