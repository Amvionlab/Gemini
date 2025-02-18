<?php
include 'config.php';

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json'); // Ensure the response is JSON

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Retrieve form data with default values
    $firstname = $_POST['firstname'] ?? '';
    $lastname = $_POST['lastname'] ?? '';
    $empid = $_POST['empid'] ?? '';
    $dept = $_POST['dept'] ?? '';
    $designation = $_POST['designation'] ?? '';
    $authority = $_POST['authority'] ?? '';
    $location = $_POST['location'] ?? '';
    $state = $_POST['state'] ?? '';
    $country = $_POST['country'] ?? '';
    $build = $_POST['build'] ?? '';
    $block = $_POST['block'] ?? '';
    $floor = $_POST['floor'] ?? '';
    $email = $_POST['email'] ?? '';
    $mobile = $_POST['mobile'] ?? '';
    $is_active = '1';
    // Handle optional file upload
    $attachmentPath = '';
    if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '/src/photo/'; // Ensure this path is correct
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true); // Create directory if it doesn't exist
        }
        $fileTmpPath = $_FILES['attachment']['tmp_name'];
        $fileName = basename($_FILES['attachment']['name']);
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];

        if (in_array($fileExtension, $allowedExtensions)) {
            $attachmentPath = $uploadDir . $fileName;
            if (!move_uploaded_file($fileTmpPath, $attachmentPath)) {
                echo json_encode(['success' => false, 'message' => 'Failed to move uploaded file.']);
                exit;
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.']);
            exit;
        }
    }

    // Check if Employee ID already exists
    $checkQuery = "SELECT * FROM employee WHERE employee_id = ?";
    $stmt = $conn->prepare($checkQuery);
    if ($stmt === false) {
        echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        exit;
    }
    $stmt->bind_param("s", $empid);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // Employee already exists
        echo json_encode(['success' => false, 'message' => 'Employee Already Exists']);
    } else {
        // Insert new employee data
        $insertQuery = "INSERT INTO employee 
                        (firstname, lastname, employee_id, department, designation, authority_id, location, state, country, building, block, floor, email, mobile, photo, is_active)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($insertQuery);
        if ($stmt === false) {
            echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
            exit;
        }

        // Bind parameters, including the attachment path
        $stmt->bind_param("ssssssssssssssss", $firstname, $lastname, $empid, $dept, $designation, $authority, $location, $state, $country, $build, $block, $floor, $email, $mobile, $attachmentPath, $is_active);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Employee added successfully.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Database Insertion Failed: ' . $stmt->error]);
        }
    }

    $stmt->close();
    $conn->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid Request Method']);
}
?>
