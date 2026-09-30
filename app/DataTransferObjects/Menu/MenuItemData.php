<?php

declare(strict_types=1);

namespace App\DataTransferObjects\Menu;

use App\Support\TranslationInput;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Menu-item payload. Labels are kept locale-keyed (`translations`) so the same
 * item ships with its tg/ru/en text; the URL is derived server-side from
 * link_type + link_target by MenuItemUrlResolver.
 */
final readonly class MenuItemData
{
    /**
     * @param  array<string, string>  $translations  locale → label to save
     * @param  list<string>  $clearedLocales  languages whose label the editor emptied: removed
     */
    public function __construct(
        public ?int $parentId,
        public string $linkType,
        public ?string $linkTarget,
        public bool $openInNewTab,
        public array $translations,
        public array $clearedLocales = [],
    ) {}

    public static function fromRequest(FormRequest $request): self
    {
        $parentRaw = $request->validated('parent_id');
        $changes = TranslationInput::split(
            (array) ($request->validated('translations', []) ?? []),
            'label',
        );

        return new self(
            parentId: $parentRaw !== null && $parentRaw !== '' ? (int) $parentRaw : null,
            linkType: (string) $request->validated('link_type'),
            linkTarget: self::nullableString($request->validated('link_target')),
            openInNewTab: (bool) $request->validated('open_in_new_tab', false),
            translations: array_map(fn (array $fields): string => (string) $fields['label'], $changes['save']),
            clearedLocales: $changes['clear'],
        );
    }

    private static function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $value = (string) $value;

        return $value === '' ? null : $value;
    }
}
