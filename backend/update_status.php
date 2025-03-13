<?php

include 'config.php'; 

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $type = $_GET['type'];
    // Initialize condition variable
    $cond = "ticket.ticket_type = $type"; // This ensures that the query is always valid

    if (isset($_GET['user'])) {
        $id = intval($_GET['user']);
        $cond = "ticket.created_by = $id AND ticket.ticket_type = $type";
    }
    if (isset($_GET['support'])) {
        $id = intval($_GET['support']);
        // Use FIND_IN_SET to check if $id is in the assignees list
        $cond = "(FIND_IN_SET($id, ticket.assignees) OR ticket.created_by = $id) AND ticket.ticket_type = $type";
    }
    if (isset($_GET['manager'])) {
        $managerId = intval($_GET['manager']);
        
        // Fetch manager details
        $sqlManager = "SELECT firstname, location FROM user WHERE id = $managerId AND usertype = 4";
        $resultManager = $conn->query($sqlManager);
        
        if ($resultManager->num_rows > 0) {
            $manager = $resultManager->fetch_assoc();
            $locations = explode(', ', $manager['location']); // Split locations into array
            
            // Prepare location conditions for SQL
            $locationConditions = [];
            foreach ($locations as $loc) {
                $locationConditions[] = "customer.gcl_region LIKE '%$loc%'";
            }
            
            $locationQuery = implode(' OR ', $locationConditions);
            $cond = "($locationQuery) AND ticket.ticket_type = $type";
        } else {
            echo json_encode(array("message" => "No manager found"));
            exit;
        }
    }
    
    $query = "
    SELECT 
        ticket.id,ticket.status,
        client.name AS ticket_customer_value,
        CONCAT(customer.gcl_region,'-',customer.node, '-',customer.a_end) AS customer_branch,
        CASE
            WHEN ticket.post_date >= NOW() - INTERVAL 1 DAY THEN 1
            WHEN ticket.post_date >= NOW() - INTERVAL 2 DAY AND ticket.post_date < NOW() - INTERVAL 1 DAY THEN 2
            WHEN ticket.post_date < NOW() - INTERVAL 2 DAY THEN 3
        END AS color
    FROM 
        ticket
    LEFT JOIN 
        ticket_status ON ticket.status = ticket_status.id
    LEFT JOIN
        client ON ticket.customer_name = client.id
    LEFT JOIN 
        customer ON ticket.customer_location = customer.id
    WHERE 
        $cond";

    $result = $conn->query($query);
    
    $tickets = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $tickets[] = $row;
        }
    }

    echo json_encode($tickets);
}
elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Update ticket status
    $id = $_POST['id'];
    $newStatus = $_POST['status'];

    $query = "UPDATE ticket SET status = ? WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("si", $newStatus, $id);

    if ($stmt->execute()) {
        echo json_encode(["message" => "Status updated successfully"]);
    } else {
        echo json_encode(["message" => "Failed to update status"]);
    }

    $stmt->close();
    $conn->close();
}

?>