<?php
include 'config.php';

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            throw new Exception("Invalid JSON input");
        }

        $id = $input['id'];
        $assignees = $input['assignees'];
        $doneby = $input['done'];

        if (!is_array($assignees)) {
            throw new Exception("Assignees should be an array");
        }

        $assigneesString = implode(',', $assignees);

        $query = "UPDATE ticket SET assignees = ? WHERE id = ?";
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception("Ticket update prepare failed: " . $conn->error);
        }
        $stmt->bind_param("si", $assigneesString, $id);

        $response = [];
        if ($stmt->execute()) {
            $response['message'] = "Assignees updated successfully.";
        } else {
            throw new Exception("Failed to update assignees: " . $stmt->error);
        }
        $stmt->close();

        $query = "INSERT INTO ticket_assign (tid, done_by, assignto) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($query);
        if (!$stmt) {
            throw new Exception("Ticket assign prepare failed: " . $conn->error);
        }
        $stmt->bind_param("sss", $id, $doneby, $assigneesString);

        if (!$stmt->execute()) {
            throw new Exception("Failed to create ticket_assign log: " . $stmt->error);
        }
        $stmt->close();

        $access_type = "2,3,4,5";
        $ttype = "2";
        $logText = "User has been assigned";
        $log_type = "2";
        $href = "/singleticket";
        $post_date = date('Y-m-d H:i:s');

        $latestQuery = "SELECT done_by, assignto FROM ticket_assign WHERE tid = ? ORDER BY id DESC LIMIT 1";
        $latestStmt = $conn->prepare($latestQuery);
        $latestStmt->bind_param("i", $id);
        $latestStmt->execute();
        $result = $latestStmt->get_result();

        if ($row = $result->fetch_assoc()) {
            $finalUserIds = $row['done_by'] . ',' . $row['assignto'];
        } else {
            $finalUserIds = $doneby . ',' . $assigneesString;
        }
        $latestStmt->close();

        $checkQuery = "SELECT userid FROM notification WHERE tid = ? AND log_type = ?";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bind_param("is", $id, $log_type);
        $checkStmt->execute();
        $result = $checkStmt->get_result();

        if ($row = $result->fetch_assoc()) {
            $updateQuery = "UPDATE notification SET userid = ?, post_date = ? WHERE tid = ? AND log_type = ?";
            $updateStmt = $conn->prepare($updateQuery);
            $updateStmt->bind_param("ssii", $finalUserIds, $post_date, $id, $log_type);
            if (!$updateStmt->execute()) {
                throw new Exception("Failed to update notification: " . $updateStmt->error);
            }
            $updateStmt->close();
        } else {
            $insertQuery = "INSERT INTO notification (tid, userid, access_type, ttype, log, read_by, log_type, href, post_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $insertStmt = $conn->prepare($insertQuery);
            $read_by = "";
            $insertStmt->bind_param("issssssss", $id, $finalUserIds, $access_type, $ttype, $logText, $read_by, $log_type, $href, $post_date);
            if (!$insertStmt->execute()) {
                throw new Exception("Failed to insert notification: " . $insertStmt->error);
            }
            $insertStmt->close();
        }

        $conn->close();
        echo json_encode($response);
    } else {
        echo json_encode(["message" => "Invalid request method"]);
    }
} catch (Exception $e) {
    if (isset($conn) && $conn) {
        $conn->close();
    }
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
