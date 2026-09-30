<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ContentPage;
use App\Models\ContentPageTranslation;
use App\Support\Translations;

final class ContentPageResource
{
    /**
     * Row shape for Admin\Content\Index. Expects `translations`, `creator` and
     * `parent.translations` to be loaded.
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
            'published_at' => $page->published_at?->toIso8601String(),
            'is_scheduled' => self::isScheduled($page),
            'is_viewable' => self::isViewable($page),
            'title' => self::title($page),
            'locales' => $page->translations->pluck('locale')->values()->all(),
            'parent_id' => $page->parent_id,
            'parent_title' => $page->parent !== null ? self::title($page->parent) : null,
            'author' => $page->creator?->name,
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
            'is_scheduled' => self::isScheduled($page),
            'is_viewable' => self::isViewable($page),
            'author' => $page->creator?->name,
            'created_at' => $page->created_at?->toIso8601String(),
            'updated_at' => $page->updated_at?->toIso8601String(),
            'translations' => $page->translations->keyBy('locale')->map(fn (ContentPageTranslation $t): array => [
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

    /**
     * The page's title in the admin language, or in the first language that
     * has one; the slug when there is none.
     */
    public static function title(ContentPage $page): string
    {
        return (string) (Translations::pick($page->translations)?->getAttribute('title') ?? $page->slug);
    }

    /**
     * Whether the public site serves the page: published, due, and on the top
     * level (nested addresses are not routed yet).
     */
    private static function isViewable(ContentPage $page): bool
    {
        return $page->status === 'published'
            && $page->parent_id === null
            && ! self::isScheduled($page);
    }

    private static function isScheduled(ContentPage $page): bool
    {
        return $page->status === 'published'
            && $page->published_at !== null
            && $page->published_at->isFuture();
    }
}
