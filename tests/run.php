<?php

require_once __DIR__ . '/../api/sanitize.php';
require_once __DIR__ . '/../api/helpers/social-url.php';
require_once __DIR__ . '/../api/helpers/pdf.php';
require_once __DIR__ . '/../api/helpers/storage-path.php';

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
