<?php

require_once __DIR__ . '/../api/sanitize.php';
require_once __DIR__ . '/../api/helpers/social-url.php';
require_once __DIR__ . '/../api/helpers/pdf.php';
require_once __DIR__ . '/../api/helpers/storage-path.php';
require_once __DIR__ . '/../api/helpers/client-ip.php';

$tests = [
    'keeps supported rich-text tags' => function (): void {
        $actual = sanitizeRichText('<p>Hello <strong>world</strong></p><ul><li>One</li></ul>');
        assertSame('<p>Hello <strong>world</strong></p><ul><li>One</li></ul>', $actual);
    },
    'removes unsupported tags while preserving their text' => function (): void {
        $actual = sanitizeRichText('<script>alert(1)</script><p>Safe</p><iframe>frame</iframe>');
        assertSame('alert(1)<p>Safe</p>frame', $actual);
    },
    'strips attributes from non-link tags' => function (): void {
        $actual = sanitizeRichText('<p class="x" onclick="run()">Text</p><br id="y">');
        assertSame('<p>Text</p><br>', $actual);
    },
    'keeps HTTP links with safe attributes' => function (): void {
        $actual = sanitizeRichText('<a href="https://example.com/path?a=1&b=2" onclick="run()">Link</a>');
        assertSame('<a href="https://example.com/path?a=1&amp;b=2" target="_blank" rel="noopener noreferrer">Link</a>', $actual);
    },
    'removes unsafe link destinations' => function (): void {
        $actual = sanitizeRichText('<a href="javascript:alert(1)" target="_self">Click</a>');
        assertSame('<a>Click</a>', $actual);
    },
    'does not allow protocol-relative or relative link destinations' => function (): void {
        $actual = sanitizeRichText('<a href="//example.com">A</a><a href="/local">B</a>');
        assertSame('<a>A</a><a>B</a>', $actual);
    },
    'social URL validation accepts HTTP and HTTPS URLs after trimming' => function (): void {
        assertSame('https://example.com/profile', sanitizeSocialUrl('  https://example.com/profile  '));
        assertSame('http://example.com/profile', sanitizeSocialUrl('http://example.com/profile'));
    },
    'social URL validation distinguishes an empty value from invalid URLs' => function (): void {
        assertSame(null, sanitizeSocialUrl('  '));
        assertSame(false, sanitizeSocialUrl('javascript:alert(1)'));
        assertSame(false, sanitizeSocialUrl('ftp://example.com/profile'));
        assertSame(false, sanitizeSocialUrl('not a URL'));
    },
    'social URL validation rejects URLs longer than 500 characters' => function (): void {
        assertSame(false, sanitizeSocialUrl('https://example.com/' . str_repeat('a', 500)));
    },
    'PDF HTML escaping encodes markup and quotes' => function (): void {
        assertSame('&lt;script&gt;&quot;x&quot;&lt;/script&gt;', escapeHtml('<script>"x"</script>'));
    },
    'PDF HTML escaping turns null into an empty string' => function (): void {
        assertSame('', escapeHtml(null));
    },
    'PDF image normalization preserves non-GIF bytes and content type' => function (): void {
        assertSame(['image-bytes', 'image/jpeg'], normalizeImageForPdf('image-bytes', 'image/jpeg'));
    },
    'PDF image normalization converts a valid GIF to PNG' => function (): void {
        $gif = base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
        [$bytes, $contentType] = normalizeImageForPdf($gif, 'image/gif');
        assertSame('image/png', $contentType);
        assertSame("\x89PNG\r\n\x1a\n", substr($bytes, 0, 8));
    },
    'stored R2 key parsing accepts bare object keys and empty values' => function (): void {
        assertSame('images/projects/example.png', r2KeyFromStoredPath('images/projects/example.png'));
        assertSame(null, r2KeyFromStoredPath(''));
    },
    'stored R2 key parsing extracts image keys from legacy URLs' => function (): void {
        assertSame('images/profile/avatar.png', r2KeyFromStoredPath('https://cdn.example.test/images/profile/avatar.png'));
        assertSame(null, r2KeyFromStoredPath('https://cdn.example.test/files/avatar.png'));
    },
    'client IP ignores X-Forwarded-For unless proxies are trusted' => function (): void {
        putenv('TRUSTED_PROXY_HOPS=0');
        $_SERVER = ['REMOTE_ADDR' => '203.0.113.7', 'HTTP_X_FORWARDED_FOR' => '9.9.9.9'];
        assertSame('203.0.113.7', getClientIp());
    },
    'client IP uses the Nth entry from the right for N trusted proxies' => function (): void {
        putenv('TRUSTED_PROXY_HOPS=1');
        $_SERVER = ['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => '1.1.1.1, 203.0.113.9'];
        assertSame('203.0.113.9', getClientIp());
        putenv('TRUSTED_PROXY_HOPS=2');
        $_SERVER['HTTP_X_FORWARDED_FOR'] = '203.0.113.9, 172.70.1.1';
        assertSame('203.0.113.9', getClientIp());
    },
    'client IP falls back to REMOTE_ADDR when the header is short or invalid' => function (): void {
        putenv('TRUSTED_PROXY_HOPS=2');
        $_SERVER = ['REMOTE_ADDR' => '10.0.0.5', 'HTTP_X_FORWARDED_FOR' => '203.0.113.9'];
        assertSame('10.0.0.5', getClientIp());
        putenv('TRUSTED_PROXY_HOPS=1');
        $_SERVER['HTTP_X_FORWARDED_FOR'] = 'not-an-ip';
        assertSame('10.0.0.5', getClientIp());
        putenv('TRUSTED_PROXY_HOPS=0');
    },
    'PDF project links allow only http and https' => function (): void {
        assertSame('https://example.com/a', sanitizeProjectLink('  https://example.com/a '));
        assertSame(null, sanitizeProjectLink('javascript:alert(1)'));
        assertSame(null, sanitizeProjectLink('ftp://example.com/f'));
        assertSame(null, sanitizeProjectLink(null));
    },
    'PDF image normalization crops to 3:2 and caps the width at 450px' => function (): void {
        foreach ([[1920, 1080], [540, 1170]] as [$w, $h]) {
            $im = imagecreatetruecolor($w, $h);
            ob_start(); imagepng($im); $png = ob_get_clean();
            [$bytes] = normalizeImageForPdf($png, 'image/png');
            [$ow, $oh] = getimagesizefromstring($bytes);
            assertSame(450, $ow);
            assertSame(300, $oh);
        }
    },
    'PDF image normalization never upscales small images' => function (): void {
        $im = imagecreatetruecolor(90, 60);
        ob_start(); imagejpeg($im); $jpg = ob_get_clean();
        [$bytes, $type] = normalizeImageForPdf($jpg, 'image/jpeg');
        assertSame('image/jpeg', $type);
        assertSame([90, 60], array_slice(getimagesizefromstring($bytes), 0, 2));
    },
];

$failures = 0;
foreach ($tests as $name => $test) {
    try {
        $test();
        fwrite(STDOUT, "PASS $name\n");
    } catch (Throwable $error) {
        $failures++;
        fwrite(STDERR, "FAIL $name: {$error->getMessage()}\n");
    }
}

fwrite(STDOUT, sprintf("\n%d tests, %d failures\n", count($tests), $failures));
exit($failures === 0 ? 0 : 1);

function assertSame(mixed $expected, mixed $actual): void
{
    if ($expected !== $actual) {
        throw new RuntimeException(sprintf("Expected %s, got %s", var_export($expected, true), var_export($actual, true)));
    }
}
