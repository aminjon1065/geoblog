<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContentBlockTranslation extends Model
{
    protected $fillable = [
        'content_block_id',
        'locale',
        'content',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'content' => 'array',
        ];
    }

    public function block(): BelongsTo
    {
        return $this->belongsTo(ContentBlock::class, 'content_block_id');
    }

    public function locale(): BelongsTo
    {
        return $this->belongsTo(Locale::class, 'locale', 'code');
    }
}
