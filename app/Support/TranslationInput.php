<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Locale;

/**
 * The per-language part of an admin form: `translations` keyed by locale
 * code. A language sent with its main field (title, label…) filled is
 * saved; one sent with that field empty was cleared by the editor and is
 * removed; a language the form did not send at all — one switched off
 * after the text was written, say — is left as it is.
 */
final class TranslationInput
{
    /**
     * @param  array<array-key, mixed>  $translations
     * @param  string  $mainField  the field whose value makes a language "filled"
     * @param  list<string>  $fields  the other fields to keep
     * @return array{save: array<string, array<string, string|null>>, clear: list<string>}
     */
    public static function split(array $translations, string $mainField, array $fields = []): array
    {
        $save = [];
        $clear = [];

        foreach ($translations as $locale => $values) {
            $values = is_array($values) ? $values : [];
            $main = self::text($values[$mainField] ?? null);

            if ($main === null) {
                $clear[] = (string) $locale;

                continue;
            }

            $row = [$mainField => $main];

            foreach ($fields as $field) {
                $row[$field] = self::text($values[$field] ?? null);
            }

            $save[(string) $locale] = $row;
        }

        return ['save' => $save, 'clear' => $clear];
    }

    /**
     * Whether at least one language has `$field` filled.
     *
     * @param  array<array-key, mixed>  $translations
     */
    public static function hasFilled(array $translations, string $field): bool
    {
        foreach ($translations as $values) {
            if (is_array($values) && self::text($values[$field] ?? null) !== null) {
                return true;
            }
        }

        return false;
    }

    /**
     * The keys of `$translations` that are not a language of the site.
     *
     * @param  array<array-key, mixed>  $translations
     * @return list<string>
     */
    public static function unknownLocales(array $translations): array
    {
        $known = Locale::query()->pluck('code')->all();

        return array_values(array_diff(array_map('strval', array_keys($translations)), $known));
    }

    /**
     * Rich text that shows nothing: the editor leaves `<p></p>` behind when
     * everything typed is erased.
     */
    public static function isBlankHtml(string $html): bool
    {
        $text = html_entity_decode(strip_tags($html, '<img><iframe><video><audio><hr>'), ENT_QUOTES | ENT_HTML5, 'UTF-8');

        return preg_replace('/[\s\x{00A0}]+/u', '', $text) === '';
    }

    /**
     * Replace blank rich text in `$field` of every language with an empty
     * string, so that it does not count as filled.
     *
     * @param  array<array-key, mixed>  $translations
     * @return array<array-key, mixed>
     */
    public static function withoutBlankHtml(array $translations, string $field): array
    {
        foreach ($translations as $locale => $values) {
            if (is_array($values) && is_string($values[$field] ?? null) && self::isBlankHtml($values[$field])) {
                $translations[$locale][$field] = '';
            }
        }

        return $translations;
    }

    private static function text(mixed $value): ?string
    {
        if (! is_string($value) && ! is_int($value) && ! is_float($value)) {
            return null;
        }

        $text = trim((string) $value);

        return $text === '' ? null : $text;
    }
}
