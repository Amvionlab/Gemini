<?php
include 'config.php';
header('Content-Type: application/json');

// Fetch customers with client names using JOIN
$query = "SELECT c.*, cl.name AS client_name 
          FROM customer c
          JOIN client cl ON c.client_id = cl.id";

$result = $conn->query($query);

$customers = [];
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $customers[] = $row;
    }
}

$conn->close();

echo json_encode($customers);
?>
