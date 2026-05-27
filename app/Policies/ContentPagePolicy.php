<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ContentPage;
use App\Models\User;

class ContentPagePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('pages.viewAny');
    }

    public function view(User $user, ContentPage $page): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('pages.create');
    }

    public function update(User $user, ContentPage $page): bool
    {
        return $user->hasPermissionTo('pages.update');
    }

    public function delete(User $user, ContentPage $page): bool
    {
        return $user->hasPermissionTo('pages.delete');
    }
}
