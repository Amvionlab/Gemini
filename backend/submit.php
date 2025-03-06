<?php
include 'config.php'; // Adjust path as per your file structure

// Function to log messages
function logMessage($message) {
    file_put_contents('log.txt', date('Y-m-d H:i:s') . " - " . $message . "\n", FILE_APPEND);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json'); // Ensure to send the correct headers

    logMessage("Script started");

    // File upload handling
    $uploadDir = 'D:/xampp/htdocs/TMS/src/attachment/';
    $attachmentPath = '';

    if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] == UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['attachment']['tmp_name'];
        $fileName = basename($_FILES['attachment']['name']);
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $allowedExtensions = array('pdf', 'jpg', 'jpeg', 'png');

        if (in_array($fileExtension, $allowedExtensions)) {
            $filePath = $uploadDir . $fileName;
            if (move_uploaded_file($fileTmpPath, $filePath)) {
                $attachmentPath = 'src/attachment/' . $fileName;
                logMessage("File uploaded successfully: {$attachmentPath}");
            } else {
                logMessage("File upload failed");
                echo json_encode(['status' => 'error', 'message' => 'File upload failed.']);
                exit;
            }
        } else {
            logMessage("Invalid file type: {$fileExtension}");
            echo json_encode(['status' => 'error', 'message' => 'Invalid file type.']);
            exit;
        }
    }

    // Collect and sanitize form data
    $customer_name = htmlspecialchars(trim($_POST['customer_name'] ?? ''));
    $customer_location = htmlspecialchars(trim($_POST['customer_location'] ?? ''));
    $customer_department = htmlspecialchars(trim($_POST['customer_department'] ?? ''));
    $contact_person = htmlspecialchars(trim($_POST['contact_person'] ?? ''));
    $contact_number = htmlspecialchars(trim($_POST['contact_number'] ?? ''));
    $contact_mail = htmlspecialchars(trim($_POST['contact_mail'] ?? ''));
    $nature_of_call = htmlspecialchars(trim($_POST['nature_of_call'] ?? ''));
    $ticket_type = htmlspecialchars(trim($_POST['ticket_type'] ?? ''));
    $ticket_date = htmlspecialchars(trim($_POST['ticket_date'] ?? ''));
    $ticket_service = htmlspecialchars(trim($_POST['ticket_service'] ?? ''));
    $domain = htmlspecialchars(trim($_POST['domain'] ?? ''));
    $sub_domain = htmlspecialchars(trim($_POST['sub_domain'] ?? ''));
    $sla_priority = htmlspecialchars(trim($_POST['sla_priority'] ?? ''));
    $issue_nature = htmlspecialchars(trim($_POST['issue_nature'] ?? ''));
    $created_by = htmlspecialchars(trim($_POST['created_by'] ?? ''));
    $status = 2;

  
    $cl = (int) $customer_location;
$customerQuery = "SELECT gcl_region FROM customer WHERE id = ?";
$customerStmt = $conn->prepare($customerQuery);
if ($customerStmt === false) {
    logMessage("Prepare failed for customer query: " . $conn->error);
    echo json_encode(['status' => 'error', 'message' => 'Prepare failed for customer query.']);
    exit;
}
$customerStmt->bind_param("i", $cl);
$customerStmt->execute();
$customerResult = $customerStmt->get_result();
$customerData = $customerResult->fetch_assoc();

if ($customerData && !empty($customerData['gcl_region'])) {
    $gcl_region = $customerData['gcl_region'];
    logMessage("GCL Region: " . $gcl_region);

    // Use LIKE to check if gcl_region is part of the location field
    $employeeQuery = "SELECT employee_id FROM employee WHERE FIND_IN_SET(?, location) > 0 AND department = 'RH'";
    logMessage("Employee query: " . $employeeQuery);

    $employeeStmt = $conn->prepare($employeeQuery);
    if ($employeeStmt === false) {
        logMessage("Prepare failed for employee query: " . $conn->error);
        echo json_encode(['status' => 'error', 'message' => 'Prepare failed for employee query.']);
        exit;
    }

    $employeeStmt->bind_param("s", $gcl_region);

    if ($employeeStmt->execute()) {
        $employeeResult = $employeeStmt->get_result();
        $employeeData = $employeeResult->fetch_assoc();

        if ($employeeData) {
            $employee_id = $employeeData['employee_id'];
            logMessage("Employee ID found: " . $employee_id);

            $userQuery = "SELECT id FROM user WHERE employee_id = ?";
            $userStmt = $conn->prepare($userQuery);
            if ($userStmt === false) {
                logMessage("Prepare failed for user query: " . $conn->error);
                echo json_encode(['status' => 'error', 'message' => 'Prepare failed for user query.']);
                exit;
            }
            $userStmt->bind_param("s", $employee_id);
            $userStmt->execute();
            $userResult = $userStmt->get_result();
            $userData = $userResult->fetch_assoc();

            $getid = $userData['id'] ?? '';
            logMessage("Fetched user ID: " . $getid);
        } else {
            logMessage("No matching employee found.");
            $getid = '';
        }
    } else {
        logMessage("Employee query execution failed: " . $employeeStmt->error);
        $getid = '';
    }

    $employeeStmt->close();
} else {
    logMessage("No customer data found for ID: " . $cl);
    $getid = '';
}



    // Insert ticket data
    if (!empty($customer_name)) {
        logMessage("Preparing SQL statement for ticket insertion");

        $stmt = $conn->prepare("INSERT INTO ticket (customer_name, customer_location, customer_department, contact_person, contact_number, contact_mail, nature_of_call, ticket_type, ticket_service, domain, sub_domain, sla_priority, issue_nature, path, created_by, assignees, status, post_Date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        if ($stmt === false) {
            logMessage("Database prepare failed: " . $conn->error);
            echo json_encode(['status' => 'error', 'message' => 'Database prepare failed.']);
            exit;
        }
        $stmt->bind_param("ssssssssssssssssss", 
            $customer_name, 
            $customer_location, 
            $customer_department, 
            $contact_person, 
            $contact_number, 
            $contact_mail, 
            $nature_of_call, 
            $ticket_type, 
            $ticket_service, 
            $domain, 
            $sub_domain, 
            $sla_priority, 
            $issue_nature, 
            $attachmentPath, 
            $created_by, 
            $getid,
            $status, 
            $ticket_date
        );


        if ($stmt->execute()) {
            $tid = $conn->insert_id;
            logMessage("Ticket inserted successfully, ID: " . $tid);

            // Insert log entry
            $fromStatus = '0';
            $toStatus = '1';
            $date = date('d-m-Y');
            $doneby = htmlspecialchars(trim($_POST['created_by'] ?? ''));
$emailResponse = sendmail(2, $tid);
            $logQuery = "INSERT INTO log (tid, done_by, from_status, to_status, date) VALUES (?, ?, ?, ?, ?)";
            $logStmt = $conn->prepare($logQuery);
            if ($logStmt === false) {
                logMessage("Database prepare for log failed: " . $conn->error);
                echo json_encode(['status' => 'error', 'message' => 'Database prepare for log failed.']);
                exit;
            }
            $logStmt->bind_param("issss", $tid, $doneby, $fromStatus, $toStatus, $date);

            if ($logStmt->execute()) {
                logMessage("Log inserted successfully");
                $response = array('status' => 'success', 'message' => 'Form submitted, data inserted successfully, and notification added!');
            } else {
                logMessage("Log insert failed: " . $logStmt->error);
                echo json_encode(['status' => 'error', 'message' => 'Log insert failed.']);
                exit;
            }

            $logStmt->close();
        } else {
            logMessage("Ticket insert failed: " . $stmt->error);
            echo json_encode(['status' => 'error', 'message' => 'Ticket insert failed.']);
            exit;
        }

        $stmt->close();
    } else {
        logMessage("Invalid input, customer name and email required");
        echo json_encode(['status' => 'error', 'message' => 'Invalid input. Customer name and email are required.']);
        exit;
    }

    $conn->close();
    echo json_encode($response);
    logMessage("Response sent: " . json_encode($response));
}
?>