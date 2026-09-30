<?php

declare(strict_types=1);

namespace App\Cms\Blocks;

final class HeroBlock implements BlockType
{
    public function key(): string
    {
        return 'hero';
    }

    public function label(): string
    {
        return 'Обложка';
    }

    public function settingsSchema(): array
    {
        return [
            // Optional Media row id; null for a text-only hero.
            'image_id' => 'integer',
            'alignment' => 'choice:left,center,right',
        ];
    }

    public function contentSchema(): array
    {
        return [
            'title' => 'string',
            'subtitle' => 'text',
            'cta_label' => 'string',
            // Rendered straight into the button's href, so only http(s) and site paths pass.
            'cta_url' => 'url',
        ];
    }

    public function defaultSettings(): array
    {
        return [
            'image_id' => null,
            'alignment' => 'center',
        ];
    }

    public function defaultContent(): array
    {
        return [
            'title' => '',
            'subtitle' => '',
            'cta_label' => '',
            'cta_url' => '',
        ];
    }
}
