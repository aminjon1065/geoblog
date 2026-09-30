<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkServiceActionRequest;
use App\Http\Requests\Admin\StoreServiceRequest;
use App\Http\Requests\Admin\UpdateServiceRequest;
use App\Models\Locale;
use App\Models\Service;
use App\Models\ServiceTranslation;
use App\Support\RussianPlural;
use App\Support\Slug;
use App\Support\Translations;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:viewAny,'.Service::class, only: ['index']),
            new Middleware('can:create,'.Service::class, only: ['create', 'store']),
            new Middleware('can:update,service', only: ['edit', 'update']),
            new Middleware('can:delete,service', only: ['destroy']),
        ];
    }

    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $status = in_array($status, ['active', 'inactive'], true) ? $status : null;

        $services = Service::query()
            ->with('translations')
            ->when($search !== '', fn (Builder $query) => $query->where(
                fn (Builder $inner) => $inner
                    ->where('slug', 'like', "%{$search}%")
                    ->orWhereHas('translations', fn (Builder $translation) => $translation->where('title', 'like', "%{$search}%")),
            ))
            ->when($status !== null, fn (Builder $query) => $query->where('is_active', $status === 'active'))
            ->orderBy('sort_order')
            ->orderBy('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Service $service): array => $this->indexRow($service));

        return Inertia::render('Admin/Services/Index', [
            'services' => $services,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => $status,
            ],
            'counts' => [
                'all' => Service::query()->count(),
                'active' => Service::query()->where('is_active', true)->count(),
                'inactive' => Service::query()->where('is_active', false)->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Services/Create', [
            'locales' => $this->activeLocales(),
        ]);
    }

    public function store(StoreServiceRequest $request): RedirectResponse
    {
        $changes = $request->translationChanges();
        $slugBase = $request->requestedSlug() !== ''
            ? $request->requestedSlug()
            : Slug::from((string) (Arr::first($changes['save'])['title'] ?? ''));

        $service = DB::transaction(function () use ($request, $changes, $slugBase): Service {
            $service = Service::create([
                'slug' => $this->uniqueSlug($slugBase),
                'is_active' => $request->validated('is_active', true),
                'sort_order' => $request->validated('sort_order', 0),
            ]);

            foreach ($changes['save'] as $locale => $fields) {
                $service->translations()->create(['locale' => $locale, ...$fields]);
            }

            return $service;
        });

        return to_route('admin.services.edit', $service)->with('success', 'Услуга добавлена.');
    }

    public function edit(Service $service): Response
    {
        $service->load('translations');

        return Inertia::render('Admin/Services/Edit', [
            'service' => [
                'id' => $service->id,
                'slug' => $service->slug,
                'is_active' => $service->is_active,
                'sort_order' => $service->sort_order,
                'created_at' => $service->created_at?->toIso8601String(),
                'updated_at' => $service->updated_at?->toIso8601String(),
                'translations' => $service->translations->keyBy('locale')->map(fn (ServiceTranslation $translation): array => [
                    'title' => $translation->title,
                    'description' => $translation->description,
                    'content' => $translation->content,
                    'meta_title' => $translation->meta_title,
                    'meta_description' => $translation->meta_description,
                ]),
            ],
            'locales' => $this->activeLocales(),
        ]);
    }

    public function update(UpdateServiceRequest $request, Service $service): RedirectResponse
    {
        $changes = $request->translationChanges();
        $requestedSlug = $request->requestedSlug();

        DB::transaction(function () use ($request, $service, $changes, $requestedSlug): void {
            $service->update([
                // The address stays as it is unless the editor typed a new one.
                'slug' => $requestedSlug !== '' && $requestedSlug !== $service->slug
                    ? $this->uniqueSlug($requestedSlug, $service->id)
                    : $service->slug,
                'is_active' => $request->validated('is_active', $service->is_active),
                'sort_order' => $request->validated('sort_order', $service->sort_order),
            ]);

            foreach ($changes['save'] as $locale => $fields) {
                $service->translations()->updateOrCreate(['locale' => $locale], $fields);
            }

            if ($changes['clear'] !== []) {
                $service->translations()->whereIn('locale', $changes['clear'])->delete();
            }
        });

        return to_route('admin.services.edit', $service)->with('success', 'Услуга обновлена.');
    }

    public function destroy(Service $service): RedirectResponse
    {
        $service->delete();

        return to_route('admin.services.index')->with('success', 'Услуга удалена.');
    }

    /**
     * Show, hide or delete the ticked services.
     */
    public function bulk(BulkServiceActionRequest $request): RedirectResponse
    {
        $action = (string) $request->validated('action');
        $ability = $action === 'delete' ? 'delete' : 'update';
        $services = Service::query()->whereKey($request->validated('ids'))->get();

        abort_unless(
            $services->every(fn (Service $service): bool => $request->user()?->can($ability, $service) ?? false),
            403,
        );

        if ($services->isEmpty()) {
            return back()->with('error', 'Отмеченные услуги не найдены — возможно, их уже удалили.');
        }

        DB::transaction(function () use ($services, $action): void {
            foreach ($services as $service) {
                match ($action) {
                    'activate' => $service->update(['is_active' => true]),
                    'deactivate' => $service->update(['is_active' => false]),
                    default => $service->delete(),
                };
            }
        });

        $forms = match ($action) {
            'activate' => ':count услуга теперь показывается на сайте|:count услуги теперь показываются на сайте|:count услуг теперь показываются на сайте',
            'deactivate' => ':count услуга скрыта с сайта|:count услуги скрыты с сайта|:count услуг скрыто с сайта',
            default => ':count услуга удалена|:count услуги удалены|:count услуг удалено',
        };

        return back()->with('success', RussianPlural::format($forms, $services->count()).'.');
    }

    /**
     * @return array<string, mixed>
     */
    private function indexRow(Service $service): array
    {
        return [
            'id' => $service->id,
            'slug' => $service->slug,
            'title' => Translations::pick($service->translations)?->getAttribute('title') ?? $service->slug,
            'is_active' => $service->is_active,
            'sort_order' => $service->sort_order,
            'locales' => $service->translations->pluck('locale')->values()->all(),
            'updated_at' => $service->updated_at?->toIso8601String(),
        ];
    }

    /**
     * `$base`, or `$base-2`, `$base-3`… — deleted services keep their slug in
     * the unique index, so they are counted too.
     */
    private function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        return Slug::unique(
            $base,
            fn (string $slug): bool => Service::withTrashed()
                ->where('slug', $slug)
                ->when($ignoreId !== null, fn (Builder $query) => $query->whereKeyNot($ignoreId))
                ->exists(),
            'usluga',
        );
    }

    /**
     * @return Collection<int, Locale>
     */
    private function activeLocales(): Collection
    {
        return Locale::query()->where('is_active', true)->orderBy('sort_order')->get();
    }
}
