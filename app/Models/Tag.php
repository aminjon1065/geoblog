<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Tag extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'slug',
    ];

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
