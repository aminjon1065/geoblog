<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Content;

use App\Support\HtmlSanitizer;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Block payload — type + untranslated settings + per-locale content map. The
 * registry-validated `type` lives here; the BlockType implementation tells the
 * service which content fields need HTML sanitisation.
 */
final readonly class ContentBlockData
{
    /**
     * @param  array<string, mixed>  $settings
     * @param  array<string, array<string, mixed>>  $translations  locale-keyed; values are the per-locale content map
     */
    public function __construct(
        public string $type,
        public array $settings,
        public array $translations,
    ) {}

    /**
     * @param  list<string>  $richTextFields  field names in `content` payloads that should be sanitised
     */
    public static function fromRequest(FormRequest $request, array $richTextFields = []): self
    {
        /** @var array<string, mixed> $settings */
        $settings = (array) ($request->validated('settings', []) ?? []);

        /** @var array<string, array<string, mixed>> $rawTranslations */
        $rawTranslations = (array) ($request->validated('translations', []) ?? []);

        // Treat each block translation payload like a content row: sanitise rich-text
        // fields the BlockType declares. Other field types pass through as plain strings.
        if ($richTextFields !== []) {
            $rawTranslations = HtmlSanitizer::cleanTranslations(
                self::normaliseForSanitiser($rawTranslations),
                $richTextFields,
            );
        }

        return new self(
            type: (string) $request->validated('type', ''),
            settings: $settings,
            translations: $rawTranslations,
        );
    }

    /**
     * HtmlSanitizer expects array<locale, array<field, mixed>>; coerce defensively
     * so a malformed nested value never reaches the sanitiser.
     *
     * @param  array<string, mixed>  $raw
     * @return array<string, array<string, mixed>>
     */
    private static function normaliseForSanitiser(array $raw): array
    {
        $out = [];
        foreach ($raw as $locale => $data) {
            $out[(string) $locale] = is_array($data) ? $data : [];
        }

        return $out;
    }
}
