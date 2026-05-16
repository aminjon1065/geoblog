<?php

namespace App\Support;

use Mews\Purifier\Facades\Purifier;

/**
 * Single chokepoint for sanitizing TipTap-authored HTML before it lands in the database.
 * Every controller that accepts rich-text fields MUST run them through here; the
 * frontend renders raw HTML via dangerouslySetInnerHTML and trusts this layer.
 */
class HtmlSanitizer
{
    /**
     * The named purifier profile defined in config/purifier.php.
     */
    public const PROFILE = 'blog';

    /**
     * Sanitize a single rich-text field. Returns null when input is null/empty so that
     * "field cleared" intent round-trips through validation untouched.
     */
    public static function clean(?string $html): ?string
    {
        if ($html === null) {
            return null;
        }

        $trimmed = trim($html);

        if ($trimmed === '') {
            return null;
        }

        return Purifier::clean($trimmed, self::PROFILE);
    }

    /**
     * Sanitize the listed keys inside a translations array (locale → field map).
     *
     * @param  array<string, array<string, mixed>>  $translations
     * @param  list<string>  $richTextFields
     * @return array<string, array<string, mixed>>
     */
    public static function cleanTranslations(array $translations, array $richTextFields): array
    {
        foreach ($translations as $locale => $data) {
            foreach ($richTextFields as $field) {
                if (! array_key_exists($field, $data)) {
                    continue;
                }

                $value = $data[$field];

                if ($value === null || is_string($value)) {
                    $translations[$locale][$field] = self::clean($value);
                }
            }
        }

        return $translations;
    }
}
