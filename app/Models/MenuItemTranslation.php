<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuItemTranslation extends Model
{
    protected $fillable = [
        'menu_item_id',
        'locale',
        'label',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'menu_item_id');
    }

    public function locale(): BelongsTo
    {
        return $this->belongsTo(Locale::class, 'locale', 'code');
    }
}
