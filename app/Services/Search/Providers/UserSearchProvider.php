<?php

declare(strict_types=1);

namespace App\Services\Search\Providers;

use App\Models\User;
use App\Services\Search\SearchProvider;

final class UserSearchProvider implements SearchProvider
{
    public function type(): string
    {
        return 'user';
    }

    public function label(): string
    {
        return 'Users';
    }

    public function permission(): ?string
    {
        return 'users.viewAny';
    }

    public function search(string $query, User $viewer, int $limit = 5): array
    {
        $like = "%{$query}%";

        return User::query()
            ->whereKeyNot($viewer->id)
            ->where(function ($q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like);
            })
            ->limit($limit)
            ->get(['id', 'name', 'email'])
            ->map(fn (User $u): array => [
                'id' => $u->id,
                'title' => $u->name,
                'subtitle' => $u->email,
                'url' => "/admin/users/{$u->id}/edit",
            ])
            ->all();
    }
}
