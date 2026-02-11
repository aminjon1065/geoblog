<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreTagRequest;
use App\Http\Requests\Admin\UpdateTagRequest;
use App\Models\Locale;
use App\Models\Tag;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TagController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Tags/Index', [
            'tags' => Tag::with('translations')
                ->latest()
                ->get()
                ->map(fn (Tag $t) => [
                    'id' => $t->id,
                    'slug' => $t->slug,
                    'translations' => $t->translations->keyBy('locale')->map(fn ($tr) => [
                        'name' => $tr->name,
                    ]),
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Tags/Create', [
            'locales' => Locale::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    public function store(StoreTagRequest $request): RedirectResponse
    {
        $tag = Tag::create([
            'slug' => $request->validated('slug'),
        ]);

        foreach ($request->validated('translations') as $locale => $data) {
            $tag->translations()->create([
                'locale' => $locale,
                ...$data,
            ]);
        }

        return to_route('admin.tags.index')->with('success', 'Tag created.');
    }

    public function edit(Tag $tag): Response
    {
        $tag->load('translations');

        return Inertia::render('Admin/Tags/Edit', [
            'tag' => [
                'id' => $tag->id,
                'slug' => $tag->slug,
                'translations' => $tag->translations->keyBy('locale')->map(fn ($t) => [
                    'name' => $t->name,
                ]),
            ],
            'locales' => Locale::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    public function update(UpdateTagRequest $request, Tag $tag): RedirectResponse
    {
        $tag->update([
            'slug' => $request->validated('slug'),
        ]);

        foreach ($request->validated('translations') as $locale => $data) {
            $tag->translations()->updateOrCreate(
                ['locale' => $locale],
                $data,
            );
        }

        return to_route('admin.tags.index')->with('success', 'Tag updated.');
    }

    public function destroy(Tag $tag): RedirectResponse
    {
        $tag->delete();

        return to_route('admin.tags.index')->with('success', 'Tag deleted.');
    }
}
