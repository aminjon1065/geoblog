<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Media extends Model
{
    use LogsActivity, SoftDeletes;

    protected $fillable = [
        'folder_id',
        'name',
        'original_name',
        'disk',
        'path',
        'mime_type',
        'size',
        'alt',
        'title',
        'caption',
        'width',
        'height',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'folder_id', 'name', 'original_name', 'disk', 'path',
                'mime_type', 'size', 'alt', 'title', 'caption', 'width', 'height',
            ])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('media');
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(MediaFolder::class, 'folder_id');
    }

    /**
     * Reverse of {@see Service::media()}. Lets the admin UI answer
     * "which services currently reference this asset?" before allowing deletion.
     */
    public function services(): MorphToMany
    {
        return $this->morphedByMany(Service::class, 'mediaable', 'media_ables');
    }
}
