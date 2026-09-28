<?php

const PDF_IMAGE_WIDTH = 450; // 3:2, same ratio as the 150x100 preview box in the PDF

/**
 * Center-crop to 3:2,
 * downscale to at most 450px wide, and re-encode. GIFs become a static first frame.
 * Undecodable input is returned untouched.
 */
function normalizeImageForPdf(string $bytes, string $contentType): array
{
    $img = @imagecreatefromstring($bytes);
    if ($img === false) {
        return [$bytes, $contentType];
    }

    $sw = imagesx($img);
    $sh = imagesy($img);
    if ($sw / $sh > 1.5) {
        $cropH = $sh;
        $cropW = max(1, (int) round($sh * 1.5));
    } else {
        $cropW = $sw;
        $cropH = max(1, (int) round($sw / 1.5));
    }
    $sx = intdiv($sw - $cropW, 2);
    $sy = intdiv($sh - $cropH, 2);

    $scale = min(1, PDF_IMAGE_WIDTH / $cropW);
    $tw = max(1, (int) round($cropW * $scale));
    $th = max(1, (int) round($cropH * $scale));

    $out = imagecreatetruecolor($tw, $th);
    imagealphablending($out, false);
    imagesavealpha($out, true);
    imagecopyresampled($out, $img, 0, 0, $sx, $sy, $tw, $th, $cropW, $cropH);
    imagedestroy($img);

    ob_start();
    if ($contentType === 'image/jpeg') {
        imagejpeg($out, null, 85);
        $type = 'image/jpeg';
    } else {
        imagepng($out);
        $type = 'image/png';
    }
    $result = ob_get_clean();
    imagedestroy($out);
    return [$result, $type];
}

/** Only http(s) links are allowed inside the PDF. */
function sanitizeProjectLink(?string $url): ?string
{
    $url = trim((string) $url);
    if ($url === '' || strlen($url) > 500 || !filter_var($url, FILTER_VALIDATE_URL)) {
        return null;
    }
    $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
    return in_array($scheme, ['http', 'https'], true) ? $url : null;
}

function escapeHtml(?string $value): string
{
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}
