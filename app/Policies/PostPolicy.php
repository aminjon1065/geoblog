<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('posts.viewAny');
    }

    public function view(User $user, Post $post): bool
    {
        return $this->viewAny($user);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('posts.create');
    }

    public function update(User $user, Post $post): bool
    {
        if ($user->hasPermissionTo('posts.update')) {
            return true;
        }

        return $user->hasPermissionTo('posts.update.own')
            && $post->author_id === $user->id;
    }

    public function delete(User $user, Post $post): bool
    {
        if ($user->hasPermissionTo('posts.delete')) {
            return true;
        }

        return $user->hasPermissionTo('posts.delete.own')
            && $post->author_id === $user->id;
    }

    public function publish(User $user): bool
    {
        return $user->hasPermissionTo('posts.publish');
    }
}
