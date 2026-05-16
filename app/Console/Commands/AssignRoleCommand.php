<?php

namespace App\Console\Commands;

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;

class AssignRoleCommand extends Command
{
    protected $signature = 'app:assign-role {email : The user email} {role : Role name (super_admin, admin, editor, author, moderator)} {--sync : Replace all existing roles instead of adding}';

    protected $description = 'Assign a role to an existing user. Useful for bootstrapping after public registration is disabled.';

    public function handle(): int
    {
        $email = $this->argument('email');
        $role = $this->argument('role');

        $user = User::where('email', $email)->first();

        if ($user === null) {
            $this->error("No user found with email {$email}.");

            return self::FAILURE;
        }

        $validRoles = array_merge(['super_admin'], array_keys(RoleSeeder::ROLE_PERMISSIONS));

        if (! in_array($role, $validRoles, true)) {
            $this->error('Unknown role. Valid roles: '.implode(', ', $validRoles));

            return self::FAILURE;
        }

        if (Role::where('name', $role)->doesntExist()) {
            $this->error("Role '{$role}' is not seeded. Run: php artisan db:seed --class=RoleSeeder");

            return self::FAILURE;
        }

        if ($this->option('sync')) {
            $user->syncRoles([$role]);
            $this->info("Roles for {$email} replaced with: {$role}");
        } else {
            $user->assignRole($role);
            $this->info("Role '{$role}' added to {$email}.");
        }

        return self::SUCCESS;
    }
}
