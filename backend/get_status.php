<?php 
include 'config.php'; 

$sql = "SELECT id, status FROM ticket_status";
$result = $conn->query($sql);

$data = [];

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
} else {
    echo "0 results";
}

$conn->close();

echo json_encode($data);
