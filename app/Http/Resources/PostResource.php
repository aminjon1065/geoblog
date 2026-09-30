<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Category;
use App\Models\Media;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use App\Support\Seo\SeoBuilder;
use App\Support\Translations;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

/**
 * Surface-specific shapes for the Post model.
 *
 * One method per consumer keeps the shape next to its callsite assumptions:
 * the admin list relies on per-row authorization, the admin edit form expects
 * a locale-keyed translation map, the public surfaces drop authorship internals.
 */
final class PostResource
{
    /**
     * Row shape for the WordPress-style Admin\Posts\Index. Caller is responsible for
     * eager-loading `translations`, `author:id,name`, `categories.translations` and
     * `tags.translations`.
     *
     * @return array<string, mixed>
     */
    public static function forAdminIndex(Post $post, ?User $viewer): array
    {
        $display = Translations::pick($post->translations);

        return [
            'id' => $post->id,
            'slug' => $post->slug,
            'status' => $post->status,
            'is_featured' => (bool) $post->is_featured,
            // Virtual "scheduled" status — status is still "published" in the DB so
            // the public scope keeps it hidden until published_at arrives.
            'is_scheduled' => $post->isScheduled(),
            'is_live' => $post->isLive(),
            'published_at' => $post->published_at?->toIso8601String(),
            'created_at' => $post->created_at?->toIso8601String(),
            'updated_at' => $post->updated_at?->toIso8601String(),
            'deleted_at' => $post->deleted_at?->toIso8601String(),
            'title' => $display?->title,
            'title_locale' => $display?->locale,
            'locales' => $post->translations->pluck('locale')->values()->all(),
            'author' => $post->author?->name,
            'author_id' => $post->author_id,
            'categories' => $post->categories->map(fn (Category $category): array => [
                'id' => $category->id,
                'name' => Translations::pick($category->translations)?->name ?? $category->slug,
            ])->values()->all(),
            'tags' => $post->tags->map(fn (Tag $tag): array => [
                'id' => $tag->id,
                'name' => Translations::pick($tag->translations)?->name ?? $tag->slug,
            ])->values()->all(),
            'public_url' => self::publicUrl($post, $display?->locale),
            'can' => [
                'update' => $viewer?->can('update', $post) ?? false,
                'delete' => $viewer?->can('delete', $post) ?? false,
                'restore' => $viewer?->can('restore', $post) ?? false,
                'force_delete' => $viewer?->can('forceDelete', $post) ?? false,
            ],
        ];
    }

    /**
     * Form payload for the post editor. Caller is responsible for eager-loading
     * `translations`, `categories`, `tags`, `author:id,name` and `ogImage`.
     *
     * @return array<string, mixed>
     */
    public static function forAdminEdit(Post $post): array
    {
        $display = Translations::pick($post->translations);

        return [
            'id' => $post->id,
            'slug' => $post->slug,
            'status' => $post->status,
            'is_featured' => (bool) $post->is_featured,
            'is_scheduled' => $post->isScheduled(),
            'is_live' => $post->isLive(),
            'og_image_id' => $post->og_image_id,
            'og_image' => $post->ogImage instanceof Media ? MediaPickerResource::make($post->ogImage) : null,
            'published_at' => $post->published_at?->toIso8601String(),
            'created_at' => $post->created_at?->toIso8601String(),
            'updated_at' => $post->updated_at?->toIso8601String(),
            'author' => $post->author?->name,
            'translations' => $post->translations->keyBy('locale')->map(fn ($t) => [
                'title' => $t->title,
                'excerpt' => $t->excerpt,
                'content' => $t->content,
                'reading_time_minutes' => $t->reading_time_minutes,
                'meta_title' => $t->meta_title,
                'meta_description' => $t->meta_description,
            ]),
            'category_ids' => $post->categories->pluck('id'),
            'tag_ids' => $post->tags->pluck('id'),
            'public_url' => self::publicUrl($post, $display?->locale),
            'preview_url' => self::previewUrl($post, $display?->locale),
        ];
    }

    /**
     * A signed, day-long link that shows a draft or scheduled post on the site
     * itself, the way WordPress' "Предпросмотр" does.
     */
    public static function previewUrl(Post $post, ?string $locale): ?string
    {
        if ($locale === null || $post->trashed()) {
            return null;
        }

        return URL::temporarySignedRoute(
            'news.show',
            now()->addDay(),
            ['locale' => $locale, 'slug' => $post->slug, 'preview' => 1],
        );
    }

    /**
     * Where the post lives on the site, once it is live.
     */
    public static function publicUrl(Post $post, ?string $locale): ?string
    {
        if ($locale === null || ! $post->isLive() || $post->trashed()) {
            return null;
        }

        return route('news.show', ['locale' => $locale, 'slug' => $post->slug]);
    }

    /**
     * Card shape for Public\News\Index. Caller is responsible for eager-loading
     * `translation`, `categories.translation`, and `tags.translation`.
     *
     * @return array<string, mixed>
     */
    public static function forPublicCard(Post $post): array
    {
        return [
            'id' => $post->id,
            'slug' => $post->slug,
            'published_at' => $post->published_at?->toDateString(),
            'title' => $post->translation?->title,
            'excerpt' => $post->translation?->excerpt,
            'is_featured' => (bool) $post->is_featured,
            'reading_time' => $post->translation?->reading_time_minutes,
            'categories' => $post->categories->map(fn ($cat) => [
                'slug' => $cat->slug,
                'name' => $cat->translation?->name,
            ]),
            'tags' => $post->tags->map(fn ($tag) => [
                'slug' => $tag->slug,
                'name' => $tag->translation?->name,
            ]),
        ];
    }

    /**
     * Detail shape for Public\News\Show. Caller is responsible for eager-loading
     * `translation`, `categories.translation`, `tags.translation`, and `author:id,name`.
     *
     * @return array<string, mixed>
     */
    public static function forPublicShow(Post $post, Request $request): array
    {
        // Per-post share image takes precedence over the site-wide fallback.
        $ogImage = self::ogImageUrl($post) ?? SeoBuilder::defaultImage($request);

        return [
            'id' => $post->id,
            'slug' => $post->slug,
            'published_at' => $post->published_at?->toDateString(),
            'title' => $post->translation?->title,
            'content' => $post->translation?->content,
            'reading_time' => $post->translation?->reading_time_minutes,
            'cover' => self::cover($post),
            'meta' => [
                'title' => $post->translation?->meta_title ?? $post->translation?->title,
                'description' => $post->translation?->meta_description ?? $post->translation?->excerpt,
                'image' => $ogImage,
            ],
            'author' => $post->author?->name,
            'categories' => $post->categories->map(fn ($cat) => [
                'slug' => $cat->slug,
                'name' => $cat->translation?->name,
            ]),
            'tags' => $post->tags->map(fn ($tag) => [
                'slug' => $tag->slug,
                'name' => $tag->translation?->name,
            ]),
        ];
    }

    /**
     * The featured image shown under the article's title, or null.
     *
     * @return array{url: string, alt: string, caption: string|null, width: int|null, height: int|null}|null
     */
    public static function cover(Post $post): ?array
    {
        $media = $post->relationLoaded('ogImage') ? $post->ogImage : $post->ogImage()->first();

        if (! $media instanceof Media || ! str_starts_with($media->mime_type, 'image/')) {
            return null;
        }

        $url = self::ogImageUrl($post);

        if ($url === null) {
            return null;
        }

        return [
            'url' => $url,
            'alt' => (string) ($media->alt ?? ''),
            'caption' => $media->caption,
            'width' => $media->width,
            'height' => $media->height,
        ];
    }

    /**
     * Resolve a Post's per-post og_image to an absolute URL, or null when none set
     * or the underlying file disappeared.
     */
    public static function ogImageUrl(Post $post): ?string
    {
        $media = $post->relationLoaded('ogImage') ? $post->ogImage : $post->ogImage()->first();
        if (! $media instanceof Media) {
            return null;
        }

        try {
            return Storage::disk($media->disk)->url($media->path);
        } catch (\Throwable) {
            return null;
        }
    }
}
