<?php

/**
 * Reduce a stored bare R2 key or legacy public URL to its object key.
 */
function r2KeyFromStoredPath(string $imagePath): ?string
{
    if (str_starts_with($imagePath, 'http')) {
        $pos = strpos($imagePath, 'images/');
        return $pos !== false ? substr($imagePath, $pos) : null;
    }
    return $imagePath !== '' ? $imagePath : null;
}
