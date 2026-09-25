<?php

/** Convert GIF bytes to a static PNG for PDF rendering when GD can decode them. */
function normalizeImageForPdf(string $bytes, string $contentType): array
{
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

function escapeHtml(?string $value): string
{
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}
