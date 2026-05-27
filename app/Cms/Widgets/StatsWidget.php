<?php

declare(strict_types=1);

namespace App\Cms\Widgets;

use App\Models\Category;
use App\Models\ContactRequest;
use App\Models\Post;
use App\Models\Service;
use App\Models\Tag;
use App\Models\User;

final class StatsWidget implements Widget
{
    public function key(): string
    {
        return 'stats';
    }

    public function label(): string
    {
        return 'Stats';
    }

    public function permission(): ?string
    {
        return null;
    }

    public function component(): string
    {
        return 'Stats';
    }

    public function data(User $user): array
    {
        return [
            'totalPosts' => Post::count(),
            'publishedPosts' => Post::where('status', 'published')->count(),
            'draftPosts' => Post::where('status', 'draft')->count(),
            'totalCategories' => Category::count(),
            'totalTags' => Tag::count(),
            'totalServices' => Service::count(),
            'unreadContacts' => ContactRequest::where('is_read', false)->count(),
        ];
    }
}
