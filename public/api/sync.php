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

// 1. Action: Test DB Connection during Installer Step 2
if ($action === 'test_db') {
    try {
        $pdo = getPdoConnection($input);
        echo json_encode([
            'success' => true,
            'message' => 'Connected successfully to MySQL server! Database is ready for tables.',
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

        // Create universal sync store table
        $pdo->exec("CREATE TABLE IF NOT EXISTS `{$prefix}sync_store` (
            `store_key` VARCHAR(191) NOT NULL PRIMARY KEY,
            `store_value` LONGTEXT NOT NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        // Save sanitized config locally
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
            'message' => 'MySQL database credentials saved and sync store initialized.',
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to initialize database: ' . $e->getMessage(),
        ]);
    }
    exit;
}

// Check if database configuration exists for pull/push operations
if (!file_exists($configFile)) {
    echo json_encode([
        'success' => false,
        'isConfigured' => false,
        'message' => 'Database configuration not found. Please complete the installer.',
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

// 3. Action: PULL all synced state (Desktop, Mobile, Tablet loading data)
if ($action === 'pull' || $method === 'GET') {
    try {
        $pdo = getPdoConnection($dbConfig);
        $prefix = preg_replace('/[^a-zA-Z0-9_]/', '', $dbConfig['dbPrefix'] ?? 'pos_');

        $stmt = $pdo->query("SELECT `store_key`, `store_value`, `updated_at` FROM `{$prefix}sync_store`");
        $rows = $stmt->fetchAll();

        $data = [];
        $latestTimestamp = null;
        foreach ($rows as $row) {
            $data[$row['store_key']] = json_decode($row['store_value'], true);
            if (!$latestTimestamp || $row['updated_at'] > $latestTimestamp) {
                $latestTimestamp = $row['updated_at'];
            }
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

// 4. Action: PUSH updates from client (Desktop, Mobile, Tablet committing transactions/inventory)
if ($action === 'push' || $method === 'POST') {
    try {
        $pdo = getPdoConnection($dbConfig);
        $prefix = preg_replace('/[^a-zA-Z0-9_]/', '', $dbConfig['dbPrefix'] ?? 'pos_');
        $updates = $input['updates'] ?? $input;

        if (!is_array($updates) || empty($updates)) {
            echo json_encode(['success' => true, 'updated' => 0]);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO `{$prefix}sync_store` (`store_key`, `store_value`, `updated_at`)
            VALUES (:k, :v, CURRENT_TIMESTAMP)
            ON DUPLICATE KEY UPDATE `store_value` = VALUES(`store_value`), `updated_at` = CURRENT_TIMESTAMP");

        $count = 0;
        foreach ($updates as $key => $val) {
            $jsonVal = is_string($val) ? $val : json_encode($val);
            $stmt->execute([':k' => $key, ':v' => $jsonVal]);
            $count++;
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
