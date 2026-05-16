<?php

namespace App\Policies;

use App\Models\Media;
use App\Models\User;

class MediaPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('media.viewAny');
    }

    public function view(User $user, Media $media): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('media.upload');
    }

    public function delete(User $user, Media $media): bool
    {
        return $user->hasPermissionTo('media.delete');
    }
}
