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
        $pdo = getPdoConnection($input);
        $prefix = preg_replace('/[^a-zA-Z0-9_]/', '', $input['dbPrefix'] ?? 'pos_');

        ensureAllSchemaTables($pdo, $prefix);

        // Save config locally
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

        echo json_encode([
            'success' => true,
            'message' => 'MySQL database credentials saved and tables initialized in phpMyAdmin.',
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to initialize database: ' . $e->getMessage(),
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

// 3. Action: PULL
if ($action === 'pull' || $method === 'GET') {
    try {
        $pdo = getPdoConnection($dbConfig);
        $prefix = preg_replace('/[^a-zA-Z0-9_]/', '', $dbConfig['dbPrefix'] ?? 'pos_');
        ensureAllSchemaTables($pdo, $prefix);

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
        ];

        foreach ($entityTables as $key => $tableName) {
            try {
                $tStmt = $pdo->query("SELECT `data_json` FROM `{$tableName}` WHERE `data_json` IS NOT NULL");
                $tRows = $tStmt->fetchAll();
                if ($tRows && count($tRows) > 0) {
                    $items = [];
                    foreach ($tRows as $tr) {
                        $decoded = json_decode($tr['data_json'], true);
                        if ($decoded) $items[] = $decoded;
                    }
                    if (count($items) > 0) {
                        $data[$key] = $items;
                    }
                }
            } catch (Exception $e) {}
        }

        echo json_encode([
            'success' => true,
            'isConfigured' => true,
            'data' => $data,
            'lastUpdated' => $latestTimestamp,
        ]);
    } catch (Exception $e) {
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
        ensureAllSchemaTables($pdo, $prefix);

        $updates = $input['updates'] ?? $input;
        if (!is_array($updates) || empty($updates)) {
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
            $custStmt = $pdo->prepare("INSERT INTO `{$prefix}customers` 
                (`id`, `contact_id`, `name`, `business_name`, `phone`, `email`, `address`, `opening_balance`, `credit_limit`, `total_due`, `total_sales`, `loyalty_points`, `created_date`, `data_json`, `updated_at`)
                VALUES (:id, :cid, :name, :bname, :phone, :email, :addr, :opbal, :clim, :tdue, :tsales, :lpts, :cdate, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `contact_id` = VALUES(`contact_id`), `name` = VALUES(`name`), `business_name` = VALUES(`business_name`), `phone` = VALUES(`phone`), `email` = VALUES(`email`), `address` = VALUES(`address`), `total_due` = VALUES(`total_due`), `total_sales` = VALUES(`total_sales`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['customers'] as $c) {
                if (!is_array($c) || empty($c['id'])) continue;
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
                (`id`, `type`, `invoice_no`, `date`, `customer_id`, `customer_name`, `supplier_id`, `supplier_name`, `total_amount`, `paid_amount`, `due_amount`, `status`, `payment_status`, `data_json`, `updated_at`)
                VALUES (:id, :type, :inv, :date, :cid, :cname, :sid, :sname, :tot, :paid, :due, :st, :pst, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `type` = VALUES(`type`), `invoice_no` = VALUES(`invoice_no`), `total_amount` = VALUES(`total_amount`), `paid_amount` = VALUES(`paid_amount`), `due_amount` = VALUES(`due_amount`), `status` = VALUES(`status`), `payment_status` = VALUES(`payment_status`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['transactions'] as $t) {
                if (!is_array($t) || empty($t['id'])) continue;
                $txnStmt->execute([
                    ':id' => (string)$t['id'],
                    ':type' => $t['type'] ?? 'sale',
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
            $usrStmt = $pdo->prepare("INSERT INTO `{$prefix}users` 
                (`id`, `name`, `username`, `email`, `role`, `status`, `data_json`, `updated_at`)
                VALUES (:id, :name, :uname, :email, :role, :st, :json, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                `name` = VALUES(`name`), `username` = VALUES(`username`), `email` = VALUES(`email`), `role` = VALUES(`role`), `status` = VALUES(`status`), `data_json` = VALUES(`data_json`), `updated_at` = CURRENT_TIMESTAMP");

            foreach ($updates['users'] as $u) {
                if (!is_array($u) || empty($u['id'])) continue;
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

        echo json_encode([
            'success' => true,
            'updated' => $count,
            'timestamp' => date('c'),
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Push failed: ' . $e->getMessage(),
        ]);
    }
    exit;
}
