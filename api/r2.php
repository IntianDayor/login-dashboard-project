<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Aws\S3\S3Client;

function getR2Client(): S3Client {
    return new S3Client([
        'version'     => 'latest',
        'region'      => 'auto',
        'endpoint'    => 'https://' . getenv('R2_ACCOUNT_ID') . '.r2.cloudflarestorage.com',
        'credentials' => [
            'key'    => getenv('R2_ACCESS_KEY_ID'),
            'secret' => getenv('R2_SECRET_ACCESS_KEY'),
        ],
    ]);
}

function uploadToR2(string $tmpPath, string $key, string $mimeType): string {
    $s3 = getR2Client();
    $s3->putObject([
        'Bucket'      => getenv('R2_BUCKET'),
        'Key'         => $key,
        'SourceFile'  => $tmpPath,
        'ContentType' => $mimeType,
    ]);
    return rtrim(getenv('R2_PUBLIC_URL'), '/') . '/' . $key;
}

function deleteFromR2(string $key): void {
    $s3 = getR2Client();
    $s3->deleteObject([
        'Bucket' => getenv('R2_BUCKET'),
        'Key'    => $key,
    ]);
}
?>