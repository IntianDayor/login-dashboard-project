<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/portfolio-data.php';
require_once __DIR__ . '/../vendor/autoload.php';

use Dompdf\Dompdf;
use Dompdf\Options;

/**
 * Public, unauthenticated portfolio PDF export.
 * Because it's public, it's rate-limited per IP.
 */

const MAX_PDF_ATTEMPTS = 20;
const PDF_LOCK_MINUTES = 60;

function getClientIp(): string {
    $headers = [
        'HTTP_CF_CONNECTING_IP', // Cloudflare
        'HTTP_X_FORWARDED_FOR',  // Proxy / Load Balancer
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

function rejectIfPdfLocked(mysqli $conn, string $ip): void {
    $stmt = $conn->prepare("
        SELECT locked_until
        FROM pdf_attempts
        WHERE ip_address = ? AND locked_until > NOW()
        LIMIT 1
    ");
    if (!$stmt) {
        error_log('PDF rate-limit lookup failed: ' . $conn->error);
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(["success" => false, "message" => "PDF export is temporarily unavailable."]);
        exit;
    }
    $stmt->bind_param("s", $ip);
    if (!$stmt->execute()) {
        error_log('PDF rate-limit lookup failed: ' . $stmt->error);
        $stmt->close();
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(["success" => false, "message" => "PDF export is temporarily unavailable."]);
        exit;
    }
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) {
        return;
    }

    $wait = max(1, ceil((strtotime($row['locked_until']) - time()) / 60));
    http_response_code(429);
    header('Content-Type: application/json');
    echo json_encode(["success" => false, "message" => "Too many PDF downloads. Try again in {$wait} minute(s)."]);
    exit;
}

function recordPdfAttempt(mysqli $conn, string $ip): void {
    $lockMinutes = PDF_LOCK_MINUTES;
    $maxAttempts = MAX_PDF_ATTEMPTS;

    $stmt = $conn->prepare("
        INSERT INTO pdf_attempts (ip_address, attempts, locked_until, last_attempt)
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
    if (!$stmt) {
        error_log('PDF rate-limit record failed: ' . $conn->error);
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(["success" => false, "message" => "PDF export is temporarily unavailable."]);
        exit;
    }
    $stmt->bind_param("s", $ip);
    if (!$stmt->execute()) {
        error_log('PDF rate-limit record failed: ' . $stmt->error);
        $stmt->close();
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(["success" => false, "message" => "PDF export is temporarily unavailable."]);
        exit;
    }
    $stmt->close();
}

/** Dompdf can't render animated GIFs; convert to a single static (first) frame. */
function normalizeImageForPdf(string $bytes, string $contentType): array {
    if ($contentType === 'image/gif') {
        $frame = @imagecreatefromstring($bytes);
        if ($frame !== false) {
            ob_start();
            imagepng($frame);
            $pngBytes = ob_get_clean();
            imagedestroy($frame);
            return [$pngBytes, 'image/png'];
        }
    }
    return [$bytes, $contentType];
}

function imageToDataUri(string $imagePath): ?string {
    $key = r2KeyFromStoredPath($imagePath);
    if (!$key) {
        return null;
    }

    try {
        $image = getProjectImageBytes($key);
    } catch (\Aws\S3\Exception\S3Exception $e) {
        error_log("R2 getObject failed for PDF export key '$key': " . $e->getMessage());
        return null;
    }

    [$bytes, $contentType] = normalizeImageForPdf($image['body'], $image['contentType']);
    return 'data:' . $contentType . ';base64,' . base64_encode($bytes);
}

function escapeHtml(?string $value): string {
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

// ---------------------------------------------------------------------------
// Handle the request
// ---------------------------------------------------------------------------

$clientIp = getClientIp();
rejectIfPdfLocked($conn, $clientIp);
recordPdfAttempt($conn, $clientIp);

$profile  = getProfileData($conn);
$projects = getProjectsData($conn);

$aboutHtml = $profile['description'] ?: '<p>No description provided yet.</p>';

$projectsHtml = '';
foreach ($projects as $project) {
    $title       = escapeHtml($project['title']);
    $description = $project['description'] ?: '<p><em>No description provided.</em></p>';
    $link        = $project['project_link'] ? escapeHtml($project['project_link']) : null;

    $imagesHtml = '';
    foreach ($project['images'] as $imagePath) {
        $dataUri = imageToDataUri($imagePath);
        if ($dataUri) {
            $imagesHtml .= '<img class="preview" width="150" height="100" src="' . $dataUri . '" alt="' . $title . ' preview">';
        }
    }

    $projectsHtml .= '
        <div class="project">
            <h2>' . $title . '</h2>
            <div class="project-description">' . $description . '</div>'
            . ($link ? '<p class="project-link">Link: <a href="' . $link . '">' . $link . '</a></p>' : '')
            . ($imagesHtml ? '<div class="preview-row">' . $imagesHtml . '</div>' : '')
        . '</div>';
}

$html = '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    body { font-family: DejaVu Sans, sans-serif; color: #0f172a; font-size: 12px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h1.section { font-size: 16px; margin: 26px 0 10px; border-bottom: 2px solid #2563eb; padding-bottom: 6px; }
    h2 { font-size: 14px; margin: 0 0 6px; }
    .about { margin: 10px 0 6px; line-height: 1.55; color: #334155; }
    .project { margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid #e2e8f0; }
    .project-description { line-height: 1.5; color: #334155; }
    .project-description p { margin: 0 0 6px; }
    .project-link { margin: 6px 0 8px; font-size: 11px; }
    .project-link a { color: #2563eb; text-decoration: none; }
    .preview-row { margin-top: 16px; }
    .preview { width: 150px; height: 100px; object-fit: cover; margin: 4px 6px 4px 0; border-radius: 6px; }
</style>
</head>
<body>
    <h1>Christian Dior Feraer&#39;s Portfolio</h1>
    <div class="about">' . $aboutHtml . '</div>
    <h1 class="section">Projects</h1>
    ' . ($projectsHtml ?: '<p>No projects to show yet.</p>') . '
</body>
</html>';

$options = new Options();
$options->set('isRemoteEnabled', false);
$options->set('defaultFont', 'DejaVu Sans');

$dompdf = new Dompdf($options);
$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();

header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="christian-dior-feraer-portfolio.pdf"');
echo $dompdf->output();
?>
