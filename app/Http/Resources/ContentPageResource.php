<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ContentPage;

final class ContentPageResource
{
    /**
     * Row shape for Admin\Content\Index.
     *
     * @return array<string, mixed>
     */
    public static function forAdminIndex(ContentPage $page): array
    {
        return [
            'id' => $page->id,
            'slug' => $page->slug,
            'status' => $page->status,
            'template' => $page->template,
            'published_at' => $page->published_at?->toDateString(),
            'title' => $page->translation?->title ?? $page->slug,
            'parent_id' => $page->parent_id,
            'updated_at' => $page->updated_at?->toIso8601String(),
        ];
    }

    /**
     * Form payload for Admin\Content\Edit.
     *
     * @return array<string, mixed>
     */
    public static function forAdminEdit(ContentPage $page): array
    {
        return [
            'id' => $page->id,
            'parent_id' => $page->parent_id,
            'slug' => $page->slug,
            'status' => $page->status,
            'template' => $page->template,
            'published_at' => $page->published_at?->format('Y-m-d'),
            'translations' => $page->translations->keyBy('locale')->map(fn ($t) => [
                'title' => $t->title,
                'meta_title' => $t->meta_title,
                'meta_description' => $t->meta_description,
            ]),
            'blocks' => $page->blocks
                ->map(fn ($b) => ContentBlockResource::forAdminEdit($b))
                ->values(),
        ];
    }

    /**
     * Detail shape for Public\ContentPage\Show.
     *
     * @return array<string, mixed>
     */
    public static function forPublicShow(ContentPage $page): array
    {
        $translation = $page->translation;

        return [
            'id' => $page->id,
            'slug' => $page->slug,
            'template' => $page->template,
            'title' => $translation?->title,
            'meta' => [
                'title' => $translation?->meta_title ?? $translation?->title,
                'description' => $translation?->meta_description,
            ],
            'blocks' => $page->blocks
                ->map(fn ($b) => ContentBlockResource::forPublicRender($b))
                ->values(),
        ];
    }
}
