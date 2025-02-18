<?php
include 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['id'])) {
        $id = $data['id'];

        $sql = "UPDATE timesheet SET is_active=0 WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('i', $id);

        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(["success" => "Timesheet entry deleted successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Failed to delete timesheet entry."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Invalid input data."]);
    }

} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed."]);
}
