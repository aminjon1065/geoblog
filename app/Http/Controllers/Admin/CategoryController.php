<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Models\Category;
use App\Models\Locale;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Categories/Index', [
            'categories' => Category::with('translations')
                ->orderBy('sort_order')
                ->get()
                ->map(fn (Category $c) => [
                    'id' => $c->id,
                    'slug' => $c->slug,
                    'sort_order' => $c->sort_order,
                    'translations' => $c->translations->keyBy('locale')->map(fn ($t) => [
                        'name' => $t->name,
                        'description' => $t->description,
                    ]),
                ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Categories/Create', [
            'locales' => Locale::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $category = Category::create([
            'slug' => $request->validated('slug'),
            'sort_order' => $request->validated('sort_order', 0),
        ]);

        foreach ($request->validated('translations') as $locale => $data) {
            $category->translations()->create([
                'locale' => $locale,
                ...$data,
            ]);
        }

        return to_route('admin.categories.index')->with('success', 'Category created.');
    }

    public function edit(Category $category): Response
    {
        $category->load('translations');

        return Inertia::render('Admin/Categories/Edit', [
            'category' => [
                'id' => $category->id,
                'slug' => $category->slug,
                'sort_order' => $category->sort_order,
                'translations' => $category->translations->keyBy('locale')->map(fn ($t) => [
                    'name' => $t->name,
                    'description' => $t->description,
                ]),
            ],
            'locales' => Locale::where('is_active', true)->orderBy('sort_order')->get(),
        ]);
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $category->update([
            'slug' => $request->validated('slug'),
            'sort_order' => $request->validated('sort_order', 0),
        ]);

        foreach ($request->validated('translations') as $locale => $data) {
            $category->translations()->updateOrCreate(
                ['locale' => $locale],
                $data,
            );
        }

        return to_route('admin.categories.index')->with('success', 'Category updated.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        $category->delete();

        return to_route('admin.categories.index')->with('success', 'Category deleted.');
    }
}
