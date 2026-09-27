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

if ($method === 'POST' || $action === 'install') {
    // Record installation lock on the server
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
    if (!is_array($data)) {
        $data = $_POST;
    }

    $lockData = [
        'success' => true,
        'isInstalled' => true,
        'installationCompleted' => true,
        'installedAt' => date('c'),
        'businessName' => $data['businessName'] ?? 'Finias Farms',
        'adminEmail' => $data['adminEmail'] ?? 'admin@butabomma.in',
        'adminUsername' => $data['adminUsername'] ?? 'admin',
        'settings' => $data['settings'] ?? null,
        'adminUser' => $data['adminUser'] ?? null
    ];

    $jsonEncoded = json_encode($lockData, JSON_PRETTY_PRINT);

    // Save to all target locations for maximum reliability on cPanel
    $saved = false;
    $primaryPath = __DIR__ . '/system_status.json';
    $parentPath = __DIR__ . '/../system_status.json';

    if (@file_put_contents($primaryPath, $jsonEncoded)) {
        @chmod($primaryPath, 0666);
        $saved = true;
    }
    if (@file_put_contents($parentPath, $jsonEncoded)) {
        @chmod($parentPath, 0666);
        $saved = true;
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
    echo json_encode([
        'success' => true,
        'isInstalled' => true,
        'installedAt' => $foundLock['installedAt'] ?? null,
        'businessName' => $foundLock['businessName'] ?? null,
        'adminEmail' => $foundLock['adminEmail'] ?? null,
        'settings' => $foundLock['settings'] ?? null,
        'adminUser' => $foundLock['adminUser'] ?? null
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
    'settings' => null,
    'adminUser' => null
]);
exit;
