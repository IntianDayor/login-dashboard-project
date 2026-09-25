<?php

/**
 * Normalize an optional social URL, or return false when it is invalid.
 *
 * @return string|false|null Null means no URL was provided; false means invalid.
 */
function sanitizeSocialUrl(string $url): string|false|null
{
    $url = trim($url);
    if ($url === '') {
        return null;
    }

    if (strlen($url) > 500 || !filter_var($url, FILTER_VALIDATE_URL)) {
        return false;
    }

    $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
    return in_array($scheme, ['http', 'https'], true) ? $url : false;
}
