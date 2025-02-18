<?php
include 'config.php';

    
// Process form submission
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $uploadDir = 'C:\xampp\htdocs\TMS\src\attachment';
    $attachmentPath = '';

    if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] == UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['attachment']['tmp_name'];
        $fileName = basename($_FILES['attachment']['name']); // Ensure file name is safe
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $allowedExtensions = array('pdf', 'jpg', 'jpeg', 'png');

        if (in_array($fileExtension, $allowedExtensions)) {
            $filePath = $uploadDir . $fileName;

            // Move the file to the specified directory
            if (move_uploaded_file($fileTmpPath, $filePath)) {
                $attachmentPath = 'src/photo/' . $fileName; // Storing relative path
            } else {
                throw new Exception('File upload failed.');
            }
        } else {
            throw new Exception('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.');
        }
    }

    $name = $_POST['name'];
    $location = $_POST['location'];
    $mobile = $_POST['mobile'];
    $department = $_POST['department'];
    $contact_person = $_POST['contact_person'];
    $email = $_POST['email'];
    $active="1";


    // Insert user data into 'users' table
    $sql = "INSERT INTO customer (name, location, mobile, department, contact_person, email,logo, is_active) VALUES ('$name', '$location', '$mobile','$department','$contact_person', '$email', '$attachmentPath', '$active')"; 

    if ($conn->query($sql) === TRUE) {
        $response = array('success' => true, 'message' => 'Customer added successfully.');
        echo json_encode($response);
    } else {
        $response = array('success' => false, 'message' => 'Error: ' . $sql . '<br>' . $conn->error);
        echo json_encode($response);
    }
} else {
    $response = array('success' => false, 'message' => 'Invalid request method.');
    echo json_encode($response);
}

$conn->close();