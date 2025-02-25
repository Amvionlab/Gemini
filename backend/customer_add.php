<?php
include 'config.php';
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    try {
        $uploadDir = 'C:/xampp/htdocs/TMS/src/attachment/';
        $attachmentPath = '';

        // File Upload Handling
        if (!empty($_FILES['attachment']['name']) && $_FILES['attachment']['error'] == UPLOAD_ERR_OK) {
            $fileTmpPath = $_FILES['attachment']['tmp_name'];
            $fileName = basename($_FILES['attachment']['name']); 
            $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];

            if (in_array($fileExtension, $allowedExtensions)) {
                $filePath = $uploadDir . $fileName;
                if (move_uploaded_file($fileTmpPath, $filePath)) {
                    $attachmentPath = 'src/attachment/' . $fileName;
                } else {
                    echo json_encode(["success" => false, "message" => "File upload failed."]);
                    exit;
                }
            } else {
                echo json_encode(["success" => false, "message" => "Invalid file type. Allowed: PDF, JPG, JPEG, PNG."]);
                exit;
            }
        }

        // Assign form data correctly
        $client_id = isset($_POST['client_id']) ? intval($_POST['client_id']) : 0;
        $gcl_unique_code = $_POST['gclunicode'] ?? '';
        $gcl_region = $_POST['gclreg'] ?? '';
        $branch_code = $_POST['branchcode'] ?? '';
        $a_end = $_POST['a_end'] ?? '';
        $b_end = $_POST['b_end'] ?? '';
        $node = $_POST['node'] ?? '';
        $modem_type = $_POST['modem_type'] ?? '';
        $router_ip = $_POST['router_ip'] ?? '';
        $primary_link = $_POST['primary_link'] ?? '';
        $wan_ip = $_POST['wan_ip'] ?? '';
        $circuit_id = $_POST['circuit_id'] ?? '';
        $band_width = $_POST['band_width'] ?? '';
        $location_type = $_POST['location_type'] ?? '';
        $address = $_POST['address'] ?? '';
        $contact_number = $_POST['contact_num'] ?? '';
        $mobile_number = $_POST['mob_num'] ?? '';
        $commissioned_date = $_POST['commi_date'] ?? '';
        $state_city = $_POST['state_city'] ?? '';
        $email_id = $_POST['email'] ?? '';
        $sla = $_POST['sla'] ?? '';
        $service_provider = $_POST['service_provider'] ?? '';
        $is_active = "1";  // Default active

        // Prepare SQL statement
        $stmt = $conn->prepare("INSERT INTO customer (
            cid, gcl_unique_code, gcl_region, branch_code, 
            a_end, b_end, node, modem_type, router_ip, primary_link, 
            wan_ip, circuit_id, band_width, location_type, address, 
            contact_person, mobile, commissioned_date, state_city, email, 
            sla, service_provider, is_active, post_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
        
        
        if (!$stmt) {
            echo json_encode(['success' => false, 'message' => 'SQL Prepare Error: ' . $conn->error]);
            exit;
        }

        // Bind parameters (without duplicate)
        $stmt->bind_param("issssssssssssssssssssss", 
    $client_id, $gcl_unique_code, $gcl_region, $branch_code, 
    $a_end, $b_end, $node, $modem_type, $router_ip, $primary_link, 
    $wan_ip, $circuit_id, $band_width, $location_type, $address, 
    $contact_number, $mobile_number, $commissioned_date, $state_city, $email_id, 
    $sla, $service_provider, $is_active
);


        // Execute and check for errors
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Customer added successfully.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'SQL Execute Error: ' . $stmt->error]);
        }

        $stmt->close();
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Server Error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
}
?>
