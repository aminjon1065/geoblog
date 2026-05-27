<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Redirect;
use App\Models\User;

class RedirectPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('redirects.manage');
    }

    public function view(User $user, Redirect $redirect): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('redirects.manage');
    }

    public function update(User $user, Redirect $redirect): bool
    {
        return $user->hasPermissionTo('redirects.manage');
    }

    public function delete(User $user, Redirect $redirect): bool
    {
        return $user->hasPermissionTo('redirects.manage');
    }
}
