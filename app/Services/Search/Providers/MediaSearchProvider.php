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
        return 'Media';
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
            ->get(['id', 'name', 'original_name', 'mime_type', 'folder_id'])
            ->map(fn (Media $m): array => [
                'id' => $m->id,
                'title' => $m->name ?? $m->original_name ?? "media #{$m->id}",
                'subtitle' => $m->mime_type,
                // Media doesn't have a dedicated edit page; deep-link to the folder
                // (or root) so the admin lands close to the file.
                'url' => $m->folder_id !== null
                    ? "/admin/media?folder={$m->folder_id}"
                    : '/admin/media',
            ])
            ->all();
    }
}
