<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Redirect extends Model
{
    use LogsActivity;

    protected $fillable = [
        'from_path',
        'to_path',
        'status_code',
        'hits',
        'last_hit_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status_code' => 'integer',
            'hits' => 'integer',
            'last_hit_at' => 'datetime',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        // Note: hits/last_hit_at are operational telemetry, not editorial — omitted from
        // the audit trail so every public request doesn't append a log row.
        return LogOptions::defaults()
            ->logOnly(['from_path', 'to_path', 'status_code'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('redirect');
    }
}
