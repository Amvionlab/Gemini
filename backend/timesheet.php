<?php
include 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $date = $data['date'];
    $done_by=$data['userid'];
    $tid=$data['tid'];
    $description = $data['description'];
    $from_time = $data['from_time'];
    $to_time = $data['to_time'];
    $total_hours = $data['total_hours'];

    $sql = "INSERT INTO timesheet (tid, date, description, starttime, endtime, totalhours, done_by) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('sssssss',$tid, $date, $description, $from_time, $to_time, $total_hours, $done_by);
    if ($stmt->execute()) {
        echo json_encode(["success" => "success"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Failed to add timesheet entry."]);
    }
} else {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    // Prepare the SQL statement
    $stmt = $conn->prepare("SELECT timesheet.*, CONCAT(user.firstname, ' ', user.lastname) AS name FROM timesheet LEFT JOIN user ON timesheet.done_by = user.id WHERE timesheet.tid = ? AND timesheet.is_active=1");
    
    // Bind the id parameter
    $stmt->bind_param("i", $id);
    
    // Execute the statement
    $stmt->execute();
    
    // Get the result
    $result = $stmt->get_result();
    
    $users = array();
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
    }
    
    // Close the statement and connection
    $stmt->close();
    $conn->close();
    
    // Output the result as JSON
    echo json_encode($users);
}
?>
