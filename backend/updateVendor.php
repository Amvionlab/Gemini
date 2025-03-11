<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

include 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["ticket_id"]) || !isset($data["vendor_ids"])) {
    echo json_encode(["error" => "Missing ticket_id or vendor_ids"]);
    exit();
}

$ticket_id = intval($data["ticket_id"]);
$vendor_ids = implode(",", array_map("intval", $data["vendor_ids"]));

// Update the ticket with selected vendor IDs
$sql = "UPDATE ticket SET vendor_id=? WHERE id=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $vendor_ids, $ticket_id);

if ($stmt->execute()) {
    echo json_encode(["message" => "Vendors updated successfully"]);
} else {
    echo json_encode(["error" => "Error updating ticket: " . $conn->error]);
}

$stmt->close();
$conn->close();
?>
