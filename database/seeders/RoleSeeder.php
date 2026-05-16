<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    /**
     * Dotted permission catalog: {resource}.{action}[.{scope}].
     *
     * @var list<string>
     */
    public const PERMISSIONS = [
        'admin-panel.access',

        'posts.viewAny',
        'posts.create',
        'posts.update',
        'posts.update.own',
        'posts.delete',
        'posts.delete.own',
        'posts.publish',

        'categories.viewAny',
        'categories.create',
        'categories.update',
        'categories.delete',

        'tags.viewAny',
        'tags.create',
        'tags.update',
        'tags.delete',

        'pages.viewAny',
        'pages.update',

        'services.viewAny',
        'services.create',
        'services.update',
        'services.delete',

        'media.viewAny',
        'media.upload',
        'media.delete',

        'contact-requests.viewAny',
        'contact-requests.view',
        'contact-requests.delete',

        'users.viewAny',
        'users.manage',
        'roles.manage',

        'audit.viewAny',
    ];

    /**
     * Role → permissions map. `super_admin` is intentionally absent: it is granted
     * everything by Gate::before in AppServiceProvider.
     *
     * @var array<string, list<string>>
     */
    public const ROLE_PERMISSIONS = [
        'admin' => [
            'admin-panel.access',
            'posts.viewAny', 'posts.create', 'posts.update', 'posts.delete', 'posts.publish',
            'categories.viewAny', 'categories.create', 'categories.update', 'categories.delete',
            'tags.viewAny', 'tags.create', 'tags.update', 'tags.delete',
            'pages.viewAny', 'pages.update',
            'services.viewAny', 'services.create', 'services.update', 'services.delete',
            'media.viewAny', 'media.upload', 'media.delete',
            'contact-requests.viewAny', 'contact-requests.view', 'contact-requests.delete',
            'users.viewAny',
            'audit.viewAny',
        ],
        'editor' => [
            'admin-panel.access',
            'posts.viewAny', 'posts.create', 'posts.update', 'posts.delete', 'posts.publish',
            'categories.viewAny', 'categories.create', 'categories.update', 'categories.delete',
            'tags.viewAny', 'tags.create', 'tags.update', 'tags.delete',
            'pages.viewAny', 'pages.update',
            'services.viewAny', 'services.create', 'services.update', 'services.delete',
            'media.viewAny', 'media.upload', 'media.delete',
        ],
        'author' => [
            'admin-panel.access',
            'posts.viewAny', 'posts.create', 'posts.update.own', 'posts.delete.own',
            'media.viewAny', 'media.upload',
        ],
        'moderator' => [
            'admin-panel.access',
            'posts.viewAny',
            'contact-requests.viewAny', 'contact-requests.view', 'contact-requests.delete',
        ],
    ];

    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (self::PERMISSIONS as $name) {
            Permission::findOrCreate($name, 'web');
        }

        Role::findOrCreate('super_admin', 'web');

        foreach (self::ROLE_PERMISSIONS as $roleName => $permissions) {
            $role = Role::findOrCreate($roleName, 'web');
            $role->syncPermissions($permissions);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
