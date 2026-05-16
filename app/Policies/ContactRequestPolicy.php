<?php

namespace App\Policies;

use App\Models\ContactRequest;
use App\Models\User;

class ContactRequestPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('contact-requests.viewAny');
    }

    public function view(User $user, ContactRequest $contactRequest): bool
    {
        return $user->hasPermissionTo('contact-requests.view');
    }

    public function delete(User $user, ContactRequest $contactRequest): bool
    {
        return $user->hasPermissionTo('contact-requests.delete');
    }
}
