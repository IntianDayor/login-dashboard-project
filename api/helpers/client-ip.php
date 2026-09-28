<?php

/**
 * Client IP for rate limiting.
 *
 * TRUSTED_PROXY_HOPS = number of reverse proxies in front of the app that each
 * append to X-Forwarded-For. 0 (default) ignores the header entirely, so a
 * client can never choose its own rate-limit key. With N > 0 the client is the
 * Nth entry from the right, i.e. the address the outermost trusted proxy saw.
 */
function getClientIp(): string
{
    $remote = $_SERVER['REMOTE_ADDR'] ?? '';
    $hops = (int) (getenv('TRUSTED_PROXY_HOPS') ?: ($_ENV['TRUSTED_PROXY_HOPS'] ?? 0));

    if ($hops > 0 && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = array_map('trim', explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']));
        $candidate = $ips[count($ips) - $hops] ?? '';
        if (filter_var($candidate, FILTER_VALIDATE_IP)) {
            return $candidate;
        }
    }

    return filter_var($remote, FILTER_VALIDATE_IP) ? $remote : '127.0.0.1';
}
