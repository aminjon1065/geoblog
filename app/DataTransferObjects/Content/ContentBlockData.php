<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Content;

use App\Cms\Blocks\BlockFields;
use App\Cms\Blocks\BlockType;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Block payload — type + untranslated settings + per-locale content map, each
 * reduced to the fields of the type's schema and stored as their type (rich
 * text sanitised, see {@see BlockFields}).
 */
final readonly class ContentBlockData
{
    /**
     * @param  array<string, mixed>|null  $settings  null when the form sent no settings: the stored ones stay
     * @param  array<string, array<string, mixed>>  $translations  locale-keyed content; languages not sent keep theirs
     */
    public function __construct(
        public string $type,
        public ?array $settings,
        public array $translations,
    ) {}

    public static function fromRequest(FormRequest $request, BlockType $type): self
    {
        $settings = $request->validated('settings');
        $translations = [];

        foreach ((array) ($request->validated('translations') ?? []) as $locale => $content) {
            $translations[(string) $locale] = BlockFields::normalize(
                $type->contentSchema(),
                is_array($content) ? $content : [],
            );
        }

        return new self(
            type: $type->key(),
            settings: is_array($settings) ? BlockFields::normalize($type->settingsSchema(), $settings) : null,
            translations: $translations,
        );
    }
}
