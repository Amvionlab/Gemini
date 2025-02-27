<?php
include 'config.php'; // Ensure this path is correct

$data = json_decode(file_get_contents("php://input"), true);
$ticket_id = $data['ticket_id'];
$post_date = $data['post_date'];

if (empty($ticket_id) || empty($post_date)) {
    echo json_encode(["success" => false, "message" => "Invalid input"]);
    exit;
}

// Update ticket table
$sql1 = "UPDATE ticket SET post_date = ? WHERE id = ?";
$stmt1 = $conn->prepare($sql1);
$stmt1->bind_param("si", $post_date, $ticket_id);
$stmt1->execute();

// Update log table for the first occurrence where to_status = 1
$sql2 = "UPDATE log SET date = ? WHERE tid = ? AND to_status = 1 ORDER BY id ASC LIMIT 1";
$stmt2 = $conn->prepare($sql2);
$stmt2->bind_param("si", $post_date, $ticket_id);
$stmt2->execute();

echo json_encode(["success" => true, "message" => "Updated successfully"]);
?>
