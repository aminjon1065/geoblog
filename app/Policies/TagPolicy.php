<?php

namespace App\Policies;

use App\Models\Tag;
use App\Models\User;

class TagPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('tags.viewAny');
    }

    public function view(User $user, Tag $tag): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('tags.create');
    }

    public function update(User $user, Tag $tag): bool
    {
        return $user->hasPermissionTo('tags.update');
    }

    public function delete(User $user, Tag $tag): bool
    {
        return $user->hasPermissionTo('tags.delete');
    }
}
