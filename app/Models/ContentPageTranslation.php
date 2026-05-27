<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentPageTranslation extends Model
{
    protected $fillable = [
        'content_page_id',
        'locale',
        'title',
        'meta_title',
        'meta_description',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(ContentPage::class, 'content_page_id');
    }

    public function locale(): BelongsTo
    {
        return $this->belongsTo(Locale::class, 'locale', 'code');
    }
}
