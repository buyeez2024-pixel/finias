<?php
// Universal System Status API for cPanel and Apache web hosting
// This ensures that once installation is completed on Desktop,
// it is permanently locked across ALL devices, mobile phones, and incognito browsers.

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight CORS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$possiblePaths = [
    __DIR__ . '/system_status.json',
    __DIR__ . '/../system_status.json',
    __DIR__ . '/../../server_storage/system_status.json',
    __DIR__ . '/../server_storage/system_status.json'
];

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? ($method === 'POST' ? 'install' : 'status');

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);
if (!is_array($data)) {
    $data = $_POST;
}

// Handle Reset / Unlock for fresh installation
if ($action === 'reset' || (isset($data['action']) && $data['action'] === 'reset')) {
    foreach ($possiblePaths as $path) {
        if (file_exists($path)) {
            @unlink($path);
        }
    }
    $dbConfig = __DIR__ . '/db_config.json';
    if (file_exists($dbConfig)) {
        @unlink($dbConfig);
    }
    echo json_encode([
        'success' => true,
        'isInstalled' => false,
        'message' => 'System installation lock removed successfully. You can now start a fresh installation.'
    ]);
    exit;
// Handle sync-status or adminUser credential update
if ($action === 'sync-status' || isset($data['adminUser']) || (isset($data['action']) && $data['action'] === 'sync-status')) {
    $existingLock = null;
    foreach ($possiblePaths as $path) {
        if (file_exists($path)) {
            $content = @file_get_contents($path);
            if ($content) {
                $parsed = @json_decode($content, true);
                if (is_array($parsed)) {
                    $existingLock = $parsed;
                    break;
                }
            }
        }
    }
    if (!$existingLock) {
        $existingLock = [
            'success' => true,
            'isInstalled' => true,
            'installationCompleted' => true,
            'installedAt' => date('c'),
            'businessName' => 'Enterprise POS',
        ];
    }
    if (isset($data['adminUser']) && is_array($data['adminUser'])) {
        $currentAdmin = $existingLock['adminUser'] ?? [];
        $existingLock['adminUser'] = array_merge($currentAdmin, $data['adminUser']);
        if (!empty($data['adminUser']['email'])) {
            $existingLock['adminEmail'] = $data['adminUser']['email'];
        }
        if (!empty($data['adminUser']['username'])) {
            $existingLock['adminUsername'] = $data['adminUser']['username'];
        }
    }
    if (!empty($data['businessName'])) {
        $existingLock['businessName'] = $data['businessName'];
    }
    if (!empty($data['settings']) && is_array($data['settings'])) {
        $existingLock['settings'] = array_merge($existingLock['settings'] ?? [], $data['settings']);
    }
    $jsonEncoded = json_encode($existingLock, JSON_PRETTY_PRINT);
    foreach ($possiblePaths as $path) {
        if (file_exists(dirname($path))) {
            @file_put_contents($path, $jsonEncoded);
            @chmod($path, 0666);
        }
    }
    echo json_encode([
        'success' => true,
        'message' => 'Admin credentials updated successfully across server files.',
        'status' => $existingLock
    ]);
    exit;
}

if ($method === 'POST' || $action === 'install') {
    // Record installation lock on the server

    $logo = $data['logo'] ?? $data['logoUrl'] ?? ($data['settings']['logoUrl'] ?? ($data['settings']['logo'] ?? ''));

    $lockData = [
        'success' => true,
        'isInstalled' => true,
        'installationCompleted' => true,
        'installedAt' => date('c'),
        'businessName' => $data['businessName'] ?? ($data['settings']['businessName'] ?? 'Enterprise ERP'),
        'adminEmail' => $data['adminEmail'] ?? ($data['adminUser']['email'] ?? 'admin@example.com'),
        'adminUsername' => $data['adminUsername'] ?? ($data['adminUser']['username'] ?? 'admin'),
        'settings' => $data['settings'] ?? null,
        'adminUser' => $data['adminUser'] ?? null,
        'logoUrl' => $logo ?: null
    ];

    $jsonEncoded = json_encode($lockData, JSON_PRETTY_PRINT);

    // If DB credentials were provided during installation, write db_config.json immediately!
    $dbConfigInput = $data['dbConfig'] ?? (isset($data['dbHost']) ? $data : null);
    if ($dbConfigInput && !empty($dbConfigInput['dbName'])) {
        $safeConfig = [
            'dbEngine' => 'mysql',
            'dbHost' => $dbConfigInput['dbHost'] ?? 'localhost',
            'dbPort' => $dbConfigInput['dbPort'] ?? '3306',
            'dbName' => $dbConfigInput['dbName'] ?? '',
            'dbUser' => $dbConfigInput['dbUser'] ?? '',
            'dbPassword' => $dbConfigInput['dbPassword'] ?? '',
            'dbPrefix' => preg_replace('/[^a-zA-Z0-9_]/', '', $dbConfigInput['dbPrefix'] ?? 'pos_'),
            'configuredAt' => date('c'),
        ];
        $dbConfigJson = json_encode($safeConfig, JSON_PRETTY_PRINT);
        @file_put_contents(__DIR__ . '/db_config.json', $dbConfigJson);
        @chmod(__DIR__ . '/db_config.json', 0666);
    }

    // Save to all target locations for maximum reliability on cPanel and Node
    $saved = false;
    $primaryPath = __DIR__ . '/system_status.json';
    $parentPath = __DIR__ . '/../system_status.json';
    $serverStoragePath = __DIR__ . '/../../server_storage/system_status.json';
    $serverStoragePath2 = __DIR__ . '/../server_storage/system_status.json';

    if (@file_put_contents($primaryPath, $jsonEncoded)) {
        @chmod($primaryPath, 0666);
        $saved = true;
    }
    if (@file_put_contents($parentPath, $jsonEncoded)) {
        @chmod($parentPath, 0666);
        $saved = true;
    }
    if (file_exists(dirname($serverStoragePath))) {
        @file_put_contents($serverStoragePath, $jsonEncoded);
    }
    if (file_exists(dirname($serverStoragePath2))) {
        @file_put_contents($serverStoragePath2, $jsonEncoded);
    }

    echo json_encode([
        'success' => true,
        'isInstalled' => true,
        'message' => 'System installation locked permanently on server across all devices and browsers.',
        'status' => $lockData
    ]);
    exit;
}

// GET status request: Check if system has been installed on this server
$foundLock = null;
foreach ($possiblePaths as $path) {
    if (file_exists($path)) {
        $content = @file_get_contents($path);
        if ($content) {
            $parsed = @json_decode($content, true);
            if (is_array($parsed) && (!empty($parsed['isInstalled']) || !empty($parsed['installationCompleted']))) {
                $foundLock = $parsed;
                break;
            }
        }
    }
}

if ($foundLock) {
    $logo = $foundLock['logoUrl'] ?? ($foundLock['settings']['logoUrl'] ?? ($foundLock['settings']['logo'] ?? null));
    echo json_encode([
        'success' => true,
        'isInstalled' => true,
        'installedAt' => $foundLock['installedAt'] ?? null,
        'businessName' => $foundLock['businessName'] ?? null,
        'adminEmail' => $foundLock['adminEmail'] ?? null,
        'adminUsername' => $foundLock['adminUsername'] ?? ($foundLock['adminUser']['username'] ?? null),
        'settings' => $foundLock['settings'] ?? null,
        'adminUser' => $foundLock['adminUser'] ?? null,
        'logoUrl' => $logo
    ]);
    exit;
}

// If no lock file exists yet, return uninstalled
echo json_encode([
    'success' => true,
    'isInstalled' => false,
    'installedAt' => null,
    'businessName' => null,
    'adminEmail' => null,
    'adminUsername' => null,
    'settings' => null,
    'adminUser' => null
]);
exit;
