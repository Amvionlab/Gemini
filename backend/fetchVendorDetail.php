<?php
include 'config.php';
header('Content-Type: application/json');
$type = urldecode($_GET['type']);
$tag = $_GET['tag'];

// Initialize variables
$emp_id = null;
$userDetails = null;

// Get the ID from the tag (assuming tag format "DESK0001" where "0001" is the ID)
$id = (int) filter_var($tag, FILTER_SANITIZE_NUMBER_INT);

// Construct the dynamic table name based on type
$tableName = "asset_" . strtolower($type);

try {
    // Prepare the query to fetch the details from the respective table
    $query = "SELECT vendor_name FROM $tableName WHERE tag = ? AND is_active=1 LIMIT 1";
    $stmt = $conn->prepare($query);

    $stmt->bind_param("s", $tag);

    $stmt->execute();

    $result = $stmt->get_result()->fetch_assoc();

    if ($result) {
        // Extract the emp_id from the result
        $emp_id = $result['vendor_name'];
        if ($emp_id) {
            $query = "SELECT * FROM vendor WHERE id = ? LIMIT 1";
            $stmt = $conn->prepare($query);
            $stmt->bind_param("s", $emp_id);
            $stmt->execute();

            $result = $stmt->get_result();
            $userDetails = $result->fetch_assoc();
            $stmt->close();
        }
    }

    // Output the user details as JSON
    if ($userDetails) {
        echo json_encode($userDetails);
    } else {
        echo json_encode(['Not Given' => 'No Vendor details found.']);
    }
} catch (PDOException $e) {
    // Return an error message in JSON format
    echo json_encode(['error' => 'Error fetching data: ' . $e->getMessage()]);
}
?>