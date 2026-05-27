<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

/**
 * A user-managed dynamic page assembled from {@see ContentBlock} instances.
 *
 * Distinct from {@see Page} (which models system-managed content slots like /about
 * served by hardcoded routes). The two coexist; a future phase may migrate the
 * legacy slots into this model.
 */
class ContentPage extends Model
{
    use LogsActivity, SoftDeletes;

    protected $fillable = [
        'parent_id',
        'slug',
        'status',
        'template',
        'published_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'published_at' => 'datetime',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'parent_id', 'slug', 'status', 'template',
                'published_at', 'created_by', 'updated_by',
            ])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('content-page');
    }

    public function translations(): HasMany
    {
        return $this->hasMany(ContentPageTranslation::class);
    }

    public function translation(): HasOne
    {
        return $this->hasOne(ContentPageTranslation::class)
            ->where('locale', app()->getLocale());
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function blocks(): HasMany
    {
        return $this->hasMany(ContentBlock::class)->orderBy('sort_order');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * @param  Builder<self>  $query
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query
            ->where('status', 'published')
            ->where(function (Builder $q) {
                $q->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            });
    }
}
