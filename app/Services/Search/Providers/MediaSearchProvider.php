<?php

declare(strict_types=1);

namespace App\Services\Search\Providers;

use App\Models\Media;
use App\Models\User;
use App\Services\Search\SearchProvider;

final class MediaSearchProvider implements SearchProvider
{
    public function type(): string
    {
        return 'media';
    }

    public function label(): string
    {
        return 'Медиафайлы';
    }

    public function permission(): ?string
    {
        return 'media.viewAny';
    }

    public function search(string $query, User $viewer, int $limit = 5): array
    {
        $like = "%{$query}%";

        return Media::query()
            ->where(function ($q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('original_name', 'like', $like)
                    ->orWhere('alt', 'like', $like);
            })
            ->latest()
            ->limit($limit)
            ->get(['id', 'name', 'original_name', 'mime_type'])
            ->map(fn (Media $m): array => [
                'id' => $m->id,
                'title' => $m->name ?? $m->original_name ?? "Медиафайл #{$m->id}",
                'subtitle' => $m->mime_type,
                // The library opens «Параметры вложения» for `?item=`.
                'url' => "/admin/media?item={$m->id}",
            ])
            ->all();
    }
}
