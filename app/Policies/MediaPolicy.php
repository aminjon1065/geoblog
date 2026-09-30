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

    public function update(User $user, Media $media): bool
    {
        return $user->hasPermissionTo('media.update');
    }

    /**
     * Gate of the bulk "Удалить навсегда": whoever passes it still needs
     * {@see self::delete()} for every file of the batch.
     */
    public function deleteAny(User $user): bool
    {
        return $user->hasPermissionTo('media.delete');
    }

    public function delete(User $user, Media $media): bool
    {
        return $user->hasPermissionTo('media.delete');
    }
}
