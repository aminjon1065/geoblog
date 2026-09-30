<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use App\Services\Users\RoleCatalog;

final class UserResource
{
    /**
     * Row shape for Admin\Users\Index. The `can` map drives per-row UI gating.
     *
     * @return array<string, mixed>
     */
    public static function forAdminIndex(User $user, ?User $viewer): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'email_verified' => $user->email_verified_at !== null,
            'two_factor_enabled' => $user->two_factor_confirmed_at !== null,
            'is_super_admin' => $user->isSuperAdmin(),
            'roles' => self::roles($user),
            'posts_count' => (int) ($user->posts_count ?? 0),
            'created_at' => $user->created_at?->toDateString(),
            'can' => [
                'update' => $viewer?->can('update', $user) ?? false,
                'delete' => $viewer?->can('delete', $user) ?? false,
                'reset_password' => $viewer?->can('resetPassword', $user) ?? false,
            ],
        ];
    }

    /**
     * Form payload for Admin\Users\Edit.
     *
     * @return array<string, mixed>
     */
    public static function forAdminEdit(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'email_verified' => $user->email_verified_at !== null,
            'two_factor_enabled' => $user->two_factor_confirmed_at !== null,
            'is_super_admin' => $user->isSuperAdmin(),
            'roles' => RoleCatalog::sort($user->getRoleNames()),
            'posts_count' => $user->posts()->count(),
            'created_at' => $user->created_at?->toDateString(),
        ];
    }

    /**
     * @return list<array{name: string, label: string}>
     */
    private static function roles(User $user): array
    {
        return array_map(
            fn (string $name): array => ['name' => $name, 'label' => RoleCatalog::label($name)],
            RoleCatalog::sort($user->getRoleNames()),
        );
    }
}
