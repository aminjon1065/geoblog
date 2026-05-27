<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class ContentBlock extends Model
{
    use LogsActivity;

    protected $fillable = [
        'content_page_id',
        'type',
        'sort_order',
        'settings',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'settings' => 'array',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['content_page_id', 'type', 'sort_order', 'settings'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('content-block');
    }

    public function page(): BelongsTo
    {
        return $this->belongsTo(ContentPage::class, 'content_page_id');
    }

    public function translations(): HasMany
    {
        return $this->hasMany(ContentBlockTranslation::class);
    }

    public function translation(): HasOne
    {
        return $this->hasOne(ContentBlockTranslation::class)
            ->where('locale', app()->getLocale());
    }
}
