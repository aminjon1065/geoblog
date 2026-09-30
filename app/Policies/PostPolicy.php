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

    /**
     * Without the publish permission a published (or scheduled) post is out
     * of reach: otherwise its author could change live text that nobody
     * reviewed — WordPress' contributors can't edit published posts either.
     */
    public function update(User $user, Post $post): bool
    {
        if ($post->status === Post::STATUS_PUBLISHED && ! $this->publish($user)) {
            return false;
        }

        if ($user->hasPermissionTo('posts.update')) {
            return true;
        }

        return $user->hasPermissionTo('posts.update.own')
            && $post->author_id === $user->id;
    }

    /**
     * Taking a published post off the site is a publishing decision too.
     */
    public function delete(User $user, Post $post): bool
    {
        if ($post->status === Post::STATUS_PUBLISHED && ! $this->publish($user)) {
            return false;
        }

        if ($user->hasPermissionTo('posts.delete')) {
            return true;
        }

        return $user->hasPermissionTo('posts.delete.own')
            && $post->author_id === $user->id;
    }

    public function restore(User $user, Post $post): bool
    {
        return $this->delete($user, $post);
    }

    public function forceDelete(User $user, Post $post): bool
    {
        return $this->delete($user, $post);
    }

    public function publish(User $user): bool
    {
        return $user->hasPermissionTo('posts.publish');
    }
}
