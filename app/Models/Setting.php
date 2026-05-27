<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

/**
 * Persistent row for a single setting. Reads and writes should normally go through
 * {@see \App\Services\Settings\SettingsRepository} so the cache stays coherent.
 */
class Setting extends Model
{
    use LogsActivity;

    protected $fillable = [
        'group',
        'key',
        'value',
        'type',
        'is_public',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['group', 'key', 'value', 'type', 'is_public'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('setting');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'json',
            'is_public' => 'boolean',
        ];
    }
}
