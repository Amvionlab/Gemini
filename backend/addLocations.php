<?php
// Include database connection details
include('config.php');

try {
    // Fetch data from the 'customer' table
    $stmt = $pdo->query("SELECT id, name, location FROM customer");
    $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Group customers by location
    $locationGroups = [];
    foreach ($customers as $customer) {
        $location = $customer['location'];
        $name = $customer['name'];

        if (!isset($locationGroups[$location])) {
            $locationGroups[$location] = [];
        }
        if (!in_array($name, $locationGroups[$location])) {
            $locationGroups[$location][] = $name;
        }
    }

    // Insert or update the 'location' table
    foreach ($locationGroups as $location => $names) {
        $groupedNames = implode(', ', $names);

        // Check if the location already exists
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM location WHERE name = :name AND location = :location");
        $stmt->execute(['name' => $groupedNames, 'location' => $location]);
        $count = $stmt->fetchColumn();

        if ($count == 0) {
            // Insert new location
            $stmt = $pdo->prepare("INSERT INTO location (name, location) VALUES (:name, :location)");
            $stmt->execute(['name' => $groupedNames, 'location' => $location]);
        } else {
            // Optionally, you can update existing records if needed
            // $stmt = $pdo->prepare("UPDATE location SET name = :name WHERE location = :location");
            // $stmt->execute(['name' => $groupedNames, 'location' => $location]);
        }
    }

    echo "Locations have been processed successfully.";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>
