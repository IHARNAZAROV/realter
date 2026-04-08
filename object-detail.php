<?php

declare(strict_types=1);

$templatePath = __DIR__ . '/object-detail.html';
$html = @file_get_contents($templatePath);

if ($html === false) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'Template object-detail.html not found';
    exit;
}

$slug = isset($_GET['slug']) ? trim((string)$_GET['slug']) : '';
$defaultTitle = 'Объект недвижимости в Лиде — Ольга Турко';
$defaultDescription = 'Детальная карточка объекта недвижимости в Лиде: фото, параметры, цена и консультация риэлтера Ольги Турко.';
$defaultImage = 'https://turko.by/images/main-slider/2.webp';
$defaultUrl = 'https://turko.by/objects';
$agentPhone = '+375291809516';

$title = $defaultTitle;
$description = $defaultDescription;
$image = $defaultImage;
$url = $defaultUrl;

$normalizeText = static function ($value): string {
    return trim((string)$value);
};

$truncate = static function (string $text, int $max): string {
    if (mb_strlen($text, 'UTF-8') <= $max) {
        return $text;
    }

    return rtrim(mb_substr($text, 0, $max - 1, 'UTF-8')) . '…';
};

$absoluteUrl = static function (string $src): string {
    if ($src === '') {
        return '';
    }

    if (preg_match('~^https?://~i', $src) === 1) {
        return $src;
    }

    return 'https://turko.by' . $src;
};

if ($slug !== '' && preg_match('~^[a-z0-9\-]+$~i', $slug) === 1) {
    $objectFile = __DIR__ . '/data/objects/' . $slug . '.json';
    if (is_file($objectFile)) {
        $json = @file_get_contents($objectFile);
        $object = is_string($json) ? json_decode($json, true) : null;

        if (is_array($object)) {
            $objectTitle = $normalizeText($object['title'] ?? '');
            if ($objectTitle !== '') {
                $title = $objectTitle . ' — Ольга Турко';
            }

            $sourceDescription = $normalizeText($object['metaDescription'] ?? '')
                ?: $normalizeText($object['cardDescription'] ?? '')
                ?: $normalizeText($object['description'] ?? '');

            if ($sourceDescription === '') {
                $sourceDescription = 'Объект недвижимости в Лиде';
            }

            $sourceDescription = $truncate($sourceDescription, 140);

            $price = $object['livePriceBYN'] ?? $object['priceBYN'] ?? null;
            $priceText = is_numeric($price)
                ? number_format((float)$price, 0, '.', ' ') . ' BYN'
                : 'Цена по запросу';

            $description = sprintf('%s. Цена: %s. Телефон: %s', $sourceDescription, $priceText, $agentPhone);

            $images = $object['images'] ?? [];
            if (is_array($images) && !empty($images[0])) {
                $image = $absoluteUrl((string)$images[0]);
            }

            $url = 'https://turko.by/objects/' . rawurlencode($slug);
        }
    }
}

$replaceTitle = static function (string $input, string $newTitle): string {
    return preg_replace(
        '~<title>.*?</title>~su',
        '<title>' . htmlspecialchars($newTitle, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</title>',
        $input,
        1
    ) ?? $input;
};

$replaceMeta = static function (string $input, string $attr, string $key, string $content): string {
    $escapedKey = preg_quote($key, '~');
    $replacement = sprintf(
        '<meta %s="%s" content="%s" />',
        $attr,
        htmlspecialchars($key, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'),
        htmlspecialchars($content, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')
    );

    $pattern = '~<meta\s+[^>]*' . preg_quote($attr, '~') . '="' . $escapedKey . '"[^>]*>~iu';

    if (preg_match($pattern, $input) === 1) {
        return preg_replace($pattern, $replacement, $input, 1) ?? $input;
    }

    return str_replace('<!-- Favicons -->', $replacement . PHP_EOL . '    <!-- Favicons -->', $input);
};

$replaceCanonical = static function (string $input, string $canonical): string {
    $replacement = '<link rel="canonical" href="' . htmlspecialchars($canonical, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '" />';
    $pattern = '~<link\s+rel="canonical"\s+href="[^"]*"\s*/?>~iu';

    if (preg_match($pattern, $input) === 1) {
        return preg_replace($pattern, $replacement, $input, 1) ?? $input;
    }

    return str_replace('</head>', '    ' . $replacement . PHP_EOL . '</head>', $input);
};

$html = $replaceTitle($html, $title);
$html = $replaceMeta($html, 'name', 'description', $description);
$html = $replaceMeta($html, 'property', 'og:type', 'product');
$html = $replaceMeta($html, 'property', 'og:title', $title);
$html = $replaceMeta($html, 'property', 'og:description', $description);
$html = $replaceMeta($html, 'property', 'og:url', $url);
$html = $replaceMeta($html, 'property', 'og:image', $image);
$html = $replaceMeta($html, 'property', 'og:image:alt', $title);
$html = $replaceMeta($html, 'property', 'og:phone_number', $agentPhone);
$html = $replaceMeta($html, 'property', 'product:price:currency', 'BYN');
$html = $replaceMeta($html, 'name', 'twitter:title', $title);
$html = $replaceMeta($html, 'name', 'twitter:description', $description);
$html = $replaceMeta($html, 'name', 'twitter:image', $image);
$html = $replaceCanonical($html, $url);

header('Content-Type: text/html; charset=UTF-8');
echo $html;
