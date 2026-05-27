<?php

declare(strict_types=1);

namespace App\Cms\Widgets;

use App\Models\Post;
use App\Models\User;

final class FeaturedPostsWidget implements Widget
{
    public function key(): string
    {
        return 'featured-posts';
    }

    public function label(): string
    {
        return 'Featured posts';
    }

    public function permission(): ?string
    {
        return 'posts.viewAny';
    }

    public function component(): string
    {
        return 'FeaturedPosts';
    }

    public function data(User $user): array
    {
        return [
            'posts' => Post::query()
                ->published()
                ->featured()
                ->with('translation')
                ->latest('published_at')
                ->limit(5)
                ->get()
                ->map(fn (Post $p): array => [
                    'id' => $p->id,
                    'title' => $p->translation?->title ?? $p->slug,
                    'published_at' => $p->published_at?->toDateString(),
                ])
                ->all(),
        ];
    }
}
