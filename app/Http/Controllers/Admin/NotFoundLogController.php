<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NotFoundLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class NotFoundLogController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:not-found.viewAny', only: ['index']),
            new Middleware('can:redirects.manage', only: ['destroy']),
        ];
    }

    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();

        $entries = NotFoundLog::query()
            ->when($search !== '', fn ($q) => $q->where('path', 'like', "%{$search}%"))
            ->orderByDesc('hits')
            ->orderByDesc('last_at')
            ->paginate(50)
            ->withQueryString()
            ->through(fn (NotFoundLog $row): array => [
                'id' => $row->id,
                'path' => $row->path,
                'hits' => $row->hits,
                'last_at' => $row->last_at?->toDateTimeString(),
            ]);

        return Inertia::render('Admin/NotFound/Index', [
            'entries' => $entries,
            'filters' => ['search' => $search !== '' ? $search : null],
        ]);
    }

    public function destroy(NotFoundLog $notFoundLog): RedirectResponse
    {
        $notFoundLog->delete();

        return back()->with('success', '404 entry removed.');
    }
}
