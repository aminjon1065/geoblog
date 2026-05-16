<?php

namespace App\Policies;

use App\Models\Page;
use App\Models\User;

class PagePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('pages.viewAny');
    }

    public function view(User $user, Page $page): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, Page $page): bool
    {
        return $user->hasPermissionTo('pages.update');
    }
}
