<?php

include 'config.php';


// Get last processed email ID
function get_last_email_id($conn) {
    $result = $conn->query("SELECT alert_mail FROM last_email LIMIT 1");
    $row = $result->fetch_assoc();
    return $row ? $row['alert_mail'] : "1";
}

// Update last processed email ID
function update_last_email_id($conn, $last_email_id) {
    $conn->query("UPDATE last_email SET alert_mail = '$last_email_id'");
}

// Connect to the mail server
function connect_to_mail() {
    $hostname = '{imap.hostinger.com:993/imap/ssl}INBOX';
    $username = 'mcs@amvionlabs.com';
    $password = 'Amvion%2025';

    $connection = @imap_open($hostname, $username, $password);
    if (!$connection) {
        die('Cannot connect to mail server: ' . imap_last_error());
    } else {
        echo "Connected to mail server.\n";
    }
    return $connection;
}

// Extract alarm details using regex
function extract_alarm_details($email_body) {
    $patterns = [
        'Name' => '/- Name:\s+(.+)/',
        'Description' => '/- Description:\s+(.+)/',
        'Timestamp' => '/- Timestamp:\s+(.+)/',
        'AWS Account' => '/- AWS Account:\s+(\d+)/'
    ];

    $details = [];
    foreach ($patterns as $key => $pattern) {
        if (preg_match($pattern, $email_body, $matches)) {
            $details[$key] = trim($matches[1]);
        }
    }
    return $details;
}

// Main processing logic
echo "Starting email processing...\n";

$last_email_id = get_last_email_id($conn);
echo "Last processed email ID: $last_email_id\n";

$mail = connect_to_mail();
$keywords = [
    'ALARM: "OL-CPU"',
    'ALARM: "Amvion-ERP-RAM"',
    'ALARM: "Amvion-ERP_CPU"',
    'ALARM: "Anderson-DB-CPU"',
    'ALARM: "Anderson-DB"',
    'ALARM: "Anderson-CPU"',
    'ALARM: "SGOU-Portal-CPU"',
    'ALARM: "SGOU-Portal"',
    'ALARM: "SGOU-Ldesk-CPU"',
    'ALARM: "SGOU-Ldesk-RAM"',
    'ALARM: "SGOU-Website-CPU"',
    'ALARM: "SGOU-Website"',
    'ALARM: "Fedserv-HRMS"',
    'ALARM: "UMS-MGU-CPU"',
];

// Fetch emails greater than the last processed email ID to ensure no old emails are reprocessed
// Search for emails that are yet to be processed
$emails = imap_search($mail, 'ALL');

if ($emails) {
    sort($emails); // Process emails in ascending order of receipt

    foreach ($emails as $email_number) {
        echo $email_number;
        if ($email_number <= $last_email_id) {
            continue;
        }

        $overview = imap_fetch_overview($mail, $email_number, 0);
        $subject = isset($overview[0]->subject) ? mb_decode_mimeheader($overview[0]->subject) : "(No Subject)";
        echo "Processing email ID: $email_number, Subject: $subject\n";

        if (array_reduce($keywords, fn($carry, $keyword) => $carry || stripos($subject, $keyword) !== false, false)) {
            $message = imap_fetchbody($mail, $email_number, 1);
            $message = quoted_printable_decode($message);

            $details = extract_alarm_details($message);
            $formatted_body = array_reduce(array_keys($details), fn($carry, $key) => $carry . "$key: " . $details[$key] . "\n", "");

            $sql = "INSERT INTO ticket (ticket_type, customer_name, issue_nature, status, assignees) VALUES ('5', '348', ?, '2', '36,38,41,22,48,29,57')";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param('s', $formatted_body);
            if ($stmt->execute()) {
                echo "Ticket created for email ID: $email_number\n";
            } else {
                echo "Error creating ticket for email ID: $email_number - " . $stmt->error . "\n";
            }
            $stmt->close();
        }

        $last_email_id = $email_number; // Ensuring last email ID is updated after each successful process
        update_last_email_id($conn, $last_email_id);
        echo "Updated last processed email ID to: $last_email_id\n";
    }
} else {
    echo "No new emails to process.\n";
}

imap_close($mail);
$conn->close();
echo "Email processing complete.\n";

?>