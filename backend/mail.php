<?php
include 'config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/vendor/autoload.php';

// Debug: Print received GET parameters
$id = isset($_GET['id']) ? $_GET['id'] : null;
$value = isset($_GET['value']) ? $_GET['value'] : null;
echo "Received GET parameters: id=" . htmlspecialchars($id) . ", value=" . htmlspecialchars($value) . "<br>";

if ($id && $value) {

    if ($id == 1) {
        $stmt = $conn->prepare("SELECT firstname, lastname, email, username, password FROM user WHERE id = ?");
        $stmt->bind_param("i", $value);
        $stmt->execute();
        $stmt->bind_result($firstname, $lastname, $email, $usernameD, $password);
        $stmt->fetch();
        $stmt->close();

        $emails = [$email]; // As an array with a single email

        $placeholders = ['{firstname}', '{password}', '{username}'];
        $values = [$firstname, $password, $usernameD];
    } else if ($id == ) {
        $stmt = $conn->prepare("SELECT `contact_number` FROM `ticket` WHERE id = ?");
        $stmt->bind_param("i", $value);
        $stmt->execute();
        $stmt->bind_result($wan);
        $stmt->fetch();
        $stmt->close();

      

        $placeholders = [
            '{tno}',
            '{wan}',
            
        ];

        $values = [
            $value,
            $wan,
            
        ];
        $stmt = $conn->prepare("SELECT `contact_mail` FROM `ticket` WHERE id = ?");
        $stmt->bind_param("i", $value);

        $stmt->execute();
        $stmt->bind_result($emailString);
        $emails = [];
        if ($stmt->fetch()) {
          
            $emails = explode(',', $emailString);
           
            $emails = array_map('trim', $emails);
        }
        $stmt->close();
    }
   


    if (!empty($emails)) {
        $rq = mysqli_fetch_array(mysqli_query($conn, "SELECT * FROM smtp"));

        $username = $rq['username'];
        $passwordD = $rq['password'];
        $host = $rq['host'];
        $smtpsecure = $rq['smtpsecure'];
        $port = $rq['port'];
        $fromname = $rq['fromname'];
        $from = $rq['frommail'];

        $et = mysqli_fetch_array(mysqli_query($conn, "SELECT * FROM email_template WHERE id=$id"));
        $sub = $et['subject'];
        $mailtxt = $et['body'];

        // Replace the placeholders with the actual values
        $mailtxt = str_replace($placeholders, $values, $mailtxt);

        // Debug: Print modified email content
        echo "Modified email content:<br>";
        echo htmlspecialchars($mailtxt, ENT_QUOTES, 'UTF-8');

        $mail = new PHPMailer();
        $mail->IsSMTP();
        $mail->SMTPDebug = 0;
        $mail->Host = $host;
        $mail->SMTPSecure = $smtpsecure;
        $mail->Port = $port;
        $mail->SMTPAuth = true;
        $mail->Username = $username;
        $mail->Password = $passwordD;

        $mail->FromName = $fromname;
        $mail->From = $from;
        $mail->isHTML(true);
        $mail->Subject = $sub;
        $mail->Body = $mailtxt;

        // Add all recipients
        foreach ($emails as $emailAddress) {
            $mail->addAddress($emailAddress);
        }

        if ($mail->send()) {
            echo json_encode(array('success' => true, 'message' => 'Emails sent successfully.'));
        } else {
            echo json_encode(array('success' => false, 'message' => 'Emails could not be sent.'));
        }
    } else {
        echo json_encode(array('success' => false, 'message' => 'No email addresses found for the specified criteria.'));
    }
} else {
    echo json_encode(array('success' => false, 'message' => 'Invalid parameters.'));
}

$conn->close();