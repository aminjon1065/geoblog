<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Media extends Model
{
    use LogsActivity;

    protected $fillable = [
        'disk',
        'path',
        'mime_type',
        'size',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['disk', 'path', 'mime_type', 'size'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('media');
    }

    public function mediaables(): MorphTo
    {
        return $this->morphTo();
    }
}
