<?php
include 'config.php';
// Function to fetch users from database
    $sql = "SELECT * FROM location";
    $result = $conn->query($sql);

    $users = array();
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
    }

    $conn->close();
   


echo json_encode($users);
?>
