<?php
include 'config.php';

$data = json_decode(file_get_contents('php://input'), true);

$encryptedEmail = $data['encryptedEmail'];
$encryptedPassword = $data['encryptedPassword'];
$key = $data['key'];

function xorDecrypt($data, $key) {
    $data = base64_decode($data);
    $decrypted = '';
    for ($i = 0; $i < strlen($data); $i++) {
        $decrypted .= chr(ord($data[$i]) ^ ord($key[$i % strlen($key)]));
    }
    return $decrypted;
}

$email = xorDecrypt($encryptedEmail, $key);
$password = xorDecrypt($encryptedPassword, $key);

// Sanitize inputs
$email = mysqli_real_escape_string($conn, $email);
$password = mysqli_real_escape_string($conn, $password);

// Query to fetch user with matching email
$sql = "SELECT * FROM user WHERE username = '$email'";
$result = mysqli_query($conn, $sql);

if (!$result) {
    echo json_encode(['status' => 'error', 'message' => 'Database query failed: ' . mysqli_error($conn)]);
    exit;
}

if (mysqli_num_rows($result) > 0) {
    $user = mysqli_fetch_assoc($result);
    // Validate password
    if ($password == $user['password']) {
        $usertype = $user['usertype'];
        
        // Query to fetch access details with matching usertype
        $accessSql = "SELECT * FROM access WHERE id = '$usertype'";
        $accessResult = mysqli_query($conn, $accessSql);

        if (!$accessResult) {
            echo json_encode(['status' => 'error', 'message' => 'Database query failed: ' . mysqli_error($conn)]);
            exit;
        }

        if (mysqli_num_rows($accessResult) > 0) {
            $access = mysqli_fetch_assoc($accessResult);

            echo json_encode([
                'status' => 'success',
                'userid' => $user['id'],
                'accessid' => $user['usertype'],
                'email' => $user['email'],
                'mobile' => $user['mobile'],
                'firstname' => $user['firstname'],
                'lastname' => $user['lastname'],
                'photo' => $user['photo'],
                'name' => $access['name'],
                'ticket' => $access['ticket'],
                'dashboard' => $access['dashboard'],
                'analytics' => $access['analytics'],
                'singleticket' => $access['singleticket'],
                'creation' => $access['creation'],
                'assign' => $access['assign'],
                'ticketaction' => $access['ticketaction']

            ]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'No access details found for the given usertype']);
        }

    } else {
        echo json_encode(['status' => 'error', 'message' => 'Invalid email or password']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid email or password']);
}

mysqli_close($conn);
?>