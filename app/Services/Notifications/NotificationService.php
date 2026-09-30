<?php

declare(strict_types=1);

namespace App\Services\Notifications;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Spatie\Activitylog\Models\Activity;

/**
 * Read-marker style notification system.
 *
 * Unread count = activity_log rows newer than `users.notifications_read_at`,
 * filtered to admin-relevant log_names the viewer is allowed to see (so the
 * bell doesn't blow up from mundane edits, nor leak activity a role has no
 * business knowing about).
 */
final class NotificationService
{
    /**
     * Log names that are surfaced as "notifications" in the admin bell, each with
     * the permission needed to see it. Updates to settings/audit/etc. are
     * deliberately omitted — those events exist for the audit trail, not as
     * actionable user-facing notifications. Sign-ins and account changes are
     * about people, so only user managers see them.
     *
     * @var array<string, string>
     */
    public const NOTIFIABLE_LOGS = [
        'contact-request' => 'contact-requests.viewAny',
        'post' => 'posts.viewAny',
        'content-page' => 'pages.viewAny',
        'user' => 'users.manage',
        'auth' => 'users.manage',
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
                // Russian display names for the bell.
                'log_label' => ActivityLabels::log($a->log_name),
                'event_label' => ActivityLabels::event($a->event),
                'subject_label' => ActivityLabels::subject($a->subject_type),
            ])
            ->all();
    }

    public function markAllRead(User $user): void
    {
        $user->forceFill(['notifications_read_at' => now()])->save();
    }

    /**
     * The notifiable log names this user may see.
     *
     * @return list<string>
     */
    public function visibleLogs(User $user): array
    {
        return array_keys(array_filter(
            self::NOTIFIABLE_LOGS,
            fn (string $permission): bool => $user->can($permission),
        ));
    }

    /**
     * Activities not yet read by this user. Excludes:
     *  - log names the user has no permission for
     *  - events the user themselves caused (self-notifying is noise)
     *  - events without a causer (system/seed-driven rows aren't notifications)
     *
     * @return Builder<Activity>
     */
    private function unreadQuery(User $user): Builder
    {
        $marker = $user->notifications_read_at;

        // An empty list yields `WHERE 0 = 1`, i.e. no notifications at all.
        return Activity::query()
            ->whereIn('log_name', $this->visibleLogs($user))
            ->whereNotNull('causer_id')
            ->where(function ($q) use ($user) {
                $q->where('causer_type', '!=', $user->getMorphClass())
                    ->orWhere('causer_id', '!=', $user->id);
            })
            ->when($marker !== null, fn ($q) => $q->where('created_at', '>', $marker));
    }
}
