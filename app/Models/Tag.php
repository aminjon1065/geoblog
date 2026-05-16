<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Tag extends Model
{
    use LogsActivity, SoftDeletes;

    public $timestamps = false;

    protected $fillable = [
        'slug',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['slug'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('tag');
    }

    public function translations(): HasMany
    {
        return $this->hasMany(TagTranslation::class);
    }

    public function translation(): HasOne
    {
        return $this->hasOne(TagTranslation::class)
            ->where('locale', app()->getLocale());
    }

    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class);
    }
}
