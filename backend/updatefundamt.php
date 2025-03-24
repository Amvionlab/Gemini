<?php
include 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

// Extracting the values from JSON
$tid = $data['ticket_id'] ?? null; // Ticket ID
$fund_raised = $data['fund_amount'] ?? null; // Fund Raised (from fund_amount)

// Validate inputs
if (!$tid || !$fund_raised) {
    echo json_encode(["success" => false, "error" => "Missing required fields."]);
    exit;
}

// ✅ Prepare SQL statement
$update_sql = "UPDATE ticket SET fund_raised = ? WHERE id = ?";
$stmt = $conn->prepare($update_sql);

if (!$stmt) {
    echo json_encode(["success" => false, "error" => "SQL Prepare Error: " . $conn->error]);
    exit;
}

// ✅ Bind parameters properly
$stmt->bind_param("si", $fund_raised, $tid);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Fund amount updated successfully."]);
} else {
    echo json_encode(["success" => false, "error" => "Failed to update fund amount: " . $stmt->error]);
}


$stmt->close();
$conn->close();
?>
