<?php
include 'config.php';

// Ensure request is GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get ticket ID from query parameter
    $id = $_GET['id'];

    // Prepare SQL statement to get selected vendors for the ticket
    $query = "SELECT vendor_id FROM ticket WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);

    $response = [];

    if ($stmt->execute()) {
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $vendorIds = explode(',', $row['vendor_id']);

            // Fetch vendor names
            $placeholders = implode(',', array_fill(0, count($vendorIds), '?'));
            $query = "SELECT id, name FROM vendor WHERE id IN ($placeholders)";
            $stmt = $conn->prepare($query);
            $stmt->bind_param(str_repeat('i', count($vendorIds)), ...$vendorIds);
            $stmt->execute();
            $result = $stmt->get_result();

            $selectedVendors = [];
            while ($vendor = $result->fetch_assoc()) {
                $selectedVendors[] = [
                    "value" => $vendor["id"],
                    "label" => $vendor["name"]
                ];
            }

            $response["vendors"] = $selectedVendors;
        } else {
            $response["vendors"] = [];
        }
    } else {
        $response["message"] = "Failed to fetch selected vendors";
    }

    $stmt->close();
    $conn->close();

    echo json_encode($response);
} else {
    echo json_encode(["message" => "Invalid request method"]);
}
