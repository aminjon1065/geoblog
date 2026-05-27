<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Post extends Model
{
    use LogsActivity, SoftDeletes;

    protected $fillable = [
        'slug',
        'status',
        'is_featured',
        'og_image_id',
        'published_at',
        'author_id',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'is_featured' => 'boolean',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['slug', 'status', 'is_featured', 'og_image_id', 'published_at', 'author_id'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('post');
    }

    /* Relations */

    public function translations(): HasMany
    {
        return $this->hasMany(PostTranslation::class);
    }

    public function translation(): HasOne
    {
        return $this->hasOne(PostTranslation::class)
            ->where('locale', app()->getLocale());
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class, 'post_category');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function ogImage(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'og_image_id');
    }

    /* Scopes */

    public function scopePublished($query)
    {
        return $query
            ->where('status', 'published')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    /**
     * @param  Builder<self>  $query
     */
    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }
}
