<?php

declare(strict_types=1);

namespace App\Services\Search\Providers;

use App\Models\Category;
use App\Models\User;
use App\Services\Search\SearchProvider;

final class CategorySearchProvider implements SearchProvider
{
    public function type(): string
    {
        return 'category';
    }

    public function label(): string
    {
        return 'Categories';
    }

    public function permission(): ?string
    {
        return 'categories.viewAny';
    }

    public function search(string $query, User $viewer, int $limit = 5): array
    {
        $like = "%{$query}%";

        return Category::query()
            ->with('translation')
            ->where(function ($q) use ($like) {
                $q->where('slug', 'like', $like)
                    ->orWhereHas('translations', fn ($t) => $t->where('name', 'like', $like));
            })
            ->orderBy('sort_order')
            ->limit($limit)
            ->get()
            ->map(fn (Category $c): array => [
                'id' => $c->id,
                'title' => $c->translation?->name ?? $c->slug,
                'subtitle' => $c->slug,
                'url' => "/admin/categories/{$c->id}/edit",
            ])
            ->all();
    }
}
