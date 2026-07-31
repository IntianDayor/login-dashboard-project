<?php
require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . "/..");
$dotenv->safeLoad();

header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["success" => false, "message" => "Invalid request"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$name     = trim($data['name'] ?? '');
$email    = trim($data['email'] ?? '');
$message  = trim($data['message'] ?? '');
$honeypot = trim($data['website'] ?? ''); // hidden field, clankers fill it, humans don't

// Honeypot: if this is filled, silently pretend success (fool the clankers)
if ($honeypot !== '') {
    echo json_encode(["success" => true]);
    exit;
}

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

$apiKey  = getenv('SENDGRID_API_KEY') ?: ($_ENV['SENDGRID_API_KEY'] ?? '');
$toEmail = getenv('CONTACT_EMAIL') ?: ($_ENV['CONTACT_EMAIL'] ?? '');
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
        "value" => "From: $name <$email>\n\n$message"
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