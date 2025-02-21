<?php
include 'config.php';
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');
    
// Process form submission
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $uploadDir = 'C:\xampp\htdocs\TMS\src\attachment';
    $attachmentPath = '';

    echo json_encode(["received_data" => $_POST, "received_files" => $_FILES]);
    exit;

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
    $gclunicode = $_POST['gclunicode'];
    $gclreg = $_POST['gclreg'];
    $branchcode = $_POST['branchcode'];
    $a_end = $_POST['a_end'];
    $b_end = $_POST['b_end'];
    $node = $_POST['node'];
    $modem_type = $_POST['modem_type'];
    $router_ip = $_POST['router_ip'];
    $primary_link = $_POST['primary_link'];
    $wan_ip = $_POST['wan_ip'];
    $circuit_id = $_POST['circuit_id'];
    $band_width = $_POST['band_width'];
    $location_type = $_POST['location_type'];
    $address = $_POST['address'];
    $contact_num = $_POST['contact_num'];
    $mob_num = $_POST['mob_num'];
    $commi_date = $_POST['commi_date'];
    $state_city = $_POST['state_city'];
    $email = $_POST['email'];
    $sla = $_POST['sla'];
    $service_provider = $_POST['service_provider'];
    
    $active = "1";
    


    // Insert user data into 'users' table 
    $stmt = $conn->prepare("INSERT INTO customer (name, gclunicode, gclreg, branchcode, a_end, b_end, node, modem_type, router_ip, primary_link, wan_ip, circuit_id, band_width, location_type, address, contact_num, mob_num, commi_date, state_city, email, sla, service_provider, logo, is_active) 
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");


$stmt->bind_param("ssssssssssssssssssssssss", 
    $name, $gclunicode, $gclreg, $branchcode, $a_end, $b_end, $node, 
    $modem_type, $router_ip, $primary_link, $wan_ip, $circuit_id, 
    $band_width, $location_type, $address, $contact_num, $mob_num, 
    $commi_date, $state_city, $email, $sla, $service_provider, $attachmentPath, $active
);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Customer added successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $stmt->error]);
}

} else {
    $response = array('success' => false, 'message' => 'Invalid request method.');
    echo json_encode($response);
}

$stmt->close();