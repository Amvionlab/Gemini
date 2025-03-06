<?php
include 'config.php';

if (isset($_GET['manager'])) {
    $managerId = intval($_GET['manager']);
    
    // Fetch manager details
    $sqlManager = "SELECT firstname, location FROM user WHERE id = $managerId AND usertype = 4";
    $resultManager = $conn->query($sqlManager);
    
    if ($resultManager->num_rows > 0) {
        $manager = $resultManager->fetch_assoc();
        $managerName = $manager['firstname'];
        $locations = explode(', ', $manager['location']); // Split locations into array
        
        // Prepare location conditions for SQL
        $locationConditions = [];
        foreach ($locations as $loc) {
            $locationConditions[] = "customer.gcl_region LIKE '%$loc%'";
        }
        
        $locationQuery = implode(' OR ', $locationConditions);
        $cond = "($locationQuery)";
    } else {
        echo json_encode(array("message" => "No manager found"));
        exit;
    }
} else {
    $cond = "1=1 AND ticket.status != 9";
    if (isset($_GET['user'])) {
        $id = intval($_GET['user']);
        $cond = "ticket.created_by = $id";
    }
    if (isset($_GET['support'])) {
        $id = intval($_GET['support']);
        $cond = "(FIND_IN_SET($id, ticket.assignees) OR ticket.created_by = $id)";
    }
}

$sqlTickets = "SELECT
            ticket.*,
            ticket_type.type AS type,
            ticket_status.status AS status,
            ticket_noc.name AS nature_of_call,
            ticket_service.name AS service,
            domain.name AS domain,
            client.name AS customer,
            location.name AS location,
            sla.level AS sla,
            rca.name AS rca,
            CONCAT(creator.firstname, ' ', creator.lastname) AS name,
            CONCAT(customer.gcl_region,'-',customer.node, '-',customer.a_end) AS customer_branch,
            department.name AS department,
            sub_domain.name AS subdomain,
            GROUP_CONCAT(DISTINCT CONCAT(assignee.firstname, ' ', assignee.lastname) SEPARATOR ' & ') AS assignees,
            IFNULL(
                (
                    SELECT log.post_date
                    FROM log
                    WHERE log.tid = ticket.id
                    AND log.to_status = 4
                    ORDER BY log.id DESC
                    LIMIT 1
                ),
                ''
            ) AS closed_date
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
            client ON ticket.customer_name = client.id
        LEFT JOIN 
            customer ON ticket.customer_location = customer.id
        LEFT JOIN
            location ON ticket.customer_location = location.id
        LEFT JOIN
            department ON ticket.customer_department = department.id
        LEFT JOIN
            sla ON ticket.sla_priority = sla.id
        LEFT JOIN 
            rca ON ticket.rca_id = rca.id
        LEFT JOIN
            sub_domain ON ticket.sub_domain = sub_domain.id
        LEFT JOIN
            user AS creator ON ticket.created_by = creator.id
        LEFT JOIN
            user AS assignee ON FIND_IN_SET(assignee.id, ticket.assignees) > 0
        WHERE
            $cond
        GROUP BY
            ticket.id
        ORDER BY
            ticket.id DESC";

$result = $conn->query($sqlTickets);

if ($result->num_rows > 0) {
    $tickets = [];
    while ($row = $result->fetch_assoc()) {
        $tickets[] = $row;
    }
    echo json_encode($tickets);
} else {
    echo json_encode(array("message" => "No tickets found"));
}