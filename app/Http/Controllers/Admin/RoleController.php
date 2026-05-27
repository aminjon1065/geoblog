<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateRolePermissionsRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Role permission editor.
 *
 * Roles themselves are immutable from the UI (created/destroyed only through the
 * RoleSeeder); the editor just rewires permission membership. The `super_admin`
 * role is exposed read-only because Gate::before makes its actual permission set
 * irrelevant — editing it would be a confusing UX with no observable effect.
 */
class RoleController extends Controller implements HasMiddleware
{
    private const SUPER_ADMIN_ROLE = 'super_admin';

    public static function middleware(): array
    {
        return [
            new Middleware('can:roles.manage'),
        ];
    }

    public function index(): Response
    {
        return Inertia::render('Admin/Roles/Index', [
            'roles' => Role::query()
                ->withCount(['permissions', 'users'])
                ->orderBy('name')
                ->get()
                ->map(fn (Role $role): array => [
                    'id' => $role->id,
                    'name' => $role->name,
                    'is_super_admin' => $role->name === self::SUPER_ADMIN_ROLE,
                    'permissions_count' => $role->permissions_count,
                    'users_count' => $role->users_count,
                ]),
        ]);
    }

    public function edit(Role $role): Response
    {
        $role->load('permissions:id,name');

        $permissionNames = Permission::query()
            ->orderBy('name')
            ->pluck('name')
            ->all();

        return Inertia::render('Admin/Roles/Edit', [
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'is_super_admin' => $role->name === self::SUPER_ADMIN_ROLE,
                'permissions' => $role->permissions->pluck('name')->all(),
            ],
            'permissionGroups' => $this->groupPermissions($permissionNames),
        ]);
    }

    public function update(UpdateRolePermissionsRequest $request, Role $role): RedirectResponse
    {
        // Editing super_admin's permission set would suggest control we don't actually
        // have — Gate::before short-circuits its checks regardless of row contents.
        abort_if(
            $role->name === self::SUPER_ADMIN_ROLE,
            403,
            'The super_admin role is managed implicitly and cannot be edited here.',
        );

        /** @var list<string> $permissions */
        $permissions = (array) ($request->validated('permissions', []) ?? []);

        $role->syncPermissions($permissions);

        // Spatie caches the permission map per request; clear it now so the very
        // next request reflects the change rather than a stale snapshot.
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return to_route('admin.roles.edit', $role)->with('success', 'Role permissions updated.');
    }

    /**
     * Group permission names by the prefix before the first dot, e.g. `posts.create`
     * and `posts.update` go under the `posts` heading. Helps the admin reason about
     * a long flat list.
     *
     * @param  list<string>  $names
     * @return list<array{group: string, permissions: list<string>}>
     */
    private function groupPermissions(array $names): array
    {
        $grouped = [];

        foreach ($names as $name) {
            $segment = explode('.', $name, 2)[0];
            $grouped[$segment] ??= [];
            $grouped[$segment][] = $name;
        }

        ksort($grouped);

        $out = [];
        foreach ($grouped as $group => $permissions) {
            sort($permissions);
            $out[] = ['group' => $group, 'permissions' => $permissions];
        }

        return $out;
    }
}
