<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Page extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'key',
        'is_active',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(PageTranslation::class);
    }

    public function translation(): HasOne
    {
        return $this->hasOne(PageTranslation::class)
            ->where('locale', app()->getLocale());
    }
}
