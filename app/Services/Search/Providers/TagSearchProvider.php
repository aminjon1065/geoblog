<?php

declare(strict_types=1);

namespace App\Services\Search\Providers;

use App\Models\Tag;
use App\Models\User;
use App\Services\Search\SearchProvider;

final class TagSearchProvider implements SearchProvider
{
    public function type(): string
    {
        return 'tag';
    }

    public function label(): string
    {
        return 'Tags';
    }

    public function permission(): ?string
    {
        return 'tags.viewAny';
    }

    public function search(string $query, User $viewer, int $limit = 5): array
    {
        $like = "%{$query}%";

        return Tag::query()
            ->with('translation')
            ->where(function ($q) use ($like) {
                $q->where('slug', 'like', $like)
                    ->orWhereHas('translations', fn ($t) => $t->where('name', 'like', $like));
            })
            ->limit($limit)
            ->get()
            ->map(fn (Tag $t): array => [
                'id' => $t->id,
                'title' => $t->translation?->name ?? $t->slug,
                'subtitle' => $t->slug,
                'url' => "/admin/tags/{$t->id}/edit",
            ])
            ->all();
    }
}
