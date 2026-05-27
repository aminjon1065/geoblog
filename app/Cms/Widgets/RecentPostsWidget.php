<?php

declare(strict_types=1);

namespace App\Cms\Widgets;

use App\Models\Post;
use App\Models\User;

final class RecentPostsWidget implements Widget
{
    public function key(): string
    {
        return 'recent-posts';
    }

    public function label(): string
    {
        return 'Recent posts';
    }

    public function permission(): ?string
    {
        return 'posts.viewAny';
    }

    public function component(): string
    {
        return 'RecentPosts';
    }

    public function data(User $user): array
    {
        return [
            'posts' => Post::query()
                ->with(['translation', 'author:id,name'])
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn (Post $p): array => [
                    'id' => $p->id,
                    'title' => $p->translation?->title ?? $p->slug,
                    'status' => $p->status,
                    'author' => $p->author?->name,
                    'created_at' => $p->created_at->diffForHumans(),
                ])
                ->all(),
        ];
    }
}
