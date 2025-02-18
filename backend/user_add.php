<?php
include 'config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
require 'PHPMailer/vendor/autoload.php';

// Process form submission
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Extract data from POST
    $password = $_POST['password']; 
    $usernameD = $_POST['username'];
    $usertype = $_POST['usertype'];
    $id = $_POST['employee_id'];
    $active = "1";
    
    // Check if the username already exists
    $checkStmt = $conn->prepare("SELECT COUNT(*) FROM user WHERE username = ?");
    $checkStmt->bind_param("s", $usernameD);
    $checkStmt->execute();
    $checkStmt->bind_result($count);
    $checkStmt->fetch();
    $checkStmt->close();

    if ($count > 0) {
        $response = array('success' => false, 'message' => 'Username already exists.');
        echo json_encode($response);
        exit;
    }

    // Fetch employee details based on employee_id
    $empStmt = $conn->prepare("SELECT firstname, lastname, mobile, location, photo, employee_id, email FROM employee WHERE id = ?");
    $empStmt->bind_param("s", $id);
    $empStmt->execute();
    $empStmt->bind_result($firstname, $lastname, $mobile, $location, $photo, $employee_id, $email);
    $found = $empStmt->fetch();
    $empStmt->close();

    // Check if employee exists
    if (!$found) {
        $response = array('success' => false, 'message' => 'Employee not found.');
        echo json_encode($response);
        exit;
    }

    // Prepare to insert the new user
    $stmt = $conn->prepare("INSERT INTO user (firstname, lastname, username, email, usertype, mobile, location, employee_id, photo, is_active, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssssssss", $firstname, $lastname, $usernameD, $email, $usertype, $mobile, $location, $employee_id, $photo, $active, $password);

    if ($stmt->execute()) {
        $lstId = mysqli_insert_id($conn);
        $response = array('success' => true, 'message' => 'User added successfully.');
        // Call the mail function
        $emailResponse = sendmail(1, $lstId); // Here, `1` is the ID you want to use
        // Optionally, you can log or handle $emailResponse
        echo json_encode($response);
    } else {
        $response = array('success' => false, 'message' => 'Database error: ' . $stmt->error);
        echo json_encode($response);
    }

    $stmt->close();
} else {
    $response = array('success' => false, 'message' => 'Invalid request method.');
    echo json_encode($response);
}

$conn->close();
?>