<?php

include 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $tid = $_POST['tid'];
    $fromStatus = $_POST['from_status'];
    $toStatus = $_POST['to_status'];
    $date = date('d-m-Y');
    $doneby= $_POST['done_by'];

    $query = "INSERT INTO log (tid, done_by, from_status, to_status, date) VALUES (?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("sssss", $tid, $doneby, $fromStatus, $toStatus, $date);

    if ($stmt->execute()) {
        echo json_encode(["message" => "Log entry created successfully"]);
    } else {
        echo json_encode(["message" => "Failed to create log entry"]);
    }

    $stmt->close();
    $conn->close();
}

