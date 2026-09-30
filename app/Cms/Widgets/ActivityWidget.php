<?php

declare(strict_types=1);

namespace App\Cms\Widgets;

use App\Models\ContactRequest;
use App\Models\Post;
use App\Models\User;
use App\Support\Translations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

/**
 * «Активность», as on the WordPress dashboard: posts about to go live, the
 * latest published ones and the newest contact requests. A section the
 * viewer may not see comes as null.
 */
final class ActivityWidget implements Widget
{
    private const LIMIT = 5;

    public function key(): string
    {
        return 'activity';
    }

    public function label(): string
    {
        return 'Активность';
    }

    /**
     * Every section checks its own permission, see {@see data()}.
     */
    public function permission(): ?string
    {
        return null;
    }

    public function component(): string
    {
        return 'Activity';
    }

    /**
     * @return array{
     *     scheduled: list<array{id: int, title: string, date: string|null, can_edit: bool}>|null,
     *     published: list<array{id: int, title: string, date: string|null, can_edit: bool}>|null,
     *     contact_requests: list<array{id: int, name: string, excerpt: string, date: string|null, is_read: bool, can_view: bool}>|null,
     * }
     */
    public function data(User $user): array
    {
        $canSeePosts = $user->can('viewAny', Post::class);

        return [
            'scheduled' => $canSeePosts
                ? $this->posts(Post::query()->scheduled()->orderBy('published_at')->orderBy('id'), $user)
                : null,
            'published' => $canSeePosts
                ? $this->posts(Post::query()->published()->latest('published_at')->latest('id'), $user)
                : null,
            'contact_requests' => $user->can('viewAny', ContactRequest::class)
                ? $this->contactRequests($user)
                : null,
        ];
    }

    /**
     * @param  Builder<Post>  $query
     * @return list<array{id: int, title: string, date: string|null, can_edit: bool}>
     */
    private function posts(Builder $query, User $user): array
    {
        return $query
            ->with('translations:id,post_id,locale,title')
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Post $post): array => [
                'id' => $post->id,
                'title' => Translations::pick($post->translations)?->title ?? '(без названия)',
                'date' => $post->published_at?->toIso8601String(),
                'can_edit' => $user->can('update', $post),
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array{id: int, name: string, excerpt: string, date: string|null, is_read: bool, can_view: bool}>
     */
    private function contactRequests(User $user): array
    {
        return ContactRequest::query()
            ->latest()
            ->latest('id')
            ->limit(self::LIMIT)
            ->get(['id', 'name', 'message', 'is_read', 'created_at'])
            ->map(fn (ContactRequest $contactRequest): array => [
                'id' => $contactRequest->id,
                'name' => $contactRequest->name,
                'excerpt' => Str::limit(Str::squish((string) $contactRequest->message), 90),
                'date' => $contactRequest->created_at?->toIso8601String(),
                'is_read' => $contactRequest->is_read,
                'can_view' => $user->can('view', $contactRequest),
            ])
            ->values()
            ->all();
    }
}
