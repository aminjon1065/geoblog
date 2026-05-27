<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Media;
use App\Models\Post;
use App\Models\User;
use App\Support\Seo\SeoBuilder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
     * Row shape for Admin\Posts\Index. Caller is responsible for eager-loading
     * `translation`, `author:id,name`, and `categories.translation`.
     *
     * @return array<string, mixed>
     */
    public static function forAdminIndex(Post $post, ?User $viewer): array
    {
        return [
            'id' => $post->id,
            'slug' => $post->slug,
            'status' => $post->status,
            'is_featured' => (bool) $post->is_featured,
            // Virtual "scheduled" status — status is still "published" in the DB so
            // the public scope keeps it hidden until published_at arrives.
            'is_scheduled' => $post->status === 'published'
                && $post->published_at !== null
                && $post->published_at->isFuture(),
            'published_at' => $post->published_at?->toDateString(),
            'title' => $post->translation?->title,
            'author' => $post->author?->name,
            'author_id' => $post->author_id,
            'categories' => $post->categories->map(fn ($c) => $c->translation?->name),
            'can' => [
                'update' => $viewer?->can('update', $post) ?? false,
                'delete' => $viewer?->can('delete', $post) ?? false,
            ],
        ];
    }

    /**
     * Form payload for Admin\Posts\Edit. Caller is responsible for eager-loading
     * `translations`, `categories`, and `tags`.
     *
     * @return array<string, mixed>
     */
    public static function forAdminEdit(Post $post): array
    {
        return [
            'id' => $post->id,
            'slug' => $post->slug,
            'status' => $post->status,
            'is_featured' => (bool) $post->is_featured,
            'og_image_id' => $post->og_image_id,
            'published_at' => $post->published_at?->format('Y-m-d'),
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
        ];
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
