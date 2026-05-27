<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

/**
 * Authorisation rules for managing other application users.
 *
 * Important: `super_admin` viewers bypass these checks via Gate::before, so anywhere
 * we need a rule the super_admin must *also* obey (notably self-delete), the rule
 * lives in the controller, not here.
 */
class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('users.viewAny');
    }

    public function view(User $user, User $target): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('users.manage');
    }

    public function update(User $user, User $target): bool
    {
        if (! $user->hasPermissionTo('users.manage')) {
            return false;
        }

        // Only super_admin may edit another super_admin's record.
        if ($target->isSuperAdmin() && ! $user->isSuperAdmin()) {
            return false;
        }

        return true;
    }

    public function delete(User $user, User $target): bool
    {
        if (! $user->hasPermissionTo('users.manage')) {
            return false;
        }

        if ($target->isSuperAdmin() && ! $user->isSuperAdmin()) {
            return false;
        }

        return true;
    }

    public function resetPassword(User $user, User $target): bool
    {
        return $this->update($user, $target);
    }
}
