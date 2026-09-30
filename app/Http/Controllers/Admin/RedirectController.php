<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyRedirectsRequest;
use App\Http\Requests\Admin\StoreRedirectRequest;
use App\Http\Requests\Admin\UpdateRedirectRequest;
use App\Models\Redirect;
use App\Services\Seo\RedirectResolver;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class RedirectController extends Controller implements HasMiddleware
{
    /** Sortable columns: query value → database column. */
    private const SORTABLE = [
        'from' => 'from_path',
        'hits' => 'hits',
        'last_hit' => 'last_hit_at',
    ];

    public function __construct(private readonly RedirectResolver $resolver) {}

    public static function middleware(): array
    {
        return [
            new Middleware('can:viewAny,'.Redirect::class, only: ['index']),
            new Middleware('can:create,'.Redirect::class, only: ['create', 'store']),
            new Middleware('can:update,redirect', only: ['edit', 'update']),
            new Middleware('can:delete,redirect', only: ['destroy']),
        ];
    }

    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $orderBy = $request->string('orderby')->toString();
        $orderBy = array_key_exists($orderBy, self::SORTABLE) ? $orderBy : null;
        $order = $request->string('order')->toString() === 'asc' ? 'asc' : 'desc';

        $redirects = Redirect::query()
            ->when($search !== '', fn (Builder $q) => $q->where(function (Builder $qq) use ($search) {
                $qq->where('from_path', 'like', "%{$search}%")
                    ->orWhere('to_path', 'like', "%{$search}%");
            }))
            ->when(
                $orderBy !== null,
                fn (Builder $q) => $q->orderBy(self::SORTABLE[$orderBy], $order),
                fn (Builder $q) => $q->orderByDesc('hits')->orderByDesc('updated_at'),
            )
            ->orderByDesc('id')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Redirect $r): array => [
                'id' => $r->id,
                'from_path' => $r->from_path,
                'to_path' => $r->to_path,
                'status_code' => $r->status_code,
                'hits' => $r->hits,
                'last_hit_at' => $r->last_hit_at?->toIso8601String(),
                'updated_at' => $r->updated_at?->toDateString(),
            ]);

        return Inertia::render('Admin/Redirects/Index', [
            'redirects' => $redirects,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'orderby' => $orderBy,
                'order' => $order,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        // Pre-fill `from_path` from the not-found log "convert" link when present.
        return Inertia::render('Admin/Redirects/Create', [
            'prefill' => [
                'from_path' => (string) $request->query('from', ''),
            ],
        ]);
    }

    public function store(StoreRedirectRequest $request): RedirectResponse
    {
        Redirect::create($request->validated());
        $this->resolver->flush();

        return to_route('admin.redirects.index')->with('success', 'Редирект добавлен.');
    }

    public function edit(Redirect $redirect): Response
    {
        return Inertia::render('Admin/Redirects/Edit', [
            'redirect' => [
                'id' => $redirect->id,
                'from_path' => $redirect->from_path,
                'to_path' => $redirect->to_path,
                'status_code' => $redirect->status_code,
                'hits' => $redirect->hits,
                'last_hit_at' => $redirect->last_hit_at?->toIso8601String(),
            ],
        ]);
    }

    public function update(UpdateRedirectRequest $request, Redirect $redirect): RedirectResponse
    {
        $redirect->update($request->validated());
        $this->resolver->flush();

        return to_route('admin.redirects.index')->with('success', 'Редирект обновлён.');
    }

    public function destroy(Redirect $redirect): RedirectResponse
    {
        $redirect->delete();
        $this->resolver->flush();

        return back()->with('success', 'Редирект удалён.');
    }

    public function bulkDestroy(BulkDestroyRedirectsRequest $request): RedirectResponse
    {
        // One by one rather than a mass delete, so each removal lands in the audit log.
        $redirects = Redirect::query()->whereKey($request->ids())->get();
        $redirects->each->delete();
        $this->resolver->flush();

        return back()->with('success', "Удалено редиректов: {$redirects->count()}.");
    }
}
