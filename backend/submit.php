<?php include 'config.php'; // Adjust path as per your file structure

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Check if a file has been uploaded
        $uploadDir = 'C:/xampp/htdocs/TMS/src/attachment/';
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
                    $attachmentPath = 'src/attachment/' . $fileName; // Storing relative path
                } else {
                    throw new Exception('File upload failed.');
                }
            } else {
                throw new Exception('Invalid file type. Only PDF, JPG, JPEG, and PNG files are allowed.');
            }
        }

        // Collect and sanitize other form data
        $customer_name = htmlspecialchars(trim($_POST['customer_name'] ?? ''));
        $customer_location = htmlspecialchars(trim($_POST['customer_location'] ?? ''));
        $customer_department = htmlspecialchars(trim($_POST['customer_department'] ?? ''));
        $contact_person = htmlspecialchars(trim($_POST['contact_person'] ?? ''));
        $contact_number = htmlspecialchars(trim($_POST['contact_number'] ?? ''));
        $contact_mail = htmlspecialchars(trim($_POST['contact_mail'] ?? ''));
        if($_POST['contact_mail'] != ''){
            $contact_mail = filter_var($_POST['contact_mail'], FILTER_SANITIZE_EMAIL);
        }
        $nature_of_call = htmlspecialchars(trim($_POST['nature_of_call'] ?? ''));
        $ticket_type = htmlspecialchars(trim($_POST['ticket_type'] ?? ''));
        $ticket_service = htmlspecialchars(trim($_POST['ticket_service'] ?? ''));
        $domain = htmlspecialchars(trim($_POST['domain'] ?? ''));
        $sub_domain = htmlspecialchars(trim($_POST['sub_domain'] ?? ''));
        $sla_priority = htmlspecialchars(trim($_POST['sla_priority'] ?? ''));
        $issue_nature = htmlspecialchars(trim($_POST['issue_nature'] ?? ''));
        $created_by = htmlspecialchars(trim($_POST['created_by'] ?? ''));
        $status = 1;

        // Validate email format
        if ((!filter_var($contact_mail, FILTER_VALIDATE_EMAIL )) && $_POST['contact_mail'] != '') {
            throw new Exception('Invalid email format.');
        }

        // Ensure no blank inserts
        if (!empty($customer_name)) {
            // Prepare and bind
            $stmt = $conn->prepare("INSERT INTO ticket (customer_name, customer_location, customer_department, contact_person, contact_number, contact_mail, nature_of_call, ticket_type, ticket_service, domain, sub_domain, sla_priority, issue_nature, path, created_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            if ($stmt === false) {
                throw new Exception('Database prepare failed: ' . $conn->error);
            }
            $stmt->bind_param("ssssssssssssssss", $customer_name, $customer_location, $customer_department, $contact_person, $contact_number, $contact_mail, $nature_of_call, $ticket_type, $ticket_service, $domain, $sub_domain, $sla_priority, $issue_nature, $attachmentPath, $created_by, $status);

            if ($stmt->execute()) {
                $tid = $conn->insert_id;

                // Collect and sanitize log data
                $fromStatus = htmlspecialchars(trim('0'));
                $toStatus = htmlspecialchars(trim('1'));
                $date = date('d-m-Y');
                $doneby = htmlspecialchars(trim($_POST['created_by'] ?? ''));
                $emailResponse = sendmail(2, $tid); // Here, `1` is the ID you want to use
       
                // Prepare and bind log statement
                $logQuery = "INSERT INTO log (tid, done_by, from_status, to_status, date) VALUES (?, ?, ?, ?, ?)";
                $logStmt = $conn->prepare($logQuery);
                if ($logStmt === false) {
                    throw new Exception('Database prepare for log failed: ' . $conn->error);
                }
                $logStmt->bind_param("issss", $tid, $doneby, $fromStatus, $toStatus, $date);

                // Execute the log statement
                if ($logStmt->execute()) {
                    $response = array('status' => 'success', 'message' => 'Form submitted and data inserted successfully!');
                } else {
                    throw new Exception('Log insert failed: ' . $logStmt->error);
                }
            
                $response = array('status' => 'success', 'message' => 'Form submitted, data inserted successfully, and notification added!');
            
                $notificationStmt->close();
                $logStmt->close();
            } else {
                throw new Exception('Ticket insert failed: ' . $stmt->error);
            }            

            $stmt->close();
        } else {
            throw new Exception('Invalid input. Customer name and email are required.');
        }

        $conn->close();
        echo json_encode($response);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
