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

        $sqlTickets = "
            SELECT 
                ticket.id,
                ticket.docket_no,
                client.name AS customer,
                ticket_type.type AS type,
                ticket_status.status AS status,
                ticket_noc.name AS nature_of_call,
                ticket_service.name AS service,
                domain.name AS domain,
                sub_domain.name AS subdomain,
                rca.name AS rca,
                CONCAT(creator.firstname, ' ', creator.lastname) AS name,
                ticket.post_Date AS opened_by,
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
                CONCAT(
                    FLOOR(TIMESTAMPDIFF(MINUTE, ticket.post_Date, IFNULL(
                        (
                            SELECT log.post_date 
                            FROM log 
                            WHERE log.tid = ticket.id 
                            AND log.to_status = 4 
                            ORDER BY log.id DESC
                            LIMIT 1
                        ), 
                        ticket.post_Date
                    )) / 60), ' Hr ',
                    MOD(TIMESTAMPDIFF(MINUTE, ticket.post_Date, IFNULL(
                        (
                            SELECT log.post_date 
                            FROM log 
                            WHERE log.tid = ticket.id 
                            AND log.to_status = 4 
                            ORDER BY log.id DESC
                            LIMIT 1
                        ), 
                        ticket.post_Date
                    )), 60), ' Min'
                ) AS time_taken,
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
                customer.service_provider
            FROM 
                ticket
            JOIN
                customer ON ticket.customer_location = customer.id
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
                rca ON ticket.rca_id = rca.id
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
            fputcsv($output, ['Ticket ID', 'Customer', 'Type', 'Status', 'Nature of Call', 'Service', 'Domain', 'Subdomain', 'RCA', 'Docket No', 'Assignees', 'Created By', 'Created On', 'Closed On', 'Time Taken', 'Unique Code', 'Region', 'Branch Code', 'A End', 'B End', 'Node', 'Modem Type', 'Router IP', 'Primary Link', 'WAN IP', 'Circuit ID', 'Bandwidth', 'Location Type', 'Address', 'Contact Person', 'Mobile', 'Commissioned Date', 'State/City', 'Email', 'Customer SLA', 'Service Provider', 'Timesheet', 'Logs']);

            // Write each row as CSV
            while ($row = $result->fetch_assoc()) {
                // For each ticket, fetch logs and timesheet data
                $ticketId = $row['id'];
                
                // Fetch logs for the ticket
                $sqlLogs = "SELECT log.*, 
                            CONCAT(user.firstname, ' ', user.lastname) AS name,
                            from_status.status AS statusfrom,
                            to_status.status AS statusto
                        FROM log
                        LEFT JOIN user ON log.done_by = user.id
                        LEFT JOIN ticket_status AS from_status ON log.from_status = from_status.id
                        LEFT JOIN ticket_status AS to_status ON log.to_status = to_status.id
                        WHERE log.tid = $ticketId";
                $resultLogs = $conn->query($sqlLogs);
                $logs = [];
                if ($resultLogs->num_rows > 0) {
                    while ($logRow = $resultLogs->fetch_assoc()) {
                        $logs[] = $logRow;
                    }
                }

                // Fetch timesheet entries for the ticket
                $sqlTimesheet = "SELECT timesheet.*, 
                                CONCAT(user.firstname, ' ', user.lastname) AS name
                            FROM timesheet
                            LEFT JOIN user ON timesheet.done_by = user.id
                            WHERE timesheet.tid = $ticketId AND timesheet.is_active = 1";

                $resultTimesheet = $conn->query($sqlTimesheet);
                $timesheet = [];
                if ($resultTimesheet->num_rows > 0) {
                    while ($timesheetRow = $resultTimesheet->fetch_assoc()) {
                        $timesheet[] = $timesheetRow;
                    }
                }

                // Format logs and timesheet as string for CSV
                $logsStr = '';
                foreach ($logs as $log) {
                    $logsStr .= $log['date'] . ' (' . $log['name'] . ') - ' . $log['statusto'] . "; ";
                }

                $timesheetStr = '';
                foreach ($timesheet as $ts) {
                    $timesheetStr .= $ts['date'] . ' (' . $ts['name'] . ') - ' . $ts['totalhours'] . " hours; ";
                }

                // Add ticket data along with logs and timesheet to CSV
                $csvRow = [
                    $row['id'], $row['customer'], $row['type'], $row['status'], 
                    $row['nature_of_call'], $row['service'], $row['domain'], 
                    $row['subdomain'], $row['rca'], $row['docket_no'], $row['assignees'], $row['name'], 
                    $row['opened_by'], $row['closed_date'], $row['time_taken'], 
                    $row['gcl_unique_code'], $row['gcl_region'], 
                    $row['branch_code'], $row['a_end'], $row['b_end'], 
                    $row['node'], $row['modem_type'], 
                    $row['router_ip'], $row['primary_link'], 
                    $row['wan_ip'], $row['circuit_id'], 
                    $row['band_width'], $row['location_type'], 
                    $row['address'], $row['contact_person'], 
                    $row['mobile'], $row['commissioned_date'], 
                    $row['state_city'], $row['email'], 
                    $row['customer_sla'], $row['service_provider'],
                    $timesheetStr,
                    $logsStr
                ];

                // Write ticket data to the CSV
                fputcsv($output, $csvRow);
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