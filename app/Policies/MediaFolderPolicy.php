<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\MediaFolder;
use App\Models\User;

class MediaFolderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('media.viewAny');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('media-folders.manage');
    }

    public function update(User $user, MediaFolder $folder): bool
    {
        return $user->hasPermissionTo('media-folders.manage');
    }

    public function delete(User $user, MediaFolder $folder): bool
    {
        return $user->hasPermissionTo('media-folders.manage');
    }
}
