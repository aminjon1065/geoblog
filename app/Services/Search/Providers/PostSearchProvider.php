<?php

declare(strict_types=1);

namespace App\Services\Search\Providers;

use App\Models\Post;
use App\Models\User;
use App\Services\Search\SearchProvider;

final class PostSearchProvider implements SearchProvider
{
    public function type(): string
    {
        return 'post';
    }

    public function label(): string
    {
        return 'Posts';
    }

    public function permission(): ?string
    {
        return 'posts.viewAny';
    }

    public function search(string $query, User $viewer, int $limit = 5): array
    {
        $like = "%{$query}%";

        return Post::query()
            ->with('translation')
            ->where(function ($q) use ($like) {
                $q->where('slug', 'like', $like)
                    ->orWhereHas('translations', fn ($t) => $t->where('title', 'like', $like)
                        ->orWhere('excerpt', 'like', $like));
            })
            ->latest()
            ->limit($limit)
            ->get()
            ->map(fn (Post $p): array => [
                'id' => $p->id,
                'title' => $p->translation?->title ?? $p->slug,
                'subtitle' => $p->status,
                'url' => "/admin/posts/{$p->id}/edit",
            ])
            ->all();
    }
}
