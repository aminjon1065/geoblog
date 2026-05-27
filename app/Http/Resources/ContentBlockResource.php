<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ContentBlock;

final class ContentBlockResource
{
    /**
     * Shape used inside Admin\Content\Edit — settings + full per-locale content map
     * so the React editor can present the right form for each block type.
     *
     * @return array<string, mixed>
     */
    public static function forAdminEdit(ContentBlock $block): array
    {
        return [
            'id' => $block->id,
            'type' => $block->type,
            'sort_order' => $block->sort_order,
            'settings' => $block->settings ?? [],
            'translations' => $block->translations->keyBy('locale')->map(fn ($t) => [
                'content' => $t->content ?? [],
            ]),
        ];
    }

    /**
     * Shape used by the public renderer — flattens to the current locale's content
     * so the React block component does not have to think about i18n at render time.
     *
     * @return array<string, mixed>
     */
    public static function forPublicRender(ContentBlock $block): array
    {
        $translation = $block->translation;

        return [
            'id' => $block->id,
            'type' => $block->type,
            'sort_order' => $block->sort_order,
            'settings' => $block->settings ?? [],
            'content' => $translation?->content ?? [],
        ];
    }
}
