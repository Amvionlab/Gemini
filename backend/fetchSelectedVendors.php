<?php
include 'config.php';

// Ensure request is GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get ticket ID from query parameter
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;

    if ($id <= 0) {
        echo json_encode(["message" => "Invalid ticket ID"]);
        exit;
    }

    // Prepare SQL statement to get selected vendor IDs for the ticket
    $query = "SELECT vendor_id FROM ticket WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $selectedVendors = [];
    $selectedVendorIds = [];

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $selectedVendorIds = array_filter(explode(',', $row['vendor_id']), 'strlen'); // Remove empty values

        // Fetch selected vendors
        if (!empty($selectedVendorIds)) {
            $placeholders = implode(',', array_fill(0, count($selectedVendorIds), '?'));
            $query = "SELECT id, name FROM vendor WHERE id IN ($placeholders)";
            $stmt = $conn->prepare($query);
            $types = str_repeat('i', count($selectedVendorIds));
            $stmt->bind_param($types, ...array_map('intval', $selectedVendorIds));
            $stmt->execute();
            $result = $stmt->get_result();

            while ($vendor = $result->fetch_assoc()) {
                $selectedVendors[] = [
                    "value" => $vendor["id"],
                    "label" => $vendor["name"]
                ];
            }
        }
    }

    // Fetch all vendors
    $queryAllVendors = "SELECT id, name FROM vendor";
    $resultAllVendors = $conn->query($queryAllVendors);
    $allVendors = [];

    while ($vendor = $resultAllVendors->fetch_assoc()) {
        $allVendors[] = [
            "value" => $vendor["id"],
            "label" => $vendor["name"]
        ];
    }

    // Filter out selected vendors
    $availableVendors = array_filter($allVendors, function ($vendor) use ($selectedVendorIds) {
        return !in_array($vendor["value"], $selectedVendorIds);
    });

    // Response
    $response = [
        "vendors" => array_values($selectedVendors), // Selected vendors
        "availableVendors" => array_values($availableVendors) // Unselected vendors
    ];

    $stmt->close();
    $conn->close();

    echo json_encode($response);
} else {
    echo json_encode(["message" => "Invalid request method"]);
}
?>
