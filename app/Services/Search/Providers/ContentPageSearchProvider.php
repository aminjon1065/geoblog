<?php

declare(strict_types=1);

namespace App\Services\Search\Providers;

use App\Models\ContentPage;
use App\Models\User;
use App\Services\Search\SearchProvider;

final class ContentPageSearchProvider implements SearchProvider
{
    public function type(): string
    {
        return 'content-page';
    }

    public function label(): string
    {
        return 'Pages';
    }

    public function permission(): ?string
    {
        return 'pages.viewAny';
    }

    public function search(string $query, User $viewer, int $limit = 5): array
    {
        $like = "%{$query}%";

        return ContentPage::query()
            ->with('translation')
            ->where(function ($q) use ($like) {
                $q->where('slug', 'like', $like)
                    ->orWhereHas('translations', fn ($t) => $t->where('title', 'like', $like));
            })
            ->latest('updated_at')
            ->limit($limit)
            ->get()
            ->map(fn (ContentPage $p): array => [
                'id' => $p->id,
                'title' => $p->translation?->title ?? $p->slug,
                'subtitle' => "/{$p->slug}",
                'url' => "/admin/content-pages/{$p->id}/edit",
            ])
            ->all();
    }
}
