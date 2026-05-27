<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Menu;
use App\Models\User;

class MenuPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('menus.viewAny');
    }

    public function view(User $user, Menu $menu): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('menus.manage');
    }

    public function update(User $user, Menu $menu): bool
    {
        return $user->hasPermissionTo('menus.manage');
    }

    public function delete(User $user, Menu $menu): bool
    {
        return $user->hasPermissionTo('menus.manage');
    }
}
