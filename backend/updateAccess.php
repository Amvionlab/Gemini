<?php
include 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

$id = $data['id'];
$field = $data['field'];
$value = $data['value'];

$sql = "UPDATE access SET $field = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ii", $value, $id);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => $conn->error]);
}

$stmt->close();
$conn->close();
