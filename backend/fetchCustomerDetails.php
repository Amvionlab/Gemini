<?php
include 'config.php';

// Adding UTF-8 BOM for proper encoding in Excel
header('Content-Type: text/csv; charset=UTF-8');
header('Content-Disposition: attachment; filename="tickets_report.csv"');

// Output UTF-8 BOM for Excel to recognize encoding
echo "\xEF\xBB\xBF";

if (isset($_GET['ids'])) {
    // Get IDs from the query parameters
    $ids = explode(',', $_GET['ids']);
    $ids = array_map('intval', $ids); // Ensure IDs are integers for security

    if (!empty($ids)) {
        // Prepare SQL by injecting the list of IDs
        $idsPlaceholder = implode(',', $ids);

        $sqlTickets = "SELECT 
                ticket.id,
                ticket_type.type AS type,
                ticket_status.status AS status,
                ticket_noc.name AS nature_of_call,
                ticket_service.name AS service,
                domain.name AS domain,
                client.name AS customer,
                location.name AS location,
                sla.level AS sla,
                CONCAT(creator.firstname, ' ', creator.lastname) AS name,
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
                ) AS closed_date,
                customer.id AS id,
                customer.cid,
                customer.gcl_unique_code,
                customer.gcl_region,
                customer.branch_code,
                customer.a_end,
                customer.b_end,
                customer.node,
                customer.modem_type,
                customer.router_ip,
                customer.primary_link,
                customer.wan_ip,
                customer.circuit_id,
                customer.band_width,
                customer.location_type,
                customer.address,
                customer.contact_person,
                customer.mobile,
                customer.commissioned_date,
                customer.state_city,
                customer.email,
                customer.sla AS customer_sla,
                customer.service_provider,
                customer.is_active,
                customer.post_date AS customer_post_date
            FROM 
                ticket
            JOIN
                customer
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
                location ON ticket.customer_location = location.id
            LEFT JOIN 
                department ON ticket.customer_department = department.id
            LEFT JOIN 
                sla ON ticket.sla_priority = sla.id
            LEFT JOIN 
                sub_domain ON ticket.sub_domain = sub_domain.id
            LEFT JOIN 
                user AS creator ON ticket.created_by = creator.id
            LEFT JOIN 
                user AS assignee ON FIND_IN_SET(assignee.id, ticket.assignees) > 0
            WHERE 
                ticket.id IN ($idsPlaceholder)
            GROUP BY 
                ticket.id
            ORDER BY 
                ticket.id DESC";

        $result = $conn->query($sqlTickets);

        if ($result->num_rows > 0) {
            $output = fopen('php://output', 'w');
            // Write the headers (ensure headers align with your expected data fields)
            fputcsv($output, ['ID', 'Type', 'Status', 'Nature of Call', 'Service', 'Domain', 'Customer', 'Location', 'SLA', 'Name', 'Department', 'Subdomain', 'Assignees', 'Closed Date', 'Customer ID', 'CID', 'Unique Code', 'Region', 'Branch Code', 'A End', 'B End', 'Node', 'Modem Type', 'Router IP', 'Primary Link', 'WAN IP', 'Circuit ID', 'Bandwidth', 'Location Type', 'Address', 'Contact Person', 'Mobile', 'Commissioned Date', 'State/City', 'Email', 'Customer SLA', 'Service Provider', 'Is Active', 'Customer Post Date']);

            // Write each row as CSV
            while ($row = $result->fetch_assoc()) {
                fputcsv($output, $row);
            }

            fclose($output);
        } else {
            echo "No tickets found for the provided IDs.";
        }
    } else {
        echo "Invalid or missing IDs.";
    }
} else {
    echo "No ID parameters provided.";
}
?>