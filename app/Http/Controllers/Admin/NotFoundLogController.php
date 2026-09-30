<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyNotFoundLogsRequest;
use App\Models\NotFoundLog;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class NotFoundLogController extends Controller implements HasMiddleware
{
    /** Sortable columns: query value → database column. */
    private const SORTABLE = [
        'path' => 'path',
        'hits' => 'hits',
        'last_at' => 'last_at',
    ];

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
        $orderBy = $request->string('orderby')->toString();
        $orderBy = array_key_exists($orderBy, self::SORTABLE) ? $orderBy : null;
        $order = $request->string('order')->toString() === 'asc' ? 'asc' : 'desc';

        $entries = NotFoundLog::query()
            ->when($search !== '', fn (Builder $q) => $q->where('path', 'like', "%{$search}%"))
            ->when(
                $orderBy !== null,
                fn (Builder $q) => $q->orderBy(self::SORTABLE[$orderBy], $order),
                fn (Builder $q) => $q->orderByDesc('hits')->orderByDesc('last_at'),
            )
            ->orderByDesc('id')
            ->paginate(50)
            ->withQueryString()
            ->through(fn (NotFoundLog $row): array => [
                'id' => $row->id,
                'path' => $row->path,
                'hits' => $row->hits,
                'last_at' => $row->last_at?->toIso8601String(),
            ]);

        return Inertia::render('Admin/NotFound/Index', [
            'entries' => $entries,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'orderby' => $orderBy,
                'order' => $order,
            ],
        ]);
    }

    public function destroy(NotFoundLog $notFoundLog): RedirectResponse
    {
        $notFoundLog->delete();

        return back()->with('success', 'Запись удалена из журнала 404.');
    }

    public function bulkDestroy(BulkDestroyNotFoundLogsRequest $request): RedirectResponse
    {
        $deleted = NotFoundLog::query()->whereKey($request->ids())->delete();

        return back()->with('success', "Удалено записей из журнала 404: {$deleted}.");
    }
}
