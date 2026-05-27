<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

/**
 * An admin-managed navigation menu (e.g. "header", "footer").
 *
 * Items form a tree via {@see MenuItem::$parent_id}. The full tree is reconstructed
 * and URL-resolved in MenuResource for the public Inertia share.
 */
class Menu extends Model
{
    use LogsActivity;

    protected $fillable = [
        'slug',
        'name',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['slug', 'name'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('menu');
    }

    public function items(): HasMany
    {
        return $this->hasMany(MenuItem::class)->orderBy('sort_order');
    }

    /**
     * Top-level items only (parent_id IS NULL). Children load via the relation below.
     */
    public function rootItems(): HasMany
    {
        return $this->hasMany(MenuItem::class)
            ->whereNull('parent_id')
            ->orderBy('sort_order');
    }
}
