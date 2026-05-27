<?php

declare(strict_types=1);

namespace App\Cms\Blocks;

final class RichTextBlock implements BlockType
{
    public function key(): string
    {
        return 'rich_text';
    }

    public function label(): string
    {
        return 'Rich Text';
    }

    public function settingsSchema(): array
    {
        return [];
    }

    public function contentSchema(): array
    {
        return [
            // Authored via TipTap; sanitised through HtmlSanitizer before persistence.
            'body' => 'string',
        ];
    }

    public function defaultSettings(): array
    {
        return [];
    }

    public function defaultContent(): array
    {
        return [
            'body' => '',
        ];
    }
}
