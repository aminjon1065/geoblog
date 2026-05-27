<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRedirectRequest;
use App\Http\Requests\Admin\UpdateRedirectRequest;
use App\Models\Redirect;
use App\Services\Seo\RedirectResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class RedirectController extends Controller implements HasMiddleware
{
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

        $redirects = Redirect::query()
            ->when($search !== '', fn ($q) => $q->where(function ($qq) use ($search) {
                $qq->where('from_path', 'like', "%{$search}%")
                    ->orWhere('to_path', 'like', "%{$search}%");
            }))
            ->orderByDesc('hits')
            ->orderByDesc('updated_at')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Redirect $r): array => [
                'id' => $r->id,
                'from_path' => $r->from_path,
                'to_path' => $r->to_path,
                'status_code' => $r->status_code,
                'hits' => $r->hits,
                'last_hit_at' => $r->last_hit_at?->toDateTimeString(),
                'updated_at' => $r->updated_at?->toDateString(),
            ]);

        return Inertia::render('Admin/Redirects/Index', [
            'redirects' => $redirects,
            'filters' => ['search' => $search !== '' ? $search : null],
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

        return to_route('admin.redirects.index')->with('success', 'Redirect created.');
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
                'last_hit_at' => $redirect->last_hit_at?->toDateTimeString(),
            ],
        ]);
    }

    public function update(UpdateRedirectRequest $request, Redirect $redirect): RedirectResponse
    {
        $redirect->update($request->validated());
        $this->resolver->flush();

        return to_route('admin.redirects.index')->with('success', 'Redirect updated.');
    }

    public function destroy(Redirect $redirect): RedirectResponse
    {
        $redirect->delete();
        $this->resolver->flush();

        return back()->with('success', 'Redirect deleted.');
    }
}
