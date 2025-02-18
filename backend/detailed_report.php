<?php 
include 'config.php'; 

// Check if export parameter is set in the URL
if (isset($_GET['export']) && $_GET['export'] == 'true') {
    // Set headers for CSV download
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="ticket_report.csv"');
    
    // Open PHP output stream for writing the CSV
    $output = fopen('php://output', 'w');

    // Add the CSV header row
    $headers = [
        'Ticket ID', 'Type', 'Status', 'Nature of Call', 'Service', 'Domain', 
        'Customer', 'Location', 'SLA', 'Created By', 'Department', 'Subdomain', 
        'Assignees', 'Closed Date', 'Logs', 'Timesheet'
    ];
    fputcsv($output, $headers);

    // Fetch tickets
    $cond = "1=1 AND ticket.status != 9";
    if (isset($_GET['user'])) {
        $id = intval($_GET['user']);
        $cond = "ticket.created_by = $id";
    }
    if (isset($_GET['support'])) {
        $id = intval($_GET['support']);
        // Use FIND_IN_SET to check if $id is in the assignees list
        $cond = "(FIND_IN_SET($id, ticket.assignees) OR ticket.created_by = $id)";
    }
    
    $sqlTickets = "SELECT 
                ticket.*,
                ticket_type.type AS type,
                ticket_status.status AS status,
                ticket_noc.name AS nature_of_call,
                ticket_service.name AS service,
                domain.name AS domain,
                customer.name AS customer,
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
                        AND log.to_status = 8 
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
                customer ON ticket.customer_name = customer.id
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
            LEFT JOIN 
                (
                    SELECT 
                        log.tid, 
                        log.post_date AS closed_date
                    FROM 
                        log
                    WHERE 
                        log.to_status = 8
                ) AS log ON log.tid = ticket.id
            WHERE 
                $cond
            GROUP BY 
                ticket.id
            ORDER BY 
                ticket.id DESC";

    $result = $conn->query($sqlTickets);

    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
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
                $row['id'], $row['type'], $row['status'], $row['nature_of_call'], $row['service'], $row['domain'],
                $row['customer'], $row['location'], $row['sla'], $row['name'], $row['department'], $row['subdomain'],
                $row['assignees'], $row['closed_date'], $logsStr, $timesheetStr
            ];

            // Write ticket data to the CSV
            fputcsv($output, $csvRow);
        }
    }
    
    // Close the output stream
    fclose($output);
    exit; // End the script to prevent further output
} else {
    // Regular page load with data (non-export mode)
    $cond = "1=1 AND ticket.status != 9";
    if (isset($_GET['user'])) {
        $id = intval($_GET['user']);
        $cond = "ticket.created_by = $id";
    }
    if (isset($_GET['support'])) {
        $id = intval($_GET['support']);
        // Use FIND_IN_SET to check if $id is in the assignees list
        $cond = "(FIND_IN_SET($id, ticket.assignees) OR ticket.created_by = $id)";
    }
    
    $sqlTickets = "SELECT 
                ticket.*,
                ticket_type.type AS type,
                ticket_status.status AS status,
                ticket_noc.name AS nature_of_call,
                ticket_service.name AS service,
                domain.name AS domain,
                customer.name AS customer,
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
                        AND log.to_status = 8 
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
                customer ON ticket.customer_name = customer.id
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
            LEFT JOIN 
                (
                    SELECT 
                        log.tid, 
                        log.post_date AS closed_date
                    FROM 
                        log
                    WHERE 
                        log.to_status = 8
                ) AS log ON log.tid = ticket.id
            WHERE 
                $cond
            GROUP BY 
                ticket.id
            ORDER BY 
                ticket.id DESC";

    $result = $conn->query($sqlTickets);

    if ($result->num_rows > 0) {
        $tickets = [];
        while($row = $result->fetch_assoc()) {
            $tickets[] = $row;
        }
        echo json_encode($tickets);
    } else {
        echo json_encode(array("message" => "No tickets found"));
    }
}
?>
