<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Link addresses an editor types into content that the public site puts
 * into `href` as is (block buttons, menu links). Only web addresses and
 * paths of this site pass: `javascript:`, `data:` and other schemes are
 * refused, and so are protocol-relative `//host` addresses and
 * backslashes, which browsers read as slashes.
 */
final class SafeUrl
{
    /**
     * An absolute http(s) address with a host, e.g. https://example.com/page.
     */
    public static function isAbsoluteHttp(string $url): bool
    {
        if (! self::hasOnlyUrlCharacters($url)) {
            return false;
        }

        $parts = parse_url($url);

        return is_array($parts)
            && in_array(strtolower($parts['scheme'] ?? ''), ['http', 'https'], true)
            && ($parts['host'] ?? '') !== '';
    }

    /**
     * A path of this site, e.g. /ru/about — but not //another-host.
     */
    public static function isRootRelative(string $url): bool
    {
        return self::hasOnlyUrlCharacters($url)
            && str_starts_with($url, '/')
            && ! str_starts_with($url, '//');
    }

    /**
     * Either a path of this site or an absolute http(s) address.
     */
    public static function isAllowed(string $url): bool
    {
        return self::isRootRelative($url) || self::isAbsoluteHttp($url);
    }

    private static function hasOnlyUrlCharacters(string $url): bool
    {
        return $url !== '' && preg_match('/[\s\x00-\x1F\x7F\\\\]/u', $url) === 0;
    }
}
