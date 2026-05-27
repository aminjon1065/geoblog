<?php

declare(strict_types=1);

namespace App\Cms\Widgets;

use App\Models\User;
use Spatie\Activitylog\Models\Activity;

final class RecentActivityWidget implements Widget
{
    public function key(): string
    {
        return 'recent-activity';
    }

    public function label(): string
    {
        return 'Recent activity';
    }

    public function permission(): ?string
    {
        return 'audit.viewAny';
    }

    public function component(): string
    {
        return 'RecentActivity';
    }

    public function data(User $user): array
    {
        return [
            'activities' => Activity::query()
                ->with('causer:id,name')
                ->latest('id')
                ->limit(8)
                ->get()
                ->map(fn (Activity $a): array => [
                    'id' => $a->id,
                    'log_name' => $a->log_name,
                    'event' => $a->event,
                    'description' => $a->description,
                    'subject_type' => $a->subject_type !== null
                        ? class_basename($a->subject_type)
                        : null,
                    'causer' => $a->causer?->name,
                    'created_at' => $a->created_at?->diffForHumans(),
                ])
                ->all(),
        ];
    }
}
