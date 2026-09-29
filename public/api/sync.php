<?php
// Universal Real-Time MySQL Synchronization API for cPanel
// Connects Desktop, Mobile, and Tablet to a shared live central database

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$configFile = __DIR__ . '/db_config.json';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? ($method === 'POST' ? 'push' : 'pull');

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);
if (!is_array($input)) {
    $input = $_POST;
}

function getPdoConnection($config) {
    $host = $config['dbHost'] ?? $config['host'] ?? 'localhost';
    $port = $config['dbPort'] ?? $config['port'] ?? '3306';
    $dbName = $config['dbName'] ?? $config['database'] ?? '';
    $user = $config['dbUser'] ?? $config['username'] ?? '';
    $pass = $config['dbPassword'] ?? $config['password'] ?? '';
    $charset = $config['dbCharset'] ?? 'utf8mb4';

    $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset={$charset}";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 5,
    ];
    return new PDO($dsn, $user, $pass, $options);
}

// Automatically create all structured relational tables in phpMyAdmin
function ensureAllSchemaTables($pdo, $prefix) {
    try {
        // 1. Sync store key-value table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}sync_store` (
            `store_key` VARCHAR(191) NOT NULL PRIMARY KEY,
            `store_value` LONGTEXT NOT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 2. Customers Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}customers` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `contact_id` VARCHAR(100) DEFAULT NULL,
            `name` VARCHAR(255) NOT NULL,
            `business_name` VARCHAR(255) DEFAULT NULL,
            `phone` VARCHAR(50) DEFAULT NULL,
            `email` VARCHAR(191) DEFAULT NULL,
            `address` TEXT DEFAULT NULL,
            `opening_balance` DECIMAL(15,2) DEFAULT 0.00,
            `credit_limit` DECIMAL(15,2) DEFAULT 0.00,
            `total_due` DECIMAL(15,2) DEFAULT 0.00,
            `total_sales` DECIMAL(15,2) DEFAULT 0.00,
            `loyalty_points` INT DEFAULT 0,
            `created_date` VARCHAR(50) DEFAULT NULL,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 3. Products Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}products` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `sku` VARCHAR(100) DEFAULT NULL,
            `name` VARCHAR(255) NOT NULL,
            `barcode` VARCHAR(100) DEFAULT NULL,
            `brand` VARCHAR(100) DEFAULT NULL,
            `category` VARCHAR(100) DEFAULT NULL,
            `unit` VARCHAR(50) DEFAULT NULL,
            `cost_price` DECIMAL(15,2) DEFAULT 0.00,
            `selling_price` DECIMAL(15,2) DEFAULT 0.00,
            `current_stock` DECIMAL(15,2) DEFAULT 0.00,
            `alert_quantity` DECIMAL(15,2) DEFAULT 0.00,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 4. Suppliers Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}suppliers` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `contact_id` VARCHAR(100) DEFAULT NULL,
            `name` VARCHAR(255) NOT NULL,
            `business_name` VARCHAR(255) DEFAULT NULL,
            `phone` VARCHAR(50) DEFAULT NULL,
            `email` VARCHAR(191) DEFAULT NULL,
            `total_payable` DECIMAL(15,2) DEFAULT 0.00,
            `total_purchases` DECIMAL(15,2) DEFAULT 0.00,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 5. Transactions Table (Sales, Purchases, Returns)
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}transactions` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `type` VARCHAR(50) NOT NULL,
            `sale_channel` VARCHAR(50) DEFAULT 'standard',
            `invoice_no` VARCHAR(100) DEFAULT NULL,
            `date` VARCHAR(50) DEFAULT NULL,
            `customer_id` VARCHAR(191) DEFAULT NULL,
            `customer_name` VARCHAR(255) DEFAULT NULL,
            `supplier_id` VARCHAR(191) DEFAULT NULL,
            `supplier_name` VARCHAR(255) DEFAULT NULL,
            `total_amount` DECIMAL(15,2) DEFAULT 0.00,
            `paid_amount` DECIMAL(15,2) DEFAULT 0.00,
            `due_amount` DECIMAL(15,2) DEFAULT 0.00,
            `status` VARCHAR(50) DEFAULT NULL,
            `payment_status` VARCHAR(50) DEFAULT NULL,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 6. Users Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}users` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `name` VARCHAR(255) DEFAULT NULL,
            `username` VARCHAR(100) DEFAULT NULL,
            `email` VARCHAR(191) DEFAULT NULL,
            `role` VARCHAR(50) DEFAULT NULL,
            `status` VARCHAR(50) DEFAULT NULL,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 7. Categories Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}categories` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `code` VARCHAR(100) DEFAULT NULL,
            `description` TEXT DEFAULT NULL,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 8. Brands Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}brands` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `description` TEXT DEFAULT NULL,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 9. Expenses Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}expenses` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `ref_no` VARCHAR(100) DEFAULT NULL,
            `date` VARCHAR(50) DEFAULT NULL,
            `category` VARCHAR(100) DEFAULT NULL,
            `amount` DECIMAL(15,2) DEFAULT 0.00,
            `note` TEXT DEFAULT NULL,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 10. Sales Commission Agents / Sales Representatives Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}sales_commission_agents` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `email` VARCHAR(191) DEFAULT NULL,
            `phone` VARCHAR(50) DEFAULT NULL,
            `address` TEXT DEFAULT NULL,
            `commission_percentage` DECIMAL(5,2) DEFAULT 0.00,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 11. Units of Measurement Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}units` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `short_name` VARCHAR(100) DEFAULT NULL,
            `allow_decimal` TINYINT(1) DEFAULT 0,
            `is_base_unit` TINYINT(1) DEFAULT 1,
            `base_unit_id` VARCHAR(191) DEFAULT NULL,
            `base_unit_multiplier` DECIMAL(15,4) DEFAULT NULL,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 12. Customer Groups Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}customer_groups` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `amount` DECIMAL(15,2) DEFAULT 0.00,
            `percentage` DECIMAL(5,2) DEFAULT 0.00,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 13. Warranties Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}warranties` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `duration` INT DEFAULT 0,
            `duration_type` VARCHAR(50) DEFAULT NULL,
            `description` TEXT DEFAULT NULL,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 14. Racks Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}racks` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `location_id` VARCHAR(191) DEFAULT NULL,
            `row` VARCHAR(100) DEFAULT NULL,
            `position` VARCHAR(100) DEFAULT NULL,
            `description` TEXT DEFAULT NULL,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 15. Tax Rates Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}tax_rates` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `amount` DECIMAL(5,2) DEFAULT 0.00,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 16. Tax Groups Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}tax_groups` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `amount` DECIMAL(5,2) DEFAULT 0.00,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 17. Currencies Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}currencies` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `country` VARCHAR(100) DEFAULT NULL,
            `currency` VARCHAR(100) DEFAULT NULL,
            `code` VARCHAR(50) DEFAULT NULL,
            `symbol` VARCHAR(50) DEFAULT NULL,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 18. Accounts Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}accounts` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `account_number` VARCHAR(100) DEFAULT NULL,
            `account_type` VARCHAR(100) DEFAULT NULL,
            `opening_balance` DECIMAL(15,2) DEFAULT 0.00,
            `balance` DECIMAL(15,2) DEFAULT 0.00,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 19. Payment Methods Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}payment_methods` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `is_default` TINYINT(1) DEFAULT 0,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 20. Locations / Branch Outlets Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}locations` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `code` VARCHAR(50) DEFAULT NULL,
            `city` VARCHAR(100) DEFAULT NULL,
            `state` VARCHAR(100) DEFAULT NULL,
            `country` VARCHAR(100) DEFAULT NULL,
            `zip_code` VARCHAR(20) DEFAULT NULL,
            `mobile` VARCHAR(50) DEFAULT NULL,
            `email` VARCHAR(191) DEFAULT NULL,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 21. POS Registers & Shift Security Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}registers` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `status` VARCHAR(50) DEFAULT 'closed',
            `location_id` VARCHAR(191) DEFAULT NULL,
            `cashier_name` VARCHAR(255) DEFAULT NULL,
            `opening_cash` DECIMAL(15,2) DEFAULT 0.00,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 22. Variations & Combo Types Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}variations` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `name` VARCHAR(255) NOT NULL,
            `product_id` VARCHAR(191) DEFAULT NULL,
            `sub_sku` VARCHAR(100) DEFAULT NULL,
            `type` VARCHAR(50) DEFAULT 'variable',
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 23. Stock Adjustments Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}stock_adjustments` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `reference_no` VARCHAR(100) DEFAULT NULL,
            `location_id` VARCHAR(191) DEFAULT NULL,
            `total_amount` DECIMAL(15,2) DEFAULT 0.00,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 24. Branch Transfers Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}stock_transfers` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `reference_no` VARCHAR(100) DEFAULT NULL,
            `source_location_id` VARCHAR(191) DEFAULT NULL,
            `target_location_id` VARCHAR(191) DEFAULT NULL,
            `status` VARCHAR(50) DEFAULT 'completed',
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 25. Product History Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}product_history` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `product_id` VARCHAR(191) DEFAULT NULL,
            `action` VARCHAR(100) DEFAULT NULL,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 26. Purchase Requisitions Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}purchase_requisitions` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `reference_no` VARCHAR(100) DEFAULT NULL,
            `status` VARCHAR(50) DEFAULT 'pending',
            `location_id` VARCHAR(191) DEFAULT NULL,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // 27. Notification Templates Table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}notification_templates` (
            `id` VARCHAR(191) NOT NULL PRIMARY KEY,
            `template_type` VARCHAR(100) DEFAULT NULL,
            `subject` VARCHAR(255) DEFAULT NULL,
            `data_json` LONGTEXT DEFAULT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    } catch (Exception $e) {
        // Ignore table setup warnings if already created
    }
}

// 1. Action: Test DB Connection
if ($action === 'test_db') {
    try {
        $pdo = getPdoConnection($input);
        echo json_encode([
            'success' => true,
            'message' => 'Connected successfully to MySQL server! Database is ready.',
            'server_info' => $pdo->getAttribute(PDO::ATTR_SERVER_VERSION),
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Connection failed: ' . $e->getMessage(),
        ]);
    }
    exit;
}

// 2. Action: Save DB Config & Initialize Sync Tables
if ($action === 'save_config') {
    try {
        $prefix = preg_replace('/[^a-zA-Z0-9_]/', '', $input['dbPrefix'] ?? 'pos_');

        // 1. Immediately write db_config.json FIRST so file is ALWAYS created!
        $safeConfig = [
            'dbEngine' => 'mysql',
            'dbHost' => $input['dbHost'] ?? 'localhost',
            'dbPort' => $input['dbPort'] ?? '3306',
            'dbName' => $input['dbName'] ?? '',
            'dbUser' => $input['dbUser'] ?? '',
            'dbPassword' => $input['dbPassword'] ?? '',
            'dbPrefix' => $prefix,
            'configuredAt' => date('c'),
        ];
        file_put_contents($configFile, json_encode($safeConfig, JSON_PRETTY_PRINT));
        @chmod($configFile, 0666);

        // 2. Connect to database and ensure tables
        $pdo = getPdoConnection($input);
        ensureAllSchemaTables($pdo, $prefix);
        @touch(__DIR__ . '/.tables_created');
        $pdo = null;

        echo json_encode([
            'success' => true,
            'message' => 'MySQL database credentials saved and tables initialized in phpMyAdmin.',
        ]);
    } catch (Exception $e) {
        // Even if tables throw a warning, credentials file is ALREADY safely on disk!
        echo json_encode([
            'success' => true,
            'configSaved' => true,
            'message' => 'Database configuration saved. Table notice: ' . $e->getMessage(),
        ]);
    }
    exit;
}

// Check database configuration file
if (!file_exists($configFile)) {
    echo json_encode([
        'success' => false,
        'isConfigured' => false,
        'message' => 'Database configuration not found. Please complete installer.',
    ]);
    exit;
}

$dbConfig = json_decode(file_get_contents($configFile), true);
if (!$dbConfig || empty($dbConfig['dbName'])) {
    echo json_encode([
        'success' => false,
        'isConfigured' => false,
        'message' => 'Invalid database configuration.',
    ]);
    exit;
}

// Action: Manual init tables if requested
if ($action === 'init_tables') {
    try {
        $pdo = getPdoConnection($dbConfig);
        $prefix = preg_replace('/[^a-zA-Z0-9_]/', '', $dbConfig['dbPrefix'] ?? 'pos_');
        ensureAllSchemaTables($pdo, $prefix);
        @touch(__DIR__ . '/.tables_created');
        $pdo = null;
        echo json_encode([
            'success' => true,
            'message' => 'All database tables successfully created in phpMyAdmin.',
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to initialize tables: ' . $e->getMessage(),
        ]);
    }
    exit;
}

// 3. Action: PULL
if ($action === 'pull' || $method === 'GET') {
    try {
        $pdo = getPdoConnection($dbConfig);
        $prefix = preg_replace('/[^a-zA-Z0-9_]/', '', $dbConfig['dbPrefix'] ?? 'pos_');
        
        // Only run DDL once if tables have never been created
        $tableMarker = __DIR__ . '/.tables_created';
        if (!file_exists($tableMarker)) {
            ensureAllSchemaTables($pdo, $prefix);
            @touch($tableMarker);
        }

        $data = [];
        $latestTimestamp = null;

        // A. Load key-value store items
        $stmt = $pdo->query("SELECT `store_key`, `store_value`, `updated_at` FROM `{$prefix}sync_store`");
        $rows = $stmt->fetchAll();
        foreach ($rows as $row) {
            $data[$row['store_key']] = json_decode($row['store_value'], true);
            if (!$latestTimestamp || $row['updated_at'] > $latestTimestamp) {
                $latestTimestamp = $row['updated_at'];
            }
        }

        // B. Query structured tables for live records
        $entityTables = [
            'customers' => "{$prefix}customers",
            'products' => "{$prefix}products",
            'suppliers' => "{$prefix}suppliers",
            'transactions' => "{$prefix}transactions",
            'users' => "{$prefix}users",
            'categories' => "{$prefix}categories",
            'brands' => "{$prefix}brands",
            'expenses' => "{$prefix}expenses",
            'sales_commission_agents' => "{$prefix}sales_commission_agents",
            'units' => "{$prefix}units",
            'customer_groups' => "{$prefix}customer_groups",
            'warranties' => "{$prefix}warranties",
            'racks' => "{$prefix}racks",
            'tax_rates' => "{$prefix}tax_rates",
            'tax_groups' => "{$prefix}tax_groups",
            'currencies' => "{$prefix}currencies",
            'accounts' => "{$prefix}accounts",
            'payment_methods' => "{$prefix}payment_methods",
            'locations' => "{$prefix}locations",
            'registers' => "{$prefix}registers",
            'variations' => "{$prefix}variations",
            'stock_adjustments' => "{$prefix}stock_adjustments",
            'stock_transfers' => "{$prefix}stock_transfers",
            'product_history' => "{$prefix}product_history",
            'purchase_requisitions' => "{$prefix}purchase_requisitions",
            'notification_templates' => "{$prefix}notification_templates",
        ];

        foreach ($entityTables as $key => $tableName) {
            try {
                $tStmt = $pdo->query("SELECT * FROM `{$tableName}`");
                $tRows = $tStmt->fetchAll();
                if ($tRows && count($tRows) > 0) {
                    $items = [];
                    foreach ($tRows as $r) {
                        $item = !empty($r['data_json']) ? json_decode($r['data_json'], true) : [];
                        if (!is_array($item)) $item = [];

                        if ($key === 'customers') {
                            $item['id'] = (string)($r['id'] ?? $item['id'] ?? '');
                            $item['contactId'] = !empty($r['contact_id']) ? (string)$r['contact_id'] : (string)($item['contactId'] ?? $r['id']);
                            $item['name'] = (string)($r['name'] ?? $item['name'] ?? 'Customer');
                            if (isset($r['business_name'])) $item['businessName'] = $r['business_name'] ?? '';
                            if (isset($r['phone'])) $item['phone'] = $r['phone'] ?? '';
                            if (isset($r['email'])) $item['email'] = $r['email'] ?? '';
                            if (isset($r['address'])) $item['address'] = $r['address'] ?? '';
                            if (isset($r['opening_balance'])) $item['openingBalance'] = (float)$r['opening_balance'];
                            if (isset($r['credit_limit'])) $item['creditLimit'] = (float)$r['credit_limit'];
                            if (isset($r['total_due'])) $item['totalDue'] = (float)$r['total_due'];
                            if (isset($r['total_sales'])) $item['totalSales'] = (float)$r['total_sales'];
                            if (isset($r['loyalty_points'])) $item['loyaltyPoints'] = (int)$r['loyalty_points'];
                            if (isset($r['created_date'])) $item['createdDate'] = $r['created_date'] ?? date('Y-m-d');
                        } elseif ($key === 'products') {
                            $item['id'] = (string)($r['id'] ?? $item['id'] ?? '');
                            if (isset($r['sku'])) $item['sku'] = $r['sku'] ?? '';
                            if (isset($r['name'])) $item['name'] = $r['name'] ?? '';
                            if (isset($r['barcode'])) $item['barcode'] = $r['barcode'] ?? '';
                            if (isset($r['brand'])) $item['brand'] = $r['brand'] ?? '';
                            if (isset($r['category'])) $item['category'] = $r['category'] ?? '';
                            if (isset($r['unit'])) $item['unit'] = $r['unit'] ?? 'Pc';
                            if (isset($r['cost_price'])) $item['costPrice'] = (float)$r['cost_price'];
                            if (isset($r['selling_price'])) $item['sellingPrice'] = (float)$r['selling_price'];
                            if (isset($r['current_stock'])) $item['currentStock'] = (float)$r['current_stock'];
                            if (isset($r['alert_quantity'])) $item['alertQuantity'] = (float)$r['alert_quantity'];
                        } elseif ($key === 'suppliers') {
                            $item['id'] = (string)($r['id'] ?? $item['id'] ?? '');
                            $item['contactId'] = !empty($r['contact_id']) ? (string)$r['contact_id'] : (string)($item['contactId'] ?? $r['id']);
                            if (isset($r['name'])) $item['name'] = $r['name'] ?? '';
                            if (isset($r['business_name'])) $item['businessName'] = $r['business_name'] ?? '';
                            if (isset($r['phone'])) $item['phone'] = $r['phone'] ?? '';
                            if (isset($r['email'])) $item['email'] = $r['email'] ?? '';
                            if (isset($r['total_payable'])) $item['totalPayable'] = (float)$r['total_payable'];
                            if (isset($r['total_purchases'])) $item['totalPurchases'] = (float)$r['total_purchases'];
                        } elseif ($key === 'transactions') {
                            $item['id'] = (string)($r['id'] ?? $item['id'] ?? '');
                            if (isset($r['type'])) $item['type'] = $r['type'];
                            if (isset($r['sale_channel'])) $item['saleChannel'] = $r['sale_channel'];
                            if (isset($r['invoice_no'])) $item['invoiceNo'] = $r['invoice_no'];
                            if (isset($r['date'])) $item['date'] = $r['date'];
                            if (isset($r['customer_id'])) $item['customerId'] = $r['customer_id'];
                            if (isset($r['customer_name'])) $item['customerName'] = $r['customer_name'];
                            if (isset($r['supplier_id'])) $item['supplierId'] = $r['supplier_id'];
                            if (isset($r['supplier_name'])) $item['supplierName'] = $r['supplier_name'];
                            if (isset($r['total_amount'])) $item['totalAmount'] = (float)$r['total_amount'];
                            if (isset($r['paid_amount'])) $item['paidAmount'] = (float)$r['paid_amount'];
                            if (isset($r['due_amount'])) $item['dueAmount'] = (float)$r['due_amount'];
                            if (isset($r['status'])) $item['status'] = $r['status'];
                            if (isset($r['payment_status'])) $item['paymentStatus'] = $r['payment_status'];
                        } elseif ($key === 'users') {
                            $item['id'] = (string)($r['id'] ?? $item['id'] ?? '');
                            if (isset($r['name'])) $item['name'] = $r['name'];
                            if (isset($r['username'])) $item['username'] = $r['username'];
                            if (isset($r['email'])) $item['email'] = $r['email'];
                            if (isset($r['role'])) $item['role'] = $r['role'];
                            if (isset($r['status'])) $item['status'] = $r['status'];
                        } else {
                            if (empty($item)) {
                                $item = $r;
                            }
                        }

                        if (!empty($item['id'])) {
                            $items[] = $item;
                        }
                    }
                    if (count($items) > 0) {
                        // Clean up demo users if real users exist
                        if ($key === 'users') {
                            $hasRealUsers = false;
                            foreach ($items as $uItem) {
                                $uId = $uItem['id'] ?? '';
                                $uEmail = strtolower($uItem['email'] ?? '');
                                if (!in_array($uId, ['usr_admin', 'usr_cashier', 'usr_inventory', 'usr_finance']) && !str_ends_with($uEmail, '@royalpos.com')) {
                                    $hasRealUsers = true;
                                    break;
                                }
                            }
                            if ($hasRealUsers) {
                                try {
                                    $pdo->exec("DELETE FROM `{$tableName}` WHERE `id` IN ('usr_admin', 'usr_cashier', 'usr_inventory', 'usr_finance') OR `email` LIKE '%@royalpos.com'");
                                } catch (Exception $e) {}

                                $items = array_values(array_filter($items, function($uItem) {
                                    $uId = $uItem['id'] ?? '';
                                    $uEmail = strtolower($uItem['email'] ?? '');
                                    return !in_array($uId, ['usr_admin', 'usr_cashier', 'usr_inventory', 'usr_finance']) && !str_ends_with($uEmail, '@royalpos.com');
                                }));
                            }
                        }

                        // Clean up demo customers if real customers exist
                        if ($key === 'customers') {
                            $hasRealCust = false;
                            foreach ($items as $cItem) {
                                $cId = $cItem['id'] ?? '';
                                if (!in_array($cId, ['cust_walkin', 'cust_prime', 'cust_vip', 'cust_global'])) {
                                    $hasRealCust = true;
                                    break;
                                }
                            }
                            if ($hasRealCust) {
                                try {
                                    $pdo->exec("DELETE FROM `{$tableName}` WHERE `id` IN ('cust_walkin', 'cust_prime', 'cust_vip', 'cust_global')");
                                } catch (Exception $e) {}

                                $items = array_values(array_filter($items, function($cItem) {
                                    $cId = $cItem['id'] ?? '';
                                    return !in_array($cId, ['cust_walkin', 'cust_prime', 'cust_vip', 'cust_global']);
                                }));
                            }
                        }

                        $data[$key] = $items;
                    }
                }
            } catch (Exception $e) {}
        }

        $pdo = null;

        echo json_encode([
            'success' => true,
            'isConfigured' => true,
            'data' => $data,
            'lastUpdated' => $latestTimestamp,
        ]);
    } catch (Exception $e) {
        $pdo = null;
        echo json_encode([
            'success' => false,
            'message' => 'Pull failed: ' . $e->getMessage(),
        ]);
    }
    exit;
}

// 4. Action: PUSH
if ($action === 'push' || $method === 'POST') {
    try {
        $pdo = getPdoConnection($dbConfig);
        $prefix = preg_replace('/[^a-zA-Z0-9_]/', '', $dbConfig['dbPrefix'] ?? 'pos_');
        
        $tableMarker = __DIR__ . '/.tables_created';
        if (!file_exists($tableMarker)) {
            ensureAllSchemaTables($pdo, $prefix);
            @touch($tableMarker);
        }

        $updates = $input['updates'] ?? $input;
        if (!is_array($updates) || empty($updates)) {
            $pdo = null;
            echo json_encode(['success' => true, 'updated' => 0]);
            exit;
        }

        // A. Update key-value store
        $storeStmt = $pdo->prepare("INSERT INTO `{$prefix}sync_store` (`store_key`, `store_value`, `updated_at`)
            VALUES (:k, :v, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE `store_value` = VALUES(`store_value`), `updated_at` = CURRENT_TIMESTAMP");

        $count = 0;
        foreach ($updates as $key => $val) {
            $jsonVal = is_string($val) ? $val : json_encode($val);
            $storeStmt->execute([':k' => $key, ':v' => $jsonVal]);
            $count++;
        }

        // B. Populate structured relational MySQL tables
        if (isset($updates['customers']) && is_array($updates['customers'])) {
            $hasRealCust = false;
            foreach ($updates['customers'] as $c) {
                if (!in_array($c['id'] ?? '', ['cust_walkin', 'cust_prime', 'cust_vip', 'cust_global'])) {
                    $hasRealCust = true;
                    break;
                }
            }
            if ($hasRealCust) {
                try {
                    $pdo->exec("DELETE FROM `{$prefix}customers` WHERE `id` IN ('cust_walkin', 'cust_prime', 'cust_vip', 'cust_global')");
                } catch (Exception $e) {}
            }

            $custStmt = $pdo->prepare("INSERT INTO `{$prefix}customers` 
                (`id`, `contact_id`, `name`, `business_name`, `phone`, `email`, `address`, `opening_balance`, `credit_limit`, `total_due`, `total_sales`, `loyalty_points`, `created_date`, `data_json`, `updated_at`)
                VALUES (:id, :cid, :name, :bname, :phone, :email, :addr, :opbal, :clim, :tdue, :tsales, :lpts, :cdate, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `contact_id` = VALUES(`contact_id`), `name` = VALUES(`name`), `business_name` = VALUES(`business_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`), `address` = VALUES(`address`), `total_due` = VALUES(`total_due`), `total_sales` = VALUES(`total_sales`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['customers'] as $c) {
                if (!is_array($c) || empty($c['id'])) continue;
                if ($hasRealCust && in_array($c['id'], ['cust_walkin', 'cust_prime', 'cust_vip', 'cust_global'])) continue;
                $custStmt->execute([
                    ':id' => (string)$c['id'],
                    ':cid' => $c['contactId'] ?? null,
                    ':name' => $c['name'] ?? 'Unnamed',
                    ':bname' => $c['businessName'] ?? null,
                    ':phone' => $c['phone'] ?? null,
                    ':email' => $c['email'] ?? null,
                    ':addr' => $c['address'] ?? null,
                    ':opbal' => (float)($c['openingBalance'] ?? 0),
                    ':clim' => (float)($c['creditLimit'] ?? 0),
                    ':tdue' => (float)($c['totalDue'] ?? 0),
                    ':tsales' => (float)($c['totalSales'] ?? 0),
                    ':lpts' => (int)($c['loyaltyPoints'] ?? 0),
                    ':cdate' => $c['createdDate'] ?? date('Y-m-d'),
                    ':json' => json_encode($c),
                ]);
            }
        }

        if (isset($updates['products']) && is_array($updates['products'])) {
            $prodStmt = $pdo->prepare("INSERT INTO `{$prefix}products` 
                (`id`, `sku`, `name`, `barcode`, `brand`, `category`, `unit`, `cost_price`, `selling_price`, `current_stock`, `alert_quantity`, `data_json`, `updated_at`)
                VALUES (:id, :sku, :name, :barcode, :brand, :category, :unit, :cprice, :sprice, :stock, :alert, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `sku` = VALUES(`sku`), `name` = VALUES(`name`), `barcode` = VALUES(`barcode`), `brand` = VALUES(`brand`), `category` = VALUES(`category`), `cost_price` = VALUES(`cost_price`), `selling_price` = VALUES(`selling_price`), `current_stock` = VALUES(`current_stock`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['products'] as $p) {
                if (!is_array($p) || empty($p['id'])) continue;
                $prodStmt->execute([
                    ':id' => (string)$p['id'],
                    ':sku' => $p['sku'] ?? null,
                    ':name' => $p['name'] ?? 'Unnamed Product',
                    ':barcode' => $p['barcode'] ?? null,
                    ':brand' => $p['brand'] ?? null,
                    ':category' => $p['category'] ?? null,
                    ':unit' => $p['unit'] ?? null,
                    ':cprice' => (float)($p['costPrice'] ?? 0),
                    ':sprice' => (float)($p['sellingPrice'] ?? 0),
                    ':stock' => (float)($p['currentStock'] ?? 0),
                    ':alert' => (float)($p['alertQuantity'] ?? 0),
                    ':json' => json_encode($p),
                ]);
            }
        }

        if (isset($updates['suppliers']) && is_array($updates['suppliers'])) {
            $supStmt = $pdo->prepare("INSERT INTO `{$prefix}suppliers` 
                (`id`, `contact_id`, `name`, `business_name`, `phone`, `email`, `total_payable`, `total_purchases`, `data_json`, `updated_at`)
                VALUES (:id, :cid, :name, :bname, :phone, :email, :tpay, :tpurch, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `contact_id` = VALUES(`contact_id`), `name` = VALUES(`name`), `business_name` = VALUES(`business_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`), `total_payable` = VALUES(`total_payable`), `total_purchases` = VALUES(`total_purchases`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['suppliers'] as $s) {
                if (!is_array($s) || empty($s['id'])) continue;
                $supStmt->execute([
                    ':id' => (string)$s['id'],
                    ':cid' => $s['contactId'] ?? null,
                    ':name' => $s['name'] ?? 'Unnamed Supplier',
                    ':bname' => $s['businessName'] ?? null,
                    ':phone' => $s['phone'] ?? null,
                    ':email' => $s['email'] ?? null,
                    ':tpay' => (float)($s['totalPayable'] ?? 0),
                    ':tpurch' => (float)($s['totalPurchases'] ?? 0),
                    ':json' => json_encode($s),
                ]);
            }
        }

        if (isset($updates['transactions']) && is_array($updates['transactions'])) {
            $txnStmt = $pdo->prepare("INSERT INTO `{$prefix}transactions` 
                (`id`, `type`, `sale_channel`, `invoice_no`, `date`, `customer_id`, `customer_name`, `supplier_id`, `supplier_name`, `total_amount`, `paid_amount`, `due_amount`, `status`, `payment_status`, `data_json`, `updated_at`)
                VALUES (:id, :type, :sch, :inv, :date, :cid, :cname, :sid, :sname, :tot, :paid, :due, :st, :pst, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `type` = VALUES(`type`), `sale_channel` = VALUES(`sale_channel`), `invoice_no` = VALUES(`invoice_no`), `total_amount` = VALUES(`total_amount`), `paid_amount` = VALUES(`paid_amount`), `due_amount` = VALUES(`due_amount`), `status` = VALUES(`status`), `payment_status` = VALUES(`payment_status`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['transactions'] as $t) {
                if (!is_array($t) || empty($t['id'])) continue;
                $isPos = !empty($t['isPos']) || ($t['saleChannel'] ?? '') === 'pos' || (isset($t['invoiceNo']) && stripos($t['invoiceNo'], 'POS') === 0);
                $sch = $t['saleChannel'] ?? ($isPos ? 'pos' : 'standard');
                $txnStmt->execute([
                    ':id' => (string)$t['id'],
                    ':type' => $t['type'] ?? 'sale',
                    ':sch' => $sch,
                    ':inv' => $t['invoiceNo'] ?? null,
                    ':date' => $t['date'] ?? date('Y-m-d'),
                    ':cid' => $t['customerId'] ?? null,
                    ':cname' => $t['customerName'] ?? null,
                    ':sid' => $t['supplierId'] ?? null,
                    ':sname' => $t['supplierName'] ?? null,
                    ':tot' => (float)($t['totalAmount'] ?? 0),
                    ':paid' => (float)($t['paidAmount'] ?? 0),
                    ':due' => (float)($t['dueAmount'] ?? 0),
                    ':st' => $t['status'] ?? 'final',
                    ':pst' => $t['paymentStatus'] ?? 'paid',
                    ':json' => json_encode($t),
                ]);
            }
        }

        if (isset($updates['users']) && is_array($updates['users'])) {
            $hasRealUsers = false;
            foreach ($updates['users'] as $u) {
                $uId = $u['id'] ?? '';
                $uEmail = strtolower($u['email'] ?? '');
                if (!in_array($uId, ['usr_admin', 'usr_cashier', 'usr_inventory', 'usr_finance']) && !str_ends_with($uEmail, '@royalpos.com')) {
                    $hasRealUsers = true;
                    break;
                }
            }
            if ($hasRealUsers) {
                try {
                    $pdo->exec("DELETE FROM `{$prefix}users` WHERE `id` IN ('usr_admin', 'usr_cashier', 'usr_inventory', 'usr_finance') OR `email` LIKE '%@royalpos.com'");
                } catch (Exception $e) {}
            }

            $usrStmt = $pdo->prepare("INSERT INTO `{$prefix}users` 
                (`id`, `name`, `username`, `email`, `role`, `status`, `data_json`, `updated_at`)
                VALUES (:id, :name, :uname, :email, :role, :st, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `name` = VALUES(`name`), `username` = VALUES(`username`), `email` = VALUES(`email`), `role` = VALUES(`role`), `status` = VALUES(`status`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['users'] as $u) {
                if (!is_array($u) || empty($u['id'])) continue;
                $uId = $u['id'] ?? '';
                $uEmail = strtolower($u['email'] ?? '');
                if ($hasRealUsers && (in_array($uId, ['usr_admin', 'usr_cashier', 'usr_inventory', 'usr_finance']) || str_ends_with($uEmail, '@royalpos.com'))) {
                    continue;
                }
                $usrStmt->execute([
                    ':id' => (string)$u['id'],
                    ':name' => $u['name'] ?? 'User',
                    ':uname' => $u['username'] ?? null,
                    ':email' => $u['email'] ?? null,
                    ':role' => $u['role'] ?? 'staff',
                    ':st' => $u['status'] ?? 'active',
                    ':json' => json_encode($u),
                ]);
            }
        }

        if (isset($updates['sales_commission_agents']) && is_array($updates['sales_commission_agents'])) {
            $agentStmt = $pdo->prepare("INSERT INTO `{$prefix}sales_commission_agents` 
                (`id`, `name`, `email`, `phone`, `address`, `commission_percentage`, `data_json`, `updated_at`)
                VALUES (:id, :name, :email, :phone, :addr, :pct, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `name` = VALUES(`name`), `email` = VALUES(`email`), `phone` = VALUES(`phone`), `address` = VALUES(`address`), `commission_percentage` = VALUES(`commission_percentage`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['sales_commission_agents'] as $a) {
                if (!is_array($a) || empty($a['id'])) continue;
                $agentStmt->execute([
                    ':id' => (string)$a['id'],
                    ':name' => $a['name'] ?? 'Sales Agent',
                    ':email' => $a['email'] ?? null,
                    ':phone' => $a['phone'] ?? null,
                    ':addr' => $a['address'] ?? null,
                    ':pct' => (float)($a['commissionPercentage'] ?? 0),
                    ':json' => json_encode($a),
                ]);
            }
        }

        if (isset($updates['customer_groups']) && is_array($updates['customer_groups'])) {
            $cgStmt = $pdo->prepare("INSERT INTO `{$prefix}customer_groups` 
                (`id`, `name`, `amount`, `percentage`, `data_json`, `updated_at`)
                VALUES (:id, :name, :amt, :pct, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `name` = VALUES(`name`), `amount` = VALUES(`amount`), `percentage` = VALUES(`percentage`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['customer_groups'] as $cg) {
                if (!is_array($cg) || empty($cg['id'])) continue;
                $cgStmt->execute([
                    ':id' => (string)$cg['id'],
                    ':name' => $cg['name'] ?? 'Group',
                    ':amt' => (float)($cg['amount'] ?? 0),
                    ':pct' => (float)($cg['percentage'] ?? 0),
                    ':json' => json_encode($cg),
                ]);
            }
        }

        if (isset($updates['warranties']) && is_array($updates['warranties'])) {
            $wStmt = $pdo->prepare("INSERT INTO `{$prefix}warranties` 
                (`id`, `name`, `duration`, `duration_type`, `description`, `data_json`, `updated_at`)
                VALUES (:id, :name, :dur, :dtype, :desc, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `name` = VALUES(`name`), `duration` = VALUES(`duration`), `duration_type` = VALUES(`duration_type`), `description` = VALUES(`description`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['warranties'] as $w) {
                if (!is_array($w) || empty($w['id'])) continue;
                $wStmt->execute([
                    ':id' => (string)$w['id'],
                    ':name' => $w['name'] ?? 'Warranty',
                    ':dur' => (int)($w['duration'] ?? 0),
                    ':dtype' => $w['durationType'] ?? 'months',
                    ':desc' => $w['description'] ?? null,
                    ':json' => json_encode($w),
                ]);
            }
        }

        if (isset($updates['racks']) && is_array($updates['racks'])) {
            $rStmt = $pdo->prepare("INSERT INTO `{$prefix}racks` 
                (`id`, `name`, `location_id`, `row`, `position`, `description`, `data_json`, `updated_at`)
                VALUES (:id, :name, :lid, :row, :pos, :desc, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `name` = VALUES(`name`), `location_id` = VALUES(`location_id`), `row` = VALUES(`row`), `position` = VALUES(`position`), `description` = VALUES(`description`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['racks'] as $r) {
                if (!is_array($r) || empty($r['id'])) continue;
                $rStmt->execute([
                    ':id' => (string)$r['id'],
                    ':name' => $r['name'] ?? 'Rack',
                    ':lid' => $r['locationId'] ?? null,
                    ':row' => $r['row'] ?? null,
                    ':pos' => $r['position'] ?? null,
                    ':desc' => $r['description'] ?? null,
                    ':json' => json_encode($r),
                ]);
            }
        }

        if (isset($updates['tax_rates']) && is_array($updates['tax_rates'])) {
            $trStmt = $pdo->prepare("INSERT INTO `{$prefix}tax_rates` 
                (`id`, `name`, `amount`, `data_json`, `updated_at`)
                VALUES (:id, :name, :amt, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `name` = VALUES(`name`), `amount` = VALUES(`amount`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['tax_rates'] as $tr) {
                if (!is_array($tr) || empty($tr['id'])) continue;
                $trStmt->execute([
                    ':id' => (string)$tr['id'],
                    ':name' => $tr['name'] ?? 'Tax',
                    ':amt' => (float)($tr['amount'] ?? 0),
                    ':json' => json_encode($tr),
                ]);
            }
        }

        if (isset($updates['tax_groups']) && is_array($updates['tax_groups'])) {
            $tgStmt = $pdo->prepare("INSERT INTO `{$prefix}tax_groups` 
                (`id`, `name`, `amount`, `data_json`, `updated_at`)
                VALUES (:id, :name, :amt, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `name` = VALUES(`name`), `amount` = VALUES(`amount`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['tax_groups'] as $tg) {
                if (!is_array($tg) || empty($tg['id'])) continue;
                $tgStmt->execute([
                    ':id' => (string)$tg['id'],
                    ':name' => $tg['name'] ?? 'Tax Group',
                    ':amt' => (float)($tg['amount'] ?? 0),
                    ':json' => json_encode($tg),
                ]);
            }
        }

        if (isset($updates['currencies']) && is_array($updates['currencies'])) {
            $curStmt = $pdo->prepare("INSERT INTO `{$prefix}currencies` 
                (`id`, `country`, `currency`, `code`, `symbol`, `data_json`, `updated_at`)
                VALUES (:id, :country, :curr, :code, :sym, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `country` = VALUES(`country`), `currency` = VALUES(`currency`), `code` = VALUES(`code`), `symbol` = VALUES(`symbol`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['currencies'] as $cur) {
                if (!is_array($cur) || empty($cur['id'])) continue;
                $curStmt->execute([
                    ':id' => (string)$cur['id'],
                    ':country' => $cur['country'] ?? null,
                    ':curr' => $cur['currency'] ?? null,
                    ':code' => $cur['code'] ?? null,
                    ':sym' => $cur['symbol'] ?? null,
                    ':json' => json_encode($cur),
                ]);
            }
        }

        if (isset($updates['accounts']) && is_array($updates['accounts'])) {
            $accStmt = $pdo->prepare("INSERT INTO `{$prefix}accounts` 
                (`id`, `name`, `account_number`, `account_type`, `opening_balance`, `balance`, `data_json`, `updated_at`)
                VALUES (:id, :name, :accnum, :acctype, :opbal, :bal, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `name` = VALUES(`name`), `account_number` = VALUES(`account_number`), `account_type` = VALUES(`account_type`), `opening_balance` = VALUES(`opening_balance`), `balance` = VALUES(`balance`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['accounts'] as $acc) {
                if (!is_array($acc) || empty($acc['id'])) continue;
                $accStmt->execute([
                    ':id' => (string)$acc['id'],
                    ':name' => $acc['name'] ?? 'Account',
                    ':accnum' => $acc['accountNumber'] ?? null,
                    ':acctype' => $acc['accountType'] ?? null,
                    ':opbal' => (float)($acc['openingBalance'] ?? 0),
                    ':bal' => (float)($acc['balance'] ?? 0),
                    ':json' => json_encode($acc),
                ]);
            }
        }

        if (isset($updates['payment_methods']) && is_array($updates['payment_methods'])) {
            $pmStmt = $pdo->prepare("INSERT INTO `{$prefix}payment_methods` 
                (`id`, `name`, `is_default`, `data_json`, `updated_at`)
                VALUES (:id, :name, :isdef, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `name` = VALUES(`name`), `is_default` = VALUES(`is_default`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['payment_methods'] as $pm) {
                if (!is_array($pm) || empty($pm['id'])) continue;
                $pmStmt->execute([
                    ':id' => (string)$pm['id'],
                    ':name' => $pm['name'] ?? 'Method',
                    ':isdef' => !empty($pm['isDefault']) ? 1 : 0,
                    ':json' => json_encode($pm),
                ]);
            }
        }

        if (isset($updates['locations']) && is_array($updates['locations'])) {
            $locStmt = $pdo->prepare("INSERT INTO `{$prefix}locations` 
                (`id`, `name`, `code`, `city`, `state`, `country`, `zip_code`, `mobile`, `email`, `data_json`, `updated_at`)
                VALUES (:id, :name, :code, :city, :state, :country, :zip, :mobile, :email, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `name` = VALUES(`name`), `code` = VALUES(`code`), `city` = VALUES(`city`), `state` = VALUES(`state`), `country` = VALUES(`country`), `zip_code` = VALUES(`zip_code`), `mobile` = VALUES(`mobile`), `email` = VALUES(`email`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['locations'] as $loc) {
                if (!is_array($loc) || empty($loc['id'])) continue;
                $locStmt->execute([
                    ':id' => (string)$loc['id'],
                    ':name' => $loc['name'] ?? 'Branch',
                    ':code' => $loc['code'] ?? null,
                    ':city' => $loc['city'] ?? null,
                    ':state' => $loc['state'] ?? null,
                    ':country' => $loc['country'] ?? null,
                    ':zip' => $loc['zipCode'] ?? null,
                    ':mobile' => $loc['mobile'] ?? null,
                    ':email' => $loc['email'] ?? null,
                    ':json' => json_encode($loc),
                ]);
            }
        }

        if (isset($updates['registers']) && is_array($updates['registers'])) {
            $regStmt = $pdo->prepare("INSERT INTO `{$prefix}registers` 
                (`id`, `status`, `location_id`, `cashier_name`, `opening_cash`, `data_json`, `updated_at`)
                VALUES (:id, :status, :lid, :cname, :opcash, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `status` = VALUES(`status`), `location_id` = VALUES(`location_id`), `cashier_name` = VALUES(`cashier_name`), `opening_cash` = VALUES(`opening_cash`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            $regs = isset($updates['registers'][0]) ? $updates['registers'] : [$updates['registers']];
            foreach ($regs as $reg) {
                if (!is_array($reg) || empty($reg['id'])) continue;
                $regStmt->execute([
                    ':id' => (string)$reg['id'],
                    ':status' => $reg['status'] ?? 'closed',
                    ':lid' => $reg['locationId'] ?? null,
                    ':cname' => $reg['cashierName'] ?? null,
                    ':opcash' => (float)($reg['openingCash'] ?? 0),
                    ':json' => json_encode($reg),
                ]);
            }
        }

        if (isset($updates['variations']) && is_array($updates['variations'])) {
            $varStmt = $pdo->prepare("INSERT INTO `{$prefix}variations` 
                (`id`, `name`, `product_id`, `sub_sku`, `type`, `data_json`, `updated_at`)
                VALUES (:id, :name, :pid, :sku, :type, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `name` = VALUES(`name`), `product_id` = VALUES(`product_id`), `sub_sku` = VALUES(`sub_sku`), `type` = VALUES(`type`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['variations'] as $v) {
                if (!is_array($v) || empty($v['id'])) continue;
                $varStmt->execute([
                    ':id' => (string)$v['id'],
                    ':name' => $v['name'] ?? 'Variation',
                    ':pid' => $v['productId'] ?? null,
                    ':sku' => $v['subSku'] ?? null,
                    ':type' => $v['type'] ?? 'variable',
                    ':json' => json_encode($v),
                ]);
            }
        }

        if (isset($updates['stock_adjustments']) && is_array($updates['stock_adjustments'])) {
            $saStmt = $pdo->prepare("INSERT INTO `{$prefix}stock_adjustments` 
                (`id`, `reference_no`, `location_id`, `total_amount`, `data_json`, `updated_at`)
                VALUES (:id, :ref, :lid, :tot, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `reference_no` = VALUES(`reference_no`), `location_id` = VALUES(`location_id`), `total_amount` = VALUES(`total_amount`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['stock_adjustments'] as $sa) {
                if (!is_array($sa) || empty($sa['id'])) continue;
                $saStmt->execute([
                    ':id' => (string)$sa['id'],
                    ':ref' => $sa['referenceNo'] ?? null,
                    ':lid' => $sa['locationId'] ?? null,
                    ':tot' => (float)($sa['totalAmount'] ?? 0),
                    ':json' => json_encode($sa),
                ]);
            }
        }

        if (isset($updates['stock_transfers']) && is_array($updates['stock_transfers'])) {
            $stStmt = $pdo->prepare("INSERT INTO `{$prefix}stock_transfers` 
                (`id`, `reference_no`, `source_location_id`, `target_location_id`, `status`, `data_json`, `updated_at`)
                VALUES (:id, :ref, :slid, :tlid, :st, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `reference_no` = VALUES(`reference_no`), `source_location_id` = VALUES(`source_location_id`), `target_location_id` = VALUES(`target_location_id`), `status` = VALUES(`status`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['stock_transfers'] as $st) {
                if (!is_array($st) || empty($st['id'])) continue;
                $stStmt->execute([
                    ':id' => (string)$st['id'],
                    ':ref' => $st['referenceNo'] ?? null,
                    ':slid' => $st['sourceLocationId'] ?? null,
                    ':tlid' => $st['targetLocationId'] ?? null,
                    ':st' => $st['status'] ?? 'completed',
                    ':json' => json_encode($st),
                ]);
            }
        }

        if (isset($updates['product_history']) && is_array($updates['product_history'])) {
            $phStmt = $pdo->prepare("INSERT INTO `{$prefix}product_history` 
                (`id`, `product_id`, `action`, `data_json`, `updated_at`)
                VALUES (:id, :pid, :act, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `product_id` = VALUES(`product_id`), `action` = VALUES(`action`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['product_history'] as $ph) {
                if (!is_array($ph) || empty($ph['id'])) continue;
                $phStmt->execute([
                    ':id' => (string)$ph['id'],
                    ':pid' => $ph['productId'] ?? null,
                    ':act' => $ph['action'] ?? null,
                    ':json' => json_encode($ph),
                ]);
            }
        }

        if (isset($updates['purchase_requisitions']) && is_array($updates['purchase_requisitions'])) {
            $prStmt = $pdo->prepare("INSERT INTO `{$prefix}purchase_requisitions` 
                (`id`, `reference_no`, `status`, `location_id`, `data_json`, `updated_at`)
                VALUES (:id, :ref, :st, :lid, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `reference_no` = VALUES(`reference_no`), `status` = VALUES(`status`), `location_id` = VALUES(`location_id`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['purchase_requisitions'] as $pr) {
                if (!is_array($pr) || empty($pr['id'])) continue;
                $prStmt->execute([
                    ':id' => (string)$pr['id'],
                    ':ref' => $pr['referenceNo'] ?? null,
                    ':st' => $pr['status'] ?? 'pending',
                    ':lid' => $pr['locationId'] ?? null,
                    ':json' => json_encode($pr),
                ]);
            }
        }

        if (isset($updates['notification_templates']) && is_array($updates['notification_templates'])) {
            $ntStmt = $pdo->prepare("INSERT INTO `{$prefix}notification_templates` 
                (`id`, `template_type`, `subject`, `data_json`, `updated_at`)
                VALUES (:id, :ttype, :subj, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `template_type` = VALUES(`template_type`), `subject` = VALUES(`subject`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['notification_templates'] as $nt) {
                if (!is_array($nt) || empty($nt['id'])) continue;
                $ntStmt->execute([
                    ':id' => (string)$nt['id'],
                    ':ttype' => $nt['templateType'] ?? null,
                    ':subj' => $nt['subject'] ?? null,
                    ':json' => json_encode($nt),
                ]);
            }
        }

        $pdo = null;

        echo json_encode([
            'success' => true,
            'updated' => $count,
            'timestamp' => date('c'),
        ]);
    } catch (Exception $e) {
        $pdo = null;
        echo json_encode([
            'success' => false,
            'message' => 'Push failed: ' . $e->getMessage(),
        ]);
    }
    exit;
}
