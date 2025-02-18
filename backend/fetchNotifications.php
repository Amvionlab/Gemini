<?php

include 'config.php';

$type = isset($_GET['type']) ? $_GET['type'] : '';
$user = isset($_GET['user']) ? $_GET['user'] : '';
$ttype = isset($_GET['ttype']) ? $_GET['ttype'] : '';
// Initialize base SQL query
$sql = "SELECT * FROM notification WHERE 1=1";

$params = [];

// Add conditions based on the type
if ($type == '4') {
    $sql .= " AND FIND_IN_SET(?, access_type) AND NOT FIND_IN_SET(?, read_by) AND ttype = ?";
    $params[] = $type;
    $params[] = $user;
    $params[] = $ttype; // Assuming $ttype was meant to be $type, adjust logic if needed
}else if ($type == '5') {
    $sql .= " AND FIND_IN_SET(?, access_type) AND FIND_IN_SET(?, userid) AND NOT FIND_IN_SET(?, read_by) AND ttype = ?";
    $params[] = $type;
    $params[] = $user;
    $params[] = $user;
    $params[] = $ttype; // Assuming $ttype was meant to be $type, adjust logic if needed
} elseif ($type == '2') {
    $sql .= " AND FIND_IN_SET(?, access_type) AND FIND_IN_SET(?, userid) AND NOT FIND_IN_SET(?, read_by)";
    $params[] = $type;
    $params[] = $user;
    $params[] = $user;
}
elseif ($type == '1' || $type == '3') {
    $sql .= " AND FIND_IN_SET(?, access_type) AND NOT FIND_IN_SET(?, read_by)";
    $params[] = $type;
    $params[] = $user;
}

// Prepare the statement
$stmt = $conn->prepare($sql);

// Dynamically bind parameters
if (count($params) > 0) {
    $paramTypes = str_repeat("s", count($params));
    $stmt->bind_param($paramTypes, ...$params);
}

// Execute the statement
$stmt->execute();

$result = $stmt->get_result();

$notifications = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $notifications[] = $row;
    }
}

// Free result and close connections
$result->free();
$stmt->close();
$conn->close();

// Output the result as JSON
echo json_encode($notifications);

?>