<?php

declare(strict_types=1);

namespace App\Cms\Widgets;

use App\Models\ContactRequest;
use App\Models\User;

final class RecentContactsWidget implements Widget
{
    public function key(): string
    {
        return 'recent-contacts';
    }

    public function label(): string
    {
        return 'Recent contacts';
    }

    public function permission(): ?string
    {
        return 'contact-requests.viewAny';
    }

    public function component(): string
    {
        return 'RecentContacts';
    }

    public function data(User $user): array
    {
        return [
            'contacts' => ContactRequest::query()
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn (ContactRequest $c): array => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'email' => $c->email,
                    'is_read' => (bool) $c->is_read,
                    'created_at' => $c->created_at->diffForHumans(),
                ])
                ->all(),
        ];
    }
}
