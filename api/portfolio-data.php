<?php
require_once __DIR__ . '/r2.php';
require_once __DIR__ . '/helpers/storage-path.php';

/**
 * Shared, auth-agnostic data-fetching functions for portfolio content.
 */

function getProfileData(mysqli $conn): array {
    $sql = "SELECT description, profile_picture FROM profile WHERE id = 1 LIMIT 1";
    $result = $conn->query($sql);
    $profile = $result ? $result->fetch_assoc() : null;

    $socialResult = $conn->query("SELECT github_url, linkedin_url, instagram_url, facebook_url FROM social_links WHERE id = 1 LIMIT 1");
    $socialLinks = $socialResult ? $socialResult->fetch_assoc() : null;
    $socialUrls = array_values(array_filter($socialLinks ?? [], static function ($value, $key) {
        return str_ends_with($key, '_url') && !empty($value);
    }, ARRAY_FILTER_USE_BOTH));

    return array_merge($profile ?? [], $socialLinks ?? [], ['social_urls' => $socialUrls]);
}

function getProjectsData(mysqli $conn): array {
    $sql = "
    SELECT 
        p.id,
        p.title,
        p.description,
        p.project_link,
        GROUP_CONCAT(pp.image_path) AS images
    FROM projects p
    LEFT JOIN project_previews pp ON p.id = pp.project_id
    GROUP BY p.id
    ORDER BY p.id DESC
    ";

    $result = $conn->query($sql);
    if (!$result) {
        return [];
    }

    $projects = [];
    while ($row = $result->fetch_assoc()) {
        $row['images'] = $row['images']
            ? explode(",", $row['images'])
            : [];
        $projects[] = $row;
    }

    return $projects;
}

/**
 * Fetch a single object's raw bytes + content type from R2 by key.
 * Throws \Aws\S3\Exception\S3Exception on failure — callers decide how to handle it.
 *
 * @return array{body: string, contentType: string}
 */
function getProjectImageBytes(string $key): array {
    $s3 = getR2Client();
    $result = $s3->getObject([
        'Bucket' => envValue('R2_BUCKET'),
        'Key'    => $key,
    ]);

    return [
        'body'        => (string) $result['Body'],
        'contentType' => $result['ContentType'] ?? 'application/octet-stream',
    ];
}

?>
