<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PostTranslation extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'locale',
        'title',
        'excerpt',
        'content',
        'meta_title',
        'meta_description',
    ];

    public function post(): BelongsTo
    {
        return $this->belongsTo(Post::class);
    }

    public function locale(): BelongsTo
    {
        return $this->belongsTo(Locale::class, 'locale', 'code');
    }
}
