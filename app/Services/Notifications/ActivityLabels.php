<?php

declare(strict_types=1);

namespace App\Services\Notifications;

use Illuminate\Support\Facades\Lang;

/**
 * Russian names of activity-log channels, events and subjects for the audit
 * log and the notification bell (lang/ru/activity.php). Unknown values fall
 * back to what is stored in the activity_log table.
 */
final class ActivityLabels
{
    public static function log(?string $logName): ?string
    {
        return self::lookup('logs', $logName);
    }

    public static function event(?string $event): ?string
    {
        return self::lookup('events', $event);
    }

    /**
     * @param  string|null  $subjectType  a model class name or its basename
     */
    public static function subject(?string $subjectType): ?string
    {
        return self::lookup('subjects', $subjectType !== null ? class_basename($subjectType) : null);
    }

    private static function lookup(string $group, ?string $value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        $key = "activity.{$group}.{$value}";

        return Lang::has($key) ? (string) __($key) : $value;
    }
}
