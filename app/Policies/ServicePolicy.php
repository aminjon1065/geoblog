<?php

namespace App\Policies;

use App\Models\Service;
use App\Models\User;

class ServicePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('services.viewAny');
    }

    public function view(User $user, Service $service): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('services.create');
    }

    public function update(User $user, Service $service): bool
    {
        return $user->hasPermissionTo('services.update');
    }

    public function delete(User $user, Service $service): bool
    {
        return $user->hasPermissionTo('services.delete');
    }
}
