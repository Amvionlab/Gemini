<?php
include 'config.php';

// Get the ticket ID from the GET request and sanitize it
$ticket_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($ticket_id > 0) {
    // Prepare the SQL statement
    $stmt = $conn->prepare("
        SELECT log.*, 
            CONCAT(user.firstname, ' ', user.lastname) AS name,
            from_status.status AS statusfrom,
            to_status.status AS statusto
        FROM log
        LEFT JOIN user ON log.done_by = user.id
        LEFT JOIN ticket_status AS from_status ON log.from_status = from_status.id
        LEFT JOIN ticket_status AS to_status ON log.to_status = to_status.id
        WHERE log.tid = ?
    ");
    
    // Bind the ticket ID parameter
    $stmt->bind_param("i", $ticket_id);
    
    // Execute the statement
    $stmt->execute();
    
    // Get the result
    $result = $stmt->get_result();
    
    $logs = array();
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $logs[] = $row;
        }
    }
    
    // Close the statement and connection
    $stmt->close();
    $conn->close();
    
    // Output the result as JSON
    echo json_encode($logs);
} else {
    // Invalid ID provided
    echo json_encode(array("error" => "Invalid ticket ID provided."));
}
?>
