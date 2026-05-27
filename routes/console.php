<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Phase 9: prune the activity_log table weekly so it doesn't grow unbounded.
// `activitylog.delete_records_older_than_days` (config/activitylog.php) controls
// the retention window — default is 365, override via env if needed. Runs at
// 03:15 local time on Sundays; no queue worker required, just `schedule:run`.
Schedule::command('activitylog:clean')
    ->weeklyOn(0, '03:15')
    ->withoutOverlapping();
