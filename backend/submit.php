<?php
include 'config.php'; // Adjust path as per your file structure

function logMessage($message) {
    file_put_contents('log.txt', date('Y-m-d H:i:s') . " - " . $message . "\n", FILE_APPEND);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json'); // Ensure to send the correct headers

    logMessage("Script started");

    $uploadDir = 'D:/xampp/htdocs/TMS/src/attachment/';
    $attachmentPath = '';

    // Check if a file has been uploaded
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

    // Collect and sanitize other form data
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
    $status = 1;

    // Validate email format
    // if ($_POST['contact_mail'] != '' && !filter_var($contact_mail, FILTER_VALIDATE_EMAIL)) {
    //     logMessage("Invalid email format: {$contact_mail}");
    //     echo json_encode(['status' => 'error', 'message' => 'Invalid email format.']);
    //     exit;
    // }

    // Ensure no blank inserts
    if (!empty($customer_name)) {
        logMessage("Preparing SQL statement");

        // Prepare and bind
        $stmt = $conn->prepare("INSERT INTO ticket (customer_name, customer_location, customer_department, contact_person, contact_number, contact_mail, nature_of_call, ticket_type, ticket_service, domain, sub_domain, sla_priority, issue_nature, path, created_by, status, post_Date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        if ($stmt === false) {
            logMessage("Database prepare failed: {$conn->error}");
            echo json_encode(['status' => 'error', 'message' => 'Database prepare failed.']);
            exit;
        }
        $stmt->bind_param("sssssssssssssssss", 
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
        $status, 
        $ticket_date
    );

    if ($stmt->execute()) {
        $tid = $conn->insert_id;
        logMessage("Ticket inserted successfully, ID: {$tid}");

        // Log insertion
        $fromStatus = htmlspecialchars(trim('0'));
        $toStatus = htmlspecialchars(trim('1'));
        $date = date('d-m-Y');
        $doneby = htmlspecialchars(trim($_POST['created_by'] ?? ''));
        $emailResponse = sendmail(2, $tid);

        $logQuery = "INSERT INTO log (tid, done_by, from_status, to_status, date) VALUES (?, ?, ?, ?, ?)";
        $logStmt = $conn->prepare($logQuery);
        if ($logStmt === false) {
            logMessage("Database prepare for log failed: {$conn->error}");
            echo json_encode(['status' => 'error', 'message' => 'Database prepare for log failed.']);
            exit;
        }
        $logStmt->bind_param("issss", $tid, $doneby, $fromStatus, $toStatus, $date);

        if ($logStmt->execute()) {
            logMessage("Log inserted successfully");
            $response = array('status' => 'success', 'message' => 'Form submitted, data inserted successfully, and notification added!');
        } else {
            logMessage("Log insert failed: {$logStmt->error}");
            echo json_encode(['status' => 'error', 'message' => 'Log insert failed.']);
            exit;
        }

        $logStmt->close();
    } else {
        logMessage("Ticket insert failed: {$stmt->error}");
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