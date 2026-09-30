<?php

declare(strict_types=1);

namespace App\Cms\Widgets;

use App\Models\Post;
use App\Models\User;
use App\Support\Translations;

/**
 * «Избранные записи»: the live posts marked as featured, newest first.
 */
final class FeaturedPostsWidget implements Widget
{
    private const LIMIT = 5;

    public function key(): string
    {
        return 'featured-posts';
    }

    public function label(): string
    {
        return 'Избранные записи';
    }

    public function permission(): ?string
    {
        return 'posts.viewAny';
    }

    public function component(): string
    {
        return 'FeaturedPosts';
    }

    /**
     * @return array{posts: list<array{id: int, title: string, date: string|null, can_edit: bool}>}
     */
    public function data(User $user): array
    {
        return [
            'posts' => Post::query()
                ->published()
                ->featured()
                ->with('translations:id,post_id,locale,title')
                ->latest('published_at')
                ->latest('id')
                ->limit(self::LIMIT)
                ->get()
                ->map(fn (Post $post): array => [
                    'id' => $post->id,
                    'title' => Translations::pick($post->translations)?->title ?? '(без названия)',
                    'date' => $post->published_at?->toIso8601String(),
                    'can_edit' => $user->can('update', $post),
                ])
                ->values()
                ->all(),
        ];
    }
}
