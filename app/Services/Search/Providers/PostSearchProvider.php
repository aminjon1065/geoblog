<?php

declare(strict_types=1);

namespace App\Services\Search\Providers;

use App\Models\Post;
use App\Models\User;
use App\Services\Search\SearchProvider;

final class PostSearchProvider implements SearchProvider
{
    /** @var array<string, string> */
    private const STATUS_LABELS = [
        Post::STATUS_DRAFT => 'Черновик',
        Post::STATUS_PENDING => 'На утверждении',
        Post::STATUS_PUBLISHED => 'Опубликовано',
        Post::STATUS_ARCHIVED => 'В архиве',
    ];

    public function type(): string
    {
        return 'post';
    }

    public function label(): string
    {
        return 'Записи';
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
                'subtitle' => self::STATUS_LABELS[$p->status] ?? $p->status,
                'url' => "/admin/posts/{$p->id}/edit",
            ])
            ->all();
    }
}
