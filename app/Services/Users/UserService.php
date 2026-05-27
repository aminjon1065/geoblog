<?php

declare(strict_types=1);

namespace App\Services\Users;

use App\DataTransferObjects\Users\UserData;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\PermissionRegistrar;

/**
 * Owns the write-side lifecycle of an admin-managed user record.
 *
 * Self-protections (an admin must not lock themselves out of the panel) live in
 * the controller, not here — see `UserController::edit` / `destroy`.
 */
final class UserService
{
    public function create(UserData $data): User
    {
        return DB::transaction(function () use ($data): User {
            $user = User::create([
                'name' => $data->name,
                'email' => $data->email,
                // The `password => hashed` cast on the User model handles bcrypt hashing.
                'password' => $data->password ?? '',
            ]);

            // `email_verified_at` is intentionally not in $fillable — anyone calling
            // User::create() shouldn't be able to vouch for an email. The admin-created
            // path *is* trusted, so we set it explicitly via forceFill after the row exists.
            $user->forceFill(['email_verified_at' => now()])->save();

            $user->syncRoles($data->roleNames);
            app(PermissionRegistrar::class)->forgetCachedPermissions();

            return $user;
        });
    }

    /**
     * Update a user. Role sync skips the viewer's own record when called from the
     * admin/users edit screen; the controller decides whether to pass `$syncRoles=false`.
     */
    public function update(User $user, UserData $data, bool $syncRoles = true): User
    {
        return DB::transaction(function () use ($user, $data, $syncRoles): User {
            $attributes = [
                'name' => $data->name,
                'email' => $data->email,
            ];

            if ($data->password !== null) {
                $attributes['password'] = $data->password;
            }

            $user->update($attributes);

            if ($syncRoles) {
                $user->syncRoles($data->roleNames);
                app(PermissionRegistrar::class)->forgetCachedPermissions();
            }

            return $user;
        });
    }

    public function resetPassword(User $user, string $password): void
    {
        $user->update(['password' => $password]);
    }

    public function delete(User $user): void
    {
        $user->delete();
    }
}
