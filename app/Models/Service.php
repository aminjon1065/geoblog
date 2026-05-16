<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Service extends Model
{
    use LogsActivity, SoftDeletes;

    protected $fillable = [
        'slug',
        'is_active',
        'sort_order',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['slug', 'is_active', 'sort_order'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('service');
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function translations(): HasMany
    {
        return $this->hasMany(ServiceTranslation::class);
    }

    public function translation(): HasOne
    {
        return $this->hasOne(ServiceTranslation::class)
            ->where('locale', app()->getLocale());
    }

    public function media(): \Illuminate\Database\Eloquent\Relations\MorphToMany
    {
        return $this->morphToMany(Media::class, 'mediaable', 'media_ables');
    }
}
