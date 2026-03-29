<?php
/**
 * Яндекс Директ API Integration
 * Backend для работы с API Яндекс Директ
 */

// Must be at the very start
header('Content-Type: application/json; charset=utf-8');

// Error handling
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("PHP Error [$errno]: $errstr in $errfile:$errline");
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
    exit;
});

header('Access-Control-Allow-Origin: *');

// Error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0);

/**
 * Response helper
 */
function sendResponse($success, $data = null, $message = null) {
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'error' => $message
    ]);
    exit;
}

/**
 * Validate token format
 */
function isValidToken($token) {
    return is_string($token) && !empty(trim($token));
}

/**
 * Get campaigns from Yandex Direct API
 */
function getCampaigns($token, $login, $filters) {
    try {
        // For now, return mock data since we need real API authentication
        // In production, this would call real Yandex Direct API
        
        $mockCampaigns = [
            [
                'id' => 1,
                'name' => 'Пример кампания 1',
                'status' => 'ENABLED',
                'impressions' => 1500,
                'clicks' => 45,
                'cost' => 2250.50,
                'ctr' => 3.0
            ],
            [
                'id' => 2,
                'name' => 'Пример кампания 2',
                'status' => 'ENABLED',
                'impressions' => 3200,
                'clicks' => 128,
                'cost' => 3840.75,
                'ctr' => 4.0
            ],
            [
                'id' => 3,
                'name' => 'Пример кампания 3',
                'status' => 'PAUSED',
                'impressions' => 800,
                'clicks' => 12,
                'cost' => 960.00,
                'ctr' => 1.5
            ]
        ];
        
        $totalImpressions = 0;
        $totalClicks = 0;
        $totalCost = 0;
        
        foreach ($mockCampaigns as $campaign) {
            $totalImpressions += $campaign['impressions'];
            $totalClicks += $campaign['clicks'];
            $totalCost += $campaign['cost'];
        }
        
        $avgCtr = $totalImpressions > 0 
            ? ($totalClicks / $totalImpressions) * 100
            : 0;
        
        return [
            'campaigns' => $mockCampaigns,
            'totalImpressions' => $totalImpressions,
            'totalClicks' => $totalClicks,
            'totalCost' => $totalCost,
            'avgCtr' => round($avgCtr, 2),
            'impressionsChange' => 0,
            'clicksChange' => 0,
            'costChange' => 0,
            'ctrChange' => 0,
            'dateFrom' => date('Y-m-d', strtotime("-{$filters['period']} days")),
            'dateTo' => date('Y-m-d')
        ];
        
    } catch (Exception $e) {
        error_log('Error in getCampaigns: ' . $e->getMessage());
        return sendResponse(false, null, 'Ошибка при получении данных: ' . $e->getMessage());
    }
}

/**
 * Get statistics for a single campaign
 */
function getCampaignStats($statsUrl, $campaignId, $dateFrom, $dateTo, $token, $login) {
    try {
        $request = [
            'method' => 'post',
            'params' => [
                'SelectionCriteria' => [
                    'CampaignIds' => [$campaignId],
                    'DateRangeType' => 'CUSTOM_DATE',
                    'DateRangeCustom' => [
                        'StartDate' => str_replace('-', '', $dateFrom),
                        'EndDate' => str_replace('-', '', $dateTo)
                    ]
                ],
                'FieldNames' => [
                    'CampaignId',
                    'Impressions',
                    'Clicks',
                    'Cost'
                ],
                'OrderBy' => [
                    [
                        'Field' => 'Cost',
                        'SortOrder' => 'ASCENDING'
                    ]
                ],
                'Format' => 'JSON'
            ]
        ];
        
        $response = makeDirectApiRequest($statsUrl, $request, $token, $login);
        
        if ($response && isset($response['result']['ReportData'])) {
            $data = $response['result']['ReportData'];
            
            // Parse the report data (it comes as JSON string)
            if (is_string($data)) {
                $data = json_decode($data, true);
            }
            
            if (is_array($data) && count($data) > 0) {
                return [
                    'impressions' => (int)($data[0]['Impressions'] ?? 0),
                    'clicks' => (int)($data[0]['Clicks'] ?? 0),
                    'cost' => (float)($data[0]['Cost'] ?? 0)
                ];
            }
        }
        
        return null;
        
    } catch (Exception $e) {
        error_log('Error getting campaign stats: ' . $e->getMessage());
        return null;
    }
}

/**
 * Make request to Yandex Direct API
 */
function makeDirectApiRequest($url, $request, $token, $login) {
    $headers = [
        'Authorization: Bearer ' . $token,
        'Client-Login: ' . $login,
        'Accept-Language: ru'
    ];
    
    $payload = json_encode($request, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        error_log('cURL Error: ' . $error);
        return null;
    }
    
    if ($httpCode !== 200) {
        error_log("API Response Code: $httpCode, Body: $response");
        return null;
    }
    
    return json_decode($response, true);
}

/**
 * Validate and get Bearer token
 */
function getBearerToken($clientId, $clientSecret, $code) {
    $tokenUrl = 'https://oauth.yandex.ru/token';
    
    $postData = [
        'grant_type' => 'authorization_code',
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'code' => $code
    ];
    
    $ch = curl_init($tokenUrl);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($postData),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => true
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        return null;
    }
    
    $data = json_decode($response, true);
    return $data['access_token'] ?? null;
}

// =====================================================
// Handle requests
// =====================================================

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    sendResponse(false, null, 'Invalid request');
}

$action = $input['action'] ?? null;
$token = $input['token'] ?? null;
$login = $input['login'] ?? null;

if (!$action) {
    sendResponse(false, null, 'Action not specified');
}

// Main action handler
switch ($action) {
    case 'getCampaigns':
        if (!isValidToken($token) || !$login) {
            sendResponse(false, null, 'Invalid credentials');
        }
        
        $filters = $input['filters'] ?? [
            'period' => 7,
            'dateFrom' => null,
            'dateTo' => null,
            'device' => 'all',
            'campaign' => ''
        ];
        
        $data = getCampaigns($token, $login, $filters);
        sendResponse(true, $data);
        break;
        
    case 'exchangeCode':
        $clientId = $input['clientId'] ?? null;
        $clientSecret = $input['clientSecret'] ?? null;
        $code = $input['code'] ?? null;
        
        if (!$clientId || !$clientSecret || !$code) {
            sendResponse(false, null, 'Missing parameters');
        }
        
        $token = getBearerToken($clientId, $clientSecret, $code);
        if (!$token) {
            sendResponse(false, null, 'Failed to get access token');
        }
        
        sendResponse(true, ['token' => $token]);
        break;
        
    case 'validateToken':
        if (!isValidToken($token) || !$login) {
            sendResponse(false, null, 'Invalid token');
        }
        sendResponse(true, ['valid' => true]);
        break;
        
    default:
        sendResponse(false, null, 'Unknown action');
}
?>
