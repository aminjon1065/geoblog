<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $admin = Role::firstOrCreate(['name' => 'admin']);
        $editor = Role::firstOrCreate(['name' => 'editor']);

        $permissions = [
            'manage posts',
            'manage categories',
            'manage tags',
            'manage pages',
        ];

        foreach ($permissions as $perm) {
            $permission = Permission::firstOrCreate(['name' => $perm]);
            $admin->givePermissionTo($permission);
        }
    }
}
