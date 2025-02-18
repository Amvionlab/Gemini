<?php
include 'config.php';

// Function to fetch users from the sub_domain table and get corresponding domain names
$sql = "SELECT sub_domain.*, domain.name AS domain_name 
        FROM sub_domain
        JOIN domain ON sub_domain.domain_id = domain.id";

$result = $conn->query($sql);

$users = array();
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
}

$conn->close();

echo json_encode($users);
