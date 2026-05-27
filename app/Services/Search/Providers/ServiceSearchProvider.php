<?php

declare(strict_types=1);

namespace App\Services\Search\Providers;

use App\Models\Service;
use App\Models\User;
use App\Services\Search\SearchProvider;

final class ServiceSearchProvider implements SearchProvider
{
    public function type(): string
    {
        return 'service';
    }

    public function label(): string
    {
        return 'Services';
    }

    public function permission(): ?string
    {
        return 'services.viewAny';
    }

    public function search(string $query, User $viewer, int $limit = 5): array
    {
        $like = "%{$query}%";

        return Service::query()
            ->with('translation')
            ->where(function ($q) use ($like) {
                $q->where('slug', 'like', $like)
                    ->orWhereHas('translations', fn ($t) => $t->where('title', 'like', $like));
            })
            ->latest('updated_at')
            ->limit($limit)
            ->get()
            ->map(fn (Service $s): array => [
                'id' => $s->id,
                'title' => $s->translation?->title ?? $s->slug,
                'subtitle' => $s->is_active ? 'active' : 'inactive',
                'url' => "/admin/services/{$s->id}/edit",
            ])
            ->all();
    }
}
