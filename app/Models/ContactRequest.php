<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class ContactRequest extends Model
{
    use LogsActivity, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'message',
        'locale',
        'is_read',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        // Public-facing form creates these rows; we only care about admin-side state
        // changes (mark read, delete) for audit purposes.
        return LogOptions::defaults()
            ->logOnly(['is_read'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('contact-request');
    }
}
