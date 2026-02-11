<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePageRequest;
use App\Models\Locale;
use App\Models\Page;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Pages/Index', [
            'pages' => Page::with('translations')
                ->get()
                ->map(fn (Page $p) => [
                    'id' => $p->id,
                    'key' => $p->key,
                    'is_active' => $p->is_active,
                    'translations' => $p->translations->keyBy('locale')->map(fn ($t) => [
                        'title' => $t->title,
                    ]),
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
                'is_active' => $page->is_active,
                'translations' => $page->translations->keyBy('locale')->map(fn ($t) => [
                    'title' => $t->title,
                    'content' => $t->content,
                    'meta_title' => $t->meta_title,
                    'meta_description' => $t->meta_description,
                ]),
            ],
            'locales' => Locale::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    public function update(UpdatePageRequest $request, Page $page): RedirectResponse
    {
        $page->update([
            'is_active' => $request->validated('is_active', true),
        ]);

        foreach ($request->validated('translations') as $locale => $data) {
            $page->translations()->updateOrCreate(
                ['locale' => $locale],
                $data,
            );
        }

        return to_route('admin.pages.index')->with('success', 'Page updated.');
    }
}
