<?php

declare(strict_types=1);

namespace App\Services\Users;

use App\Models\User;
use Illuminate\Support\Facades\Lang;
use Spatie\Permission\Models\Role;

/**
 * How the admin panel names the Spatie roles and permissions, and which roles
 * a given user may hand out.
 *
 * The roles themselves live in the database (RoleSeeder); display names come
 * from lang/ru/roles.php and fall back to the machine name.
 */
final class RoleCatalog
{
    public const SUPER_ADMIN = 'super_admin';

    /**
     * Roles in the order the admin panel lists them: the most powerful first.
     * Roles missing here are appended alphabetically.
     */
    private const DISPLAY_ORDER = ['super_admin', 'admin', 'editor', 'author', 'moderator'];

    public static function label(string $role): string
    {
        return self::translated("roles.names.{$role}") ?? $role;
    }

    public static function description(string $role): ?string
    {
        return self::translated("roles.descriptions.{$role}");
    }

    public static function groupLabel(string $group): string
    {
        return self::translated("roles.groups.{$group}") ?? $group;
    }

    public static function permissionLabel(string $permission): string
    {
        return self::permissionLabels()[$permission] ?? $permission;
    }

    /**
     * Role names, the most powerful first.
     *
     * @param  iterable<string>  $names
     * @return list<string>
     */
    public static function sort(iterable $names): array
    {
        return self::sortBy($names, self::DISPLAY_ORDER);
    }

    /**
     * Permission names in the order the translation file lists them — grouped
     * the way the admin menu is, "view" before "create" before "delete".
     *
     * @param  iterable<string>  $names
     * @return list<string>
     */
    public static function sortPermissions(iterable $names): array
    {
        return self::sortBy($names, array_keys(self::permissionLabels()));
    }

    /**
     * Permission names contain dots, so they can't be addressed through a
     * dotted translation key — read the whole map instead.
     *
     * @return array<string, string>
     */
    private static function permissionLabels(): array
    {
        $labels = trans('roles.permissions');

        return is_array($labels) ? $labels : [];
    }

    /**
     * Unique values ordered by their position in `$order`; values missing
     * from it go last, alphabetically.
     *
     * @param  iterable<string>  $values
     * @param  list<string>  $order
     * @return list<string>
     */
    private static function sortBy(iterable $values, array $order): array
    {
        $positions = array_flip($order);
        $unique = [];

        foreach ($values as $value) {
            $unique[$value] = $value;
        }

        $sorted = array_values($unique);

        usort($sorted, function (string $a, string $b) use ($positions): int {
            $positionA = $positions[$a] ?? null;
            $positionB = $positions[$b] ?? null;

            if ($positionA === null || $positionB === null) {
                return [$positionA === null, $a] <=> [$positionB === null, $b];
            }

            return $positionA <=> $positionB;
        });

        return $sorted;
    }

    /**
     * Roles the actor may grant or revoke. The super_admin role bypasses every
     * permission check (Gate::before), so only a super_admin may hand it out.
     *
     * @return list<string>
     */
    public static function assignableBy(User $actor): array
    {
        $names = Role::query()->pluck('name')->all();

        if (! $actor->isSuperAdmin()) {
            $names = array_filter($names, fn (string $name): bool => $name !== self::SUPER_ADMIN);
        }

        return self::sort($names);
    }

    /**
     * Picker options for the given role names, in display order.
     *
     * @param  iterable<string>  $names
     * @return list<array{name: string, label: string, description: string|null}>
     */
    public static function options(iterable $names): array
    {
        return array_map(
            fn (string $name): array => [
                'name' => $name,
                'label' => self::label($name),
                'description' => self::description($name),
            ],
            self::sort($names),
        );
    }

    private static function translated(string $key): ?string
    {
        return Lang::has($key) ? (string) __($key) : null;
    }
}
