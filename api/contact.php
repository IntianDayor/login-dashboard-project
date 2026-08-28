<?php
require_once __DIR__ . '/db.php';

header("Content-Type: application/json");

const MAX_CONTACT_ATTEMPTS = 3;
const CONTACT_LOCK_MINUTES = 60;

function getClientIp(): string {
    $headers = [
        'HTTP_CF_CONNECTING_IP', // Cloudflare
        'HTTP_X_FORWARDED_FOR', // Proxy / Load Balancer
        'HTTP_X_REAL_IP',        // Nginx / Apache reverse proxy
        'HTTP_CLIENT_IP',        // Shared internet
        'REMOTE_ADDR'            // Direct connection
    ];

    foreach ($headers as $header) {
        if (!empty($_SERVER[$header])) {
            $ips = explode(',', $_SERVER[$header]);
            foreach ($ips as $ip) {
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
            $first = trim($ips[0]);
            if (filter_var($first, FILTER_VALIDATE_IP)) {
                return $first;
            }
        }
    }

    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

function rejectIfContactLocked(mysqli $conn, string $ip): void {
    $stmt = $conn->prepare("
        SELECT locked_until
        FROM contact_attempts
        WHERE ip_address = ? AND locked_until > NOW()
        LIMIT 1
    ");
    $stmt->bind_param("s", $ip);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        return;
    }

    $wait = max(1, ceil((strtotime($row['locked_until']) - time()) / 60));
    echo json_encode(["success" => false, "message" => "Too many messages sent. Try again in {$wait} minute(s)."]);
    exit;
}

function recordContactAttempt(mysqli $conn, string $ip): void {
    $lockMinutes = CONTACT_LOCK_MINUTES;
    $maxAttempts = MAX_CONTACT_ATTEMPTS;

    $stmt = $conn->prepare("
        INSERT INTO contact_attempts (ip_address, attempts, locked_until, last_attempt)
        VALUES (?, 1, NULL, NOW())
        ON DUPLICATE KEY UPDATE
            attempts = CASE
                WHEN locked_until IS NOT NULL AND locked_until <= NOW() THEN 1
                WHEN last_attempt < DATE_SUB(NOW(), INTERVAL {$lockMinutes} MINUTE) THEN 1
                ELSE attempts + 1
            END,
            locked_until = CASE
                WHEN locked_until IS NOT NULL AND locked_until <= NOW() THEN NULL
                WHEN last_attempt < DATE_SUB(NOW(), INTERVAL {$lockMinutes} MINUTE) THEN NULL
                WHEN attempts + 1 >= {$maxAttempts} THEN DATE_ADD(NOW(), INTERVAL {$lockMinutes} MINUTE)
                ELSE locked_until
            END,
            last_attempt = NOW()
    ");
    $stmt->bind_param("s", $ip);
    $stmt->execute();
    $stmt->close();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request"]);
    exit;
}

$clientIp = getClientIp();
rejectIfContactLocked($conn, $clientIp);

$data = json_decode(file_get_contents("php://input"), true);

$name     = trim($data['name'] ?? '');
$email    = trim($data['email'] ?? '');
$message  = trim($data['message'] ?? '');
$honeypot = trim($data['website'] ?? ''); // hidden field, clankers fill it, humans don't
$loadedAt = intval($data['loaded_at'] ?? 0); // JS timestamp (ms) set when the form loaded

// Honeypot: if this is filled, silently pretend success (clankers be fooled)
if ($honeypot !== '') {
    echo json_encode(["success" => true]);
    exit;
}

// Timing trap: reject submissions faster than a human could realistically fill the form
$elapsedMs = (microtime(true) * 1000) - $loadedAt;
if ($loadedAt > 0 && $elapsedMs < 2000) {
    echo json_encode(["success" => true]); // pretend success, fool clankers
    exit;
}

recordContactAttempt($conn, $clientIp);

if (empty($name) || empty($email) || empty($message)) {
    echo json_encode(["success" => false, "message" => "All fields are required"]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Invalid email address"]);
    exit;
}

if (strlen($message) > 5000) {
    echo json_encode(["success" => false, "message" => "Message too long"]);
    exit;
}

$apiKey    = getenv('SENDGRID_API_KEY') ?: ($_ENV['SENDGRID_API_KEY'] ?? '');
$toEmail   = getenv('CONTACT_EMAIL') ?: ($_ENV['CONTACT_EMAIL'] ?? '');
$fromEmail = getenv('SENDGRID_FROM_EMAIL') ?: ($_ENV['SENDGRID_FROM_EMAIL'] ?? '');

$payload = json_encode([
    "personalizations" => [[
        "to" => [["email" => $toEmail]]
    ]],
    "from"      => ["email" => $fromEmail, "name" => "Portfolio Contact"],
    "reply_to"  => ["email" => $email, "name" => $name],
    "subject"   => "New portfolio message from " . $name,
    "content"   => [[
        "type"  => "text/plain",
        "value" => "PORTFOLIO CONTACT\n"
            . "=================\n\n"
            . "Name: $name\n"
            . "Email: $email\n\n"
            . "Message:\n"
            . "$message\n\n"
            . "-----------------\n"
            . "Reply directly to this email to respond to $name."
    ]]
]);

$ch = curl_init("https://api.sendgrid.com/v3/mail/send");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer $apiKey",
        "Content-Type: application/json",
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// SendGrid returns 202 on a successful send, not 200
if ($httpCode === 202) {
    echo json_encode(["success" => true, "message" => "Message sent!"]);
} else {
    error_log("SendGrid API error ($httpCode): $response");
    echo json_encode(["success" => false, "message" => "Failed to send message. Please try again later."]);
}
?>