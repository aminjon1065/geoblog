<?php

declare(strict_types=1);

namespace App\Services\Content;

/**
 * Estimates reading time in minutes from a chunk of HTML-or-plain content.
 *
 * The 200 wpm figure is a long-standing average across content sites; per-language
 * deviation exists but the integer rounding swallows most of the noise.
 */
final class ReadingTimeCalculator
{
    public const WORDS_PER_MINUTE = 200;

    public static function fromHtml(?string $html): ?int
    {
        if ($html === null) {
            return null;
        }

        $text = strip_tags($html);
        $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = trim($text);

        if ($text === '') {
            return null;
        }

        // str_word_count is locale-dependent and tuned for ASCII; for cyrillic content
        // (the bulk of this site) we count whitespace-delimited tokens instead.
        $words = preg_split('/\s+/u', $text) ?: [];
        $words = array_filter($words, fn (string $w): bool => $w !== '');

        if (count($words) === 0) {
            return null;
        }

        $minutes = (int) ceil(count($words) / self::WORDS_PER_MINUTE);

        // Pieces with content this short still ought to read as "1 min", not zero.
        return max(1, $minutes);
    }
}
