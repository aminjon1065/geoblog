<?php

declare(strict_types=1);

namespace App\Support;

use Closure;
use Illuminate\Support\Str;

/**
 * URL slugs for content. Str::slug alone drops the Tajik letters it cannot
 * transliterate ("Ҳамкорӣ бо ҷомеа" became "amkor-bo-omea") and returns an
 * empty string for titles with no Latin/Cyrillic letters, so both are
 * handled here. Uniqueness is the caller's rule (a closure), because
 * soft-deleted rows still hold their slug in the unique index.
 */
final class Slug
{
    public const MAX_LENGTH = 120;

    private const TAJIK_LETTERS = [
        'ғ' => 'gh', 'Ғ' => 'Gh',
        'ӣ' => 'i', 'Ӣ' => 'I',
        'қ' => 'q', 'Қ' => 'Q',
        'ӯ' => 'u', 'Ӯ' => 'U',
        'ҳ' => 'h', 'Ҳ' => 'H',
        'ҷ' => 'j', 'Ҷ' => 'J',
    ];

    /**
     * The slug for a title or a hand-typed address; empty when nothing
     * usable is left.
     */
    public static function from(string $text): string
    {
        $slug = Str::slug(strtr($text, self::TAJIK_LETTERS));

        if (strlen($slug) <= self::MAX_LENGTH) {
            return $slug;
        }

        $cut = substr($slug, 0, self::MAX_LENGTH);
        $lastDash = strrpos($cut, '-');

        return rtrim($lastDash !== false && $lastDash > 40 ? substr($cut, 0, $lastDash) : $cut, '-');
    }

    /**
     * `$base`, or `$base-2`, `$base-3`… — the first one `$isTaken` rejects not.
     *
     * @param  Closure(string): bool  $isTaken
     */
    public static function unique(string $base, Closure $isTaken, string $fallback = 'zapis'): string
    {
        $base = $base !== '' ? $base : $fallback;
        $slug = $base;
        $suffix = 2;

        while ($isTaken($slug)) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
