<?php
include 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

// Extract values from JSON
$tid = $data['ticket_id'] ?? null; // Ticket ID
$fund_approved = $data['fund_amount'] ?? null; // Fund Approved

// Validate inputs
if (!$tid || !$fund_approved) {
    echo json_encode(["success" => false, "error" => "Missing required fields."]);
    exit;
}

// ✅ Prepare SQL statement to update fund_approved
$update_sql = "UPDATE ticket SET fund_approved = ? WHERE id = ?";
$stmt = $conn->prepare($update_sql);

if (!$stmt) {
    echo json_encode(["success" => false, "error" => "SQL Prepare Error: " . $conn->error]);
    exit;
}

// ✅ Bind parameters properly
$stmt->bind_param("di", $fund_approved, $tid); // "d" for decimal value

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Fund amount updated successfully."]);
} else {
    echo json_encode(["success" => false, "error" => "Failed to update fund amount: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
