<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

/**
 * A single folder in the media library tree.
 *
 * Folder location is logical only — the storage disk uses a flat layout. Restructuring
 * the tree never moves files on disk; it just relinks `media.folder_id` rows.
 */
class MediaFolder extends Model
{
    use LogsActivity;

    protected $fillable = [
        'parent_id',
        'name',
        'slug',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['parent_id', 'name', 'slug'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('media-folder');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function files(): HasMany
    {
        return $this->hasMany(Media::class, 'folder_id');
    }

    /**
     * Walk up the parent chain and return ancestors closest-first
     * (the folder itself is NOT included).
     *
     * @return array<int, self>
     */
    public function ancestors(): array
    {
        $chain = [];
        $cursor = $this->parent;
        while ($cursor !== null) {
            $chain[] = $cursor;
            $cursor = $cursor->parent;
        }

        return array_reverse($chain);
    }
}
