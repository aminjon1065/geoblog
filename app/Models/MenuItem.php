<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class MenuItem extends Model
{
    use LogsActivity;

    protected $fillable = [
        'menu_id',
        'parent_id',
        'sort_order',
        'link_type',
        'link_target',
        'open_in_new_tab',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'open_in_new_tab' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'menu_id', 'parent_id', 'sort_order',
                'link_type', 'link_target', 'open_in_new_tab',
            ])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('menu-item');
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order');
    }

    public function translations(): HasMany
    {
        return $this->hasMany(MenuItemTranslation::class);
    }

    public function translation(): HasOne
    {
        return $this->hasOne(MenuItemTranslation::class)
            ->where('locale', app()->getLocale());
    }
}
