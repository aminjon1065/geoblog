<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Media extends Model
{
    protected $fillable = [
        'disk',
        'path',
        'mime_type',
        'size',
    ];

    public function mediaables(): MorphTo
    {
        return $this->morphTo();
    }
}
