<?php

function sanitizeRichText(string $html): string {
    $allowedTags = '<p><br><strong><em><u><ol><ul><li><a>';
    $clean = strip_tags($html, $allowedTags);

    return preg_replace_callback(
        '/<a\s+([^>]*?)>/i',
        function ($matches) {
            $attrs = $matches[1];

            preg_match('/href\s*=\s*([\"\'])(.*?)\1/i', $attrs, $hrefMatch);
            $href = $hrefMatch[2] ?? '';

            if (!preg_match('/^https?:\/\//i', $href)) {
                return '<a>';
            }

            $safeHref = htmlspecialchars($href, ENT_QUOTES, 'UTF-8');
            return '<a href="' . $safeHref . '" target="_blank" rel="noopener noreferrer">';
        },
        $clean
    );
}

?>