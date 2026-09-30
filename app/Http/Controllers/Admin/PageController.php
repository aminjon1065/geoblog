<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePageRequest;
use App\Models\Locale;
use App\Models\Page;
use App\Models\PageTranslation;
use App\Support\Translations;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:viewAny,'.Page::class, only: ['index']),
            new Middleware('can:update,page', only: ['edit', 'update']),
        ];
    }

    public function index(): Response
    {
        return Inertia::render('Admin/Pages/Index', [
            'pages' => Page::query()
                ->with('translations')
                ->orderBy('id')
                ->get()
                ->map(fn (Page $page): array => [
                    'id' => $page->id,
                    'key' => $page->key,
                    // The model has no cast; the column comes back as 0/1.
                    'is_active' => (bool) $page->is_active,
                    'title' => Translations::pick($page->translations)?->getAttribute('title') ?? $page->key,
                    'locales' => $page->translations->pluck('locale')->values()->all(),
                ]),
        ]);
    }

    public function edit(Page $page): Response
    {
        $page->load('translations');

        return Inertia::render('Admin/Pages/Edit', [
            'page' => [
                'id' => $page->id,
                'key' => $page->key,
                'is_active' => (bool) $page->is_active,
                'translations' => $page->translations->keyBy('locale')->map(fn (PageTranslation $translation): array => [
                    'title' => $translation->title,
                    'content' => $translation->content,
                    'meta_title' => $translation->meta_title,
                    'meta_description' => $translation->meta_description,
                ]),
            ],
            'locales' => Locale::query()->where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    public function update(UpdatePageRequest $request, Page $page): RedirectResponse
    {
        $changes = $request->translationChanges();

        DB::transaction(function () use ($request, $page, $changes): void {
            $page->update([
                'is_active' => $request->validated('is_active', $page->is_active),
            ]);

            foreach ($changes['save'] as $locale => $fields) {
                $page->translations()->updateOrCreate(['locale' => $locale], $fields);
            }

            if ($changes['clear'] !== []) {
                $page->translations()->whereIn('locale', $changes['clear'])->delete();
            }
        });

        return to_route('admin.pages.index')->with('success', 'Страница обновлена.');
    }
}
