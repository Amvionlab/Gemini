<?php

include 'config.php';

// Get the input data
$inputData = json_decode(file_get_contents('php://input'), true);

// Check if the action is valid
if (isset($inputData['action'])) {
    $action = $inputData['action'];

    // Get userId
    $userId = $inputData['userId'];

    if ($action === 'close') {
        // Update the notification as read by a specific user
        if (isset($inputData['noteId'])) {
            $noteId = $inputData['noteId'];

            // Check if there's already a value in the 'read_by' column
            $query = "SELECT read_by FROM notification WHERE id = ?";
            $stmt = $conn->prepare($query);
            $stmt->bind_param('i', $noteId);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();

            $readBy = $row['read_by'] ? explode(',', $row['read_by']) : [];
            if (!in_array($userId, $readBy)) {
                $readBy[] = $userId;
                $newReadBy = implode(',', $readBy);

                // Update the notification's 'read_by' column
                $updateQuery = "UPDATE notification SET read_by = ? WHERE id = ?";
                $updateStmt = $conn->prepare($updateQuery);
                $updateStmt->bind_param('si', $newReadBy, $noteId);
                $updateStmt->execute();

                echo json_encode(['status' => 'success', 'message' => 'Notification marked as read']);
            } else {
                echo json_encode(['status' => 'info', 'message' => 'Notification already marked as read']);
            }
        }
    } elseif ($action === 'clear_all') {
        // Update notifications for the user only for specific notification IDs
        if (isset($inputData['noteIds']) && is_array($inputData['noteIds'])) {
            $noteIds = $inputData['noteIds'];

            // Prepare a parameterized query to update only the specified notifications
            $placeholders = implode(',', array_fill(0, count($noteIds), '?'));
            $query = "SELECT id, read_by FROM notification WHERE id IN ($placeholders)";
            $stmt = $conn->prepare($query);

            // Dynamically bind the parameters
            $types = str_repeat('i', count($noteIds));
            $stmt->bind_param($types, ...$noteIds);
            $stmt->execute();
            $result = $stmt->get_result();

            $updated = false; // To track if any notification was updated

            while ($row = $result->fetch_assoc()) {
                $noteId = $row['id'];
                $readBy = $row['read_by'] ? explode(',', $row['read_by']) : [];

                // Only add the userId if it's not already in the 'read_by' column
                if (!in_array($userId, $readBy)) {
                    $readBy[] = $userId;
                    $newReadBy = implode(',', $readBy);

                    // Update the notification's 'read_by' column
                    $updateQuery = "UPDATE notification SET read_by = ? WHERE id = ?";
                    $updateStmt = $conn->prepare($updateQuery);
                    $updateStmt->bind_param('si', $newReadBy, $noteId);
                    $updateStmt->execute();

                    $updated = true;
                }
            }

            // Respond based on whether updates were made
            if ($updated) {
                echo json_encode(['status' => 'success', 'message' => 'Selected notifications marked as read']);
            } else {
                echo json_encode(['status' => 'info', 'message' => 'No new notifications to mark as read']);
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invalid or missing notification IDs']);
        }
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
}

$conn->close();

?>
