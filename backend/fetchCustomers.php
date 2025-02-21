<?php
include 'config.php';

header('Content-Type: application/json');

$sql = "SELECT * FROM customer";  // Fetch all customers
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $customers = [];
    while ($row = $result->fetch_assoc()) {
        $customers[] = [
            "cid" => $row["cid"],
            "client_id" => $row["cid"], // Make sure client_id is coming
            "gcl_unique_code" => $row["gcl_unique_code"],
            "gcl_region" => $row["gcl_region"],
            "branch_code" => $row["branch_code"],
            "a_end" => $row["a_end"],
            "b_end" => $row["b_end"],
            "node" => $row["node"],
            "modem_type" => $row["modem_type"],
            "router_ip" => $row["router_ip"],
            "primary_link" => $row["primary_link"],
            "wan_ip" => $row["wan_ip"],
            "circuit_id" => $row["circuit_id"],
            "band_width" => $row["band_width"],
            "location_type" => $row["location_type"],
            "address" => $row["address"],
            "contact_number" => $row["contact_number"], 
            "mobile_number" => $row["mobile_number"],
            "commissioned_date" => $row["commissioned_date"],
            "state_city" => $row["state_city"],
            "email_id" => $row["email_id"],
            "sla" => $row["sla"],
            "service_provider" => $row["service_provider"]
        ];
    }
    echo json_encode($customers);
} else {
    echo json_encode([]);
}

$conn->close();
?>
