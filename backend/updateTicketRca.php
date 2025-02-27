<?php
include 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

$tid = $data['ticket_id'] ?? null; // Ticket ID
$rca_id = $data['rca_id'] ?? null; // RCA ID
$docket = $data['docket'] ?? null;
// Validate inputs
if (!$tid || !$rca_id) {
    echo json_encode(["success" => false, "error" => "Missing required fields."]);
    exit;
}

// ✅ Update RCA ID in the correct ticket (Only update matching `tid`)
$update_ticket_sql = "UPDATE ticket SET rca_id = ?, docket_no = ? WHERE id = ?";
$stmt = $conn->prepare($update_ticket_sql);

if (!$stmt) {
    echo json_encode(["success" => false, "error" => "SQL Prepare Error: " . $conn->error]);
    exit;
}

$stmt->bind_param("isi", $rca_id, $docket, $tid);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Ticket RCA updated successfully."]);
} else {
    echo json_encode(["success" => false, "error" => "Failed to update ticket: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
