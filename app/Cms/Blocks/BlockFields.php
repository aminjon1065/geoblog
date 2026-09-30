<?php

declare(strict_types=1);

namespace App\Cms\Blocks;

use App\Support\HtmlSanitizer;
use App\Support\SafeUrl;
use Closure;
use Illuminate\Validation\Rule;

/**
 * What the field types of a block schema ({@see BlockType::settingsSchema()},
 * {@see BlockType::contentSchema()}) mean for validation and storage:
 *
 *   string       one line of plain text
 *   text         several lines of plain text
 *   html         rich text from the editor, sanitised before it is stored
 *   url          a link: an http(s) address or a path of this site
 *   integer      a whole positive number (e.g. a media id)
 *   choice:a,b   one of the listed values
 */
final class BlockFields
{
    /**
     * Validation rules for every field of a schema.
     *
     * @param  array<string, string>  $schema
     * @return array<string, list<mixed>>
     */
    public static function rules(array $schema): array
    {
        $rules = [];

        foreach ($schema as $field => $type) {
            $rules[$field] = self::rulesFor($type);
        }

        return $rules;
    }

    /**
     * @return list<mixed>
     */
    public static function rulesFor(string $type): array
    {
        $choices = self::choices($type);

        if ($choices !== null) {
            return ['nullable', 'string', Rule::in($choices)];
        }

        return match ($type) {
            'integer' => ['nullable', 'integer', 'min:1'],
            'text' => ['nullable', 'string', 'max:5000'],
            'html' => ['nullable', 'string'],
            'url' => ['nullable', 'string', 'max:2048', self::urlRule()],
            default => ['nullable', 'string', 'max:255'],
        };
    }

    /**
     * Keep only the schema's fields and store each one as its type: whole
     * numbers as int, rich text sanitised, everything else as a string. An
     * empty choice is left out so the stored or default value stays.
     *
     * @param  array<string, string>  $schema
     * @param  array<array-key, mixed>  $values
     * @return array<string, mixed>
     */
    public static function normalize(array $schema, array $values): array
    {
        $normalized = [];

        foreach ($schema as $field => $type) {
            if (! array_key_exists($field, $values)) {
                continue;
            }

            $value = $values[$field];

            if ($type === 'integer') {
                $normalized[$field] = is_numeric($value) ? (int) $value : null;

                continue;
            }

            $text = is_string($value) || is_int($value) || is_float($value) ? (string) $value : '';

            if (self::choices($type) !== null && $text === '') {
                continue;
            }

            $normalized[$field] = $type === 'html' ? (HtmlSanitizer::clean($text) ?? '') : $text;
        }

        return $normalized;
    }

    /**
     * The values a `choice:` field allows; null for every other type.
     *
     * @return list<string>|null
     */
    public static function choices(string $type): ?array
    {
        if (! str_starts_with($type, 'choice:')) {
            return null;
        }

        return array_values(array_filter(explode(',', substr($type, strlen('choice:'))), fn (string $choice): bool => $choice !== ''));
    }

    private static function urlRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            if (is_string($value) && $value !== '' && ! SafeUrl::isAllowed($value)) {
                $fail('Ссылка должна начинаться с http://, https:// или с «/» (адрес на этом сайте).');
            }
        };
    }
}
