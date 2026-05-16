<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreServiceRequest;
use App\Http\Requests\Admin\UpdateServiceRequest;
use App\Models\Locale;
use App\Models\Service;
use App\Support\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Str;
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

    public function index(): Response
    {
        $services = Service::query()
            ->with('translations')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Admin/Services/Index', [
            'services' => $services,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Services/Create', [
            'locales' => Locale::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    public function store(StoreServiceRequest $request): RedirectResponse
    {
        $sanitized = HtmlSanitizer::cleanTranslations(
            $request->validated('translations', []),
            ['content'],
        );

        $translations = collect($sanitized)
            ->filter(fn (array $data) => ! empty($data['title']));

        $firstTitle = $translations->first()['title'];
        $slug = Str::slug($firstTitle);

        $service = Service::create([
            'slug' => $slug,
            'is_active' => $request->validated('is_active', true),
            'sort_order' => $request->validated('sort_order', 0),
        ]);

        foreach ($translations as $locale => $data) {
            $service->translations()->create([
                'locale' => $locale,
                ...$data,
            ]);
        }

        return redirect()->route('admin.services.index')->with('success', 'Service created.');
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
                'translations' => $service->translations->keyBy('locale')->map(fn ($t) => [
                    'title' => $t->title,
                    'description' => $t->description,
                    'content' => $t->content,
                    'meta_title' => $t->meta_title,
                    'meta_description' => $t->meta_description,
                ]),
            ],
            'locales' => Locale::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    public function update(UpdateServiceRequest $request, Service $service): RedirectResponse
    {
        $sanitized = HtmlSanitizer::cleanTranslations(
            $request->validated('translations', []),
            ['content'],
        );

        $translations = collect($sanitized)
            ->filter(fn (array $data) => ! empty($data['title']));

        $firstTitle = $translations->first()['title'];
        $slug = Str::slug($firstTitle);

        $service->update([
            'slug' => $slug,
            'is_active' => $request->validated('is_active', true),
            'sort_order' => $request->validated('sort_order', 0),
        ]);

        $activeLocales = [];

        foreach ($translations as $locale => $data) {
            $service->translations()->updateOrCreate(
                ['locale' => $locale],
                $data,
            );
            $activeLocales[] = $locale;
        }

        $service->translations()->whereNotIn('locale', $activeLocales)->delete();

        return redirect()->route('admin.services.index')->with('success', 'Service updated.');
    }

    public function destroy(Service $service): RedirectResponse
    {
        $service->delete();

        return redirect()->route('admin.services.index')->with('success', 'Service deleted.');
    }
}
