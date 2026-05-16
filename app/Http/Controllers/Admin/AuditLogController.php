<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class AuditLogController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:audit.viewAny'),
        ];
    }

    public function index(Request $request): Response
    {
        $logName = $request->string('log')->trim()->toString();
        $event = $request->string('event')->trim()->toString();
        $search = $request->string('search')->trim()->toString();

        $activities = Activity::query()
            ->with('causer:id,name,email')
            ->when($logName !== '', fn ($q) => $q->where('log_name', $logName))
            ->when($event !== '', fn ($q) => $q->where('event', $event))
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($query) use ($search) {
                    $query->where('description', 'like', "%{$search}%")
                        ->orWhere('subject_type', 'like', "%{$search}%")
                        ->orWhereHas('causer', function ($causerQuery) use ($search) {
                            $causerQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            })
            ->latest('id')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Activity $activity) => [
                'id' => $activity->id,
                'log_name' => $activity->log_name,
                'event' => $activity->event,
                'description' => $activity->description,
                'subject_type' => $activity->subject_type !== null
                    ? class_basename($activity->subject_type)
                    : null,
                'subject_id' => $activity->subject_id,
                'causer' => $activity->causer
                    ? ['id' => $activity->causer->id, 'name' => $activity->causer->name, 'email' => $activity->causer->email]
                    : null,
                'properties' => $activity->properties,
                'created_at' => $activity->created_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/Audit/Index', [
            'activities' => $activities,
            'filters' => [
                'log' => $logName !== '' ? $logName : null,
                'event' => $event !== '' ? $event : null,
                'search' => $search !== '' ? $search : null,
            ],
            'logNames' => Activity::query()->select('log_name')->distinct()->orderBy('log_name')->pluck('log_name'),
            'events' => Activity::query()->select('event')->whereNotNull('event')->distinct()->orderBy('event')->pluck('event'),
        ]);
    }
}
