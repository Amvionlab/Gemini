<?php

include 'config.php'; // Ensure this path is correct

if (isset($_GET['id'])) {
    $id = $_GET['id'];
    $query = "
        SELECT 
            ticket.*,
            ticket_type.type AS ticket_type_value,
            ticket_status.status AS ticket_status_name,
            ticket_noc.name AS ticket_noc_value,
            ticket_service.name AS ticket_service_value,
            domain.name AS ticket_domain_value,
            customer.name AS ticket_customer_value,
            location.name AS ticket_location_value,
            sla.level AS ticket_sla_value,
            department.name AS ticket_department_value,
            CONCAT(user.firstname, ' ', user.lastname) AS cname,
            sub_domain.name AS ticket_subdomain_value
            
        FROM 
            ticket
        LEFT JOIN 
            ticket_type ON ticket.ticket_type = ticket_type.id
            LEFT JOIN 
            ticket_noc ON ticket.nature_of_call = ticket_noc.id
            LEFT JOIN 
            ticket_service ON ticket.ticket_service = ticket_service.id
            LEFT JOIN 
            ticket_status ON ticket.status = ticket_status.id
            LEFT JOIN 
            domain ON ticket.domain = domain.id
            LEFT JOIN 
            customer ON ticket.customer_name = customer.id
            LEFT JOIN 
            location ON ticket.customer_location = location.id
            LEFT JOIN 
            department ON ticket.customer_department = department.id
            LEFT JOIN 
            sla ON ticket.sla_priority = sla.id
            LEFT JOIN 
            user ON ticket.created_by = user.id
            LEFT JOIN 
            sub_domain ON ticket.sub_domain = sub_domain.id    
         WHERE 
            ticket.id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $ticket = $result->fetch_assoc();
        echo json_encode($ticket);
    } else {
        echo json_encode(array("message" => "No ticket found with this ID: $id"));
    }

    $stmt->close();
    $conn->close();
} else {
    echo json_encode(array("message" => "Ticket ID not provided."));
}

