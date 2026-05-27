<?php

declare(strict_types=1);

namespace App\Services\Notifications;

use App\Models\User;
use Spatie\Activitylog\Models\Activity;

/**
 * Read-marker style notification system.
 *
 * Unread count = activity_log rows newer than `users.notifications_read_at`,
 * filtered to admin-relevant log_names (so the bell doesn't blow up from
 * mundane edits the viewer themselves performed).
 */
final class NotificationService
{
    /**
     * Log names that are surfaced as "notifications" in the admin bell. Updates to
     * settings/audit/etc. are deliberately omitted — those events exist for the
     * audit trail, not as actionable user-facing notifications.
     *
     * @var list<string>
     */
    public const NOTIFIABLE_LOGS = [
        'contact-request',
        'post',
        'content-page',
        'user',
        'auth',
    ];

    public function unreadCount(User $user): int
    {
        return $this->unreadQuery($user)->count();
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function recent(User $user, int $limit = 10): array
    {
        return $this->unreadQuery($user)
            ->latest('id')
            ->limit($limit)
            ->with('causer:id,name,email')
            ->get()
            ->map(fn (Activity $a): array => [
                'id' => $a->id,
                'log_name' => $a->log_name,
                'event' => $a->event,
                'description' => $a->description,
                'subject_type' => $a->subject_type !== null ? class_basename($a->subject_type) : null,
                'subject_id' => $a->subject_id,
                'causer_name' => $a->causer?->name,
                'created_at' => $a->created_at?->toIso8601String(),
            ])
            ->all();
    }

    public function markAllRead(User $user): void
    {
        $user->forceFill(['notifications_read_at' => now()])->save();
    }

    /**
     * Activities not yet read by this user. Excludes:
     *  - events the user themselves caused (self-notifying is noise)
     *  - events without a causer (system/seed-driven rows aren't notifications)
     *
     * @return \Illuminate\Database\Eloquent\Builder<Activity>
     */
    private function unreadQuery(User $user): \Illuminate\Database\Eloquent\Builder
    {
        $marker = $user->notifications_read_at;

        return Activity::query()
            ->whereIn('log_name', self::NOTIFIABLE_LOGS)
            ->whereNotNull('causer_id')
            ->where(function ($q) use ($user) {
                $q->where('causer_type', '!=', $user->getMorphClass())
                    ->orWhere('causer_id', '!=', $user->id);
            })
            ->when($marker !== null, fn ($q) => $q->where('created_at', '>', $marker));
    }
}
