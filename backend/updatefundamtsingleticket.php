<?php
include 'config.php';

// Use $_POST when sending form-encoded data
$tid = $_POST['ticket_id'] ?? null;
$fund_raised = $_POST['fund_amount'] ?? null;

// Validate inputs
if (!$tid || !$fund_raised) {
    echo json_encode(["success" => false, "error" => "Missing required fields."]);
    exit;
}

$update_sql = "UPDATE ticket SET fund_raised = ? WHERE id = ?";
$stmt = $conn->prepare($update_sql);

if (!$stmt) {
    echo json_encode(["success" => false, "error" => "SQL Prepare Error: " . $conn->error]);
    exit;
}

$stmt->bind_param("si", $fund_raised, $tid);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Fund amount updated successfully."]);
} else {
    echo json_encode(["success" => false, "error" => "Failed to update fund amount: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
