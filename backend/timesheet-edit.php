<?php
include 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if (isset($data['id'], $data['date'], $data['description'], $data['from_time'], $data['to_time'], $data['total_hours'], $data['done_by'])) {
        $id = $data['id'];
        $date = $data['date'];
        $description = $data['description'];
        $from_time = $data['from_time'];
        $to_time = $data['to_time'];
        $total_hours = $data['total_hours'];
        $done_by = $data['done_by'];

        $sql = "UPDATE timesheet SET date = ?, description = ?, starttime = ?, endtime = ?, totalhours = ?, done_by = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param('ssssssi', $date, $description, $from_time, $to_time, $total_hours, $done_by, $id);

        if ($stmt->execute()) {
            http_response_code(200);
            echo json_encode(["success" => "Timesheet entry updated successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Failed to update timesheet entry."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Invalid input data."]);
    }

}  else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed."]);
}
