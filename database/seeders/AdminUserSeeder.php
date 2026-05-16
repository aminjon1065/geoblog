<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Bootstrap one user per role so local/QA environments can exercise RBAC immediately.
     * In production, only the super_admin should be retained; rotate the password.
     */
    public function run(): void
    {
        $bootstrap = [
            ['admin@geoblog.test', 'Administrator', 'super_admin'],
            ['editor@geoblog.test', 'Editor', 'editor'],
            ['author@geoblog.test', 'Author', 'author'],
            ['moderator@geoblog.test', 'Moderator', 'moderator'],
        ];

        foreach ($bootstrap as [$email, $name, $role]) {
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ]
            );

            $user->syncRoles([$role]);
        }
    }
}
