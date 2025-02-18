<?php
include 'config.php';

$cond = "1=1";
if (isset($_GET['user'])) {
    $id = intval($_GET['user']);
    $cond = "ticket.created_by = $id";
}
if (isset($_GET['support'])) {
    $id = intval($_GET['support']);
    // Use FIND_IN_SET to check if $id is in the assignees list
    $cond = "(FIND_IN_SET($id, ticket.assignees) OR ticket.created_by = $id)";
}
// Prepare the SQL query to count tickets by their status
$sql = "SELECT status, COUNT(*) as count ,
COUNT(CASE WHEN post_date >= NOW() - INTERVAL 1 DAY THEN 1 END) AS less_than_one_day,
    COUNT(CASE WHEN post_date >= NOW() - INTERVAL 2 DAY AND post_date < NOW() - INTERVAL 1 DAY THEN 1 END) AS one_to_two_days,
    COUNT(CASE WHEN post_date < NOW() - INTERVAL 2 DAY THEN 1 END) AS more_than_two_days

        FROM ticket 
        WHERE 
        $cond
        GROUP BY status
        ";

$result = $conn->query($sql);

$data = [];

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $data[] = [
            "status" => $row['status'],
            "count" => $row['count'],
            "lone" => $row['less_than_one_day'],
            "ott" => $row['one_to_two_days'],
            "gtwo" => $row['more_than_two_days']
        ];
    }
} else {
    echo json_encode(["message" => "No results found"]);
    exit;
}

$conn->close();

echo json_encode($data);
?>
