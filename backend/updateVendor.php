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

$sql = "UPDATE ticket SET vendor_id='$vendor_ids' WHERE id=$ticket_id";
if ($conn->query($sql) === TRUE) {
    echo json_encode(["message" => "Vendors updated successfully"]);
} else {
    echo json_encode(["error" => "Error updating ticket: " . $conn->error]);
}

$conn->close();
?>
