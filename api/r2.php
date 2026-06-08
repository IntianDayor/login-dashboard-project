<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Aws\S3\S3Client;

function envValue(string $key): string {
    return getenv($key) ?: ($_ENV[$key] ?? '');
}

function getR2Client(): S3Client {
    return new S3Client([
        'version'     => 'latest',
        'region'      => 'auto',
        'endpoint'    => 'https://' . envValue('R2_ACCOUNT_ID') . '.r2.cloudflarestorage.com',
        'credentials' => [
            'key'    => envValue('R2_ACCESS_KEY_ID'),
            'secret' => envValue('R2_SECRET_ACCESS_KEY'),
        ],
    ]);
}

function uploadToR2(string $tmpPath, string $key, string $mimeType): string {
    $s3 = getR2Client();
    $s3->putObject([
        'Bucket'      => envValue('R2_BUCKET'),
        'Key'         => $key,
        'SourceFile'  => $tmpPath,
        'ContentType' => $mimeType,
    ]);
    return rtrim(envValue('R2_PUBLIC_URL'), '/') . '/' . $key;
}

function getR2KeyFromPublicUrl(string $url): ?string {
    $publicUrl = rtrim(envValue('R2_PUBLIC_URL'), '/') . '/';

    if (strpos($url, $publicUrl) !== 0) {
        return null;
    }

    $key = substr($url, strlen($publicUrl));
    return $key !== '' ? $key : null;
}

function deleteFromR2(string $key): void {
    $s3 = getR2Client();
    $s3->deleteObject([
        'Bucket' => envValue('R2_BUCKET'),
        'Key'    => $key,
    ]);
}
?>
