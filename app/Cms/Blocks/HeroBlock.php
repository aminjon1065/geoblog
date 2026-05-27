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
        return 'Hero';
    }

    public function settingsSchema(): array
    {
        return [
            'image_id' => 'integer',   // optional Media row id; null for text-only hero
            'alignment' => 'string',   // 'left' | 'center' | 'right'
        ];
    }

    public function contentSchema(): array
    {
        return [
            'title' => 'string',
            'subtitle' => 'string',
            'cta_label' => 'string',
            'cta_url' => 'string',
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
