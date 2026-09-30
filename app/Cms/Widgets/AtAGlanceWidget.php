<?php

declare(strict_types=1);

namespace App\Cms\Widgets;

use App\Models\Category;
use App\Models\ContactRequest;
use App\Models\ContentPage;
use App\Models\Media;
use App\Models\Post;
use App\Models\Service;
use App\Models\Tag;
use App\Models\User;

/**
 * «На виду» (WordPress' "At a Glance"): how much content the site has —
 * only the kinds the viewer may open — and the posts waiting for work.
 */
final class AtAGlanceWidget implements Widget
{
    public function key(): string
    {
        return 'at-a-glance';
    }

    public function label(): string
    {
        return 'На виду';
    }

    public function permission(): ?string
    {
        return null;
    }

    public function component(): string
    {
        return 'AtAGlance';
    }

    /**
     * @return array{
     *     items: list<array{key: string, count: int, unread?: int}>,
     *     posts: array{drafts: int, pending: int, scheduled: int}|null,
     * }
     */
    public function data(User $user): array
    {
        $canSeePosts = $user->can('viewAny', Post::class);
        $items = [];

        if ($canSeePosts) {
            $items[] = ['key' => 'posts', 'count' => Post::query()->published()->count()];
        }

        if ($user->can('viewAny', ContentPage::class)) {
            $items[] = ['key' => 'pages', 'count' => ContentPage::query()->published()->count()];
        }

        if ($user->can('viewAny', Service::class)) {
            $items[] = ['key' => 'services', 'count' => Service::query()->where('is_active', true)->count()];
        }

        if ($user->can('viewAny', Category::class)) {
            $items[] = ['key' => 'categories', 'count' => Category::query()->count()];
        }

        if ($user->can('viewAny', Tag::class)) {
            $items[] = ['key' => 'tags', 'count' => Tag::query()->count()];
        }

        if ($user->can('viewAny', Media::class)) {
            $items[] = ['key' => 'media', 'count' => Media::query()->count()];
        }

        if ($user->can('viewAny', ContactRequest::class)) {
            $items[] = [
                'key' => 'contact_requests',
                'count' => ContactRequest::query()->count(),
                'unread' => ContactRequest::query()->where('is_read', false)->count(),
            ];
        }

        return [
            'items' => $items,
            'posts' => $canSeePosts ? [
                'drafts' => Post::query()->where('status', Post::STATUS_DRAFT)->count(),
                'pending' => Post::query()->where('status', Post::STATUS_PENDING)->count(),
                'scheduled' => Post::query()->scheduled()->count(),
            ] : null,
        ];
    }
}
