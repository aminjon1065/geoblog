<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotFoundLog extends Model
{
    protected $table = 'not_found_log';

    protected $fillable = [
        'path',
        'hits',
        'last_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'hits' => 'integer',
            'last_at' => 'datetime',
        ];
    }
}
