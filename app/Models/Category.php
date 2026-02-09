<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Category extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'slug',
        'sort_order',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(CategoryTranslation::class);
    }

    public function translation(): HasOne
    {
        return $this->hasOne(CategoryTranslation::class)
            ->where('locale', app()->getLocale());
    }

    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'post_category');
    }
}
