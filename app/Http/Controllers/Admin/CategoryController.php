<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyCategoriesRequest;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\TermFormRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Models\Category;
use App\Models\CategoryTranslation;
use App\Models\Locale;
use App\Models\Post;
use App\Models\User;
use App\Support\Translations;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * "Записи → Рубрики", as in WordPress: the add form and the list share one
 * screen (edit-tags.php); a category is edited on its own screen (term.php).
 */
class CategoryController extends Controller implements HasMiddleware
{
    private const PER_PAGE = 20;

    /**
     * Sortable columns of the list with their first-click direction.
     *
     * @var array<string, 'asc'|'desc'>
     */
    private const SORTABLE = [
        'name' => 'asc',
        'slug' => 'asc',
        'count' => 'desc',
        'sort_order' => 'asc',
    ];

    /**
     * @return list<Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('can:viewAny,'.Category::class, only: ['index']),
            new Middleware('can:create,'.Category::class, only: ['create', 'store']),
            new Middleware('can:update,category', only: ['edit', 'update']),
            new Middleware('can:delete,category', only: ['destroy']),
        ];
    }

    public function index(Request $request): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $search = $request->string('search')->trim()->toString();
        $orderBy = $request->string('orderby')->toString();
        $orderBy = array_key_exists($orderBy, self::SORTABLE) ? $orderBy : 'sort_order';
        $order = $request->string('order')->toString();
        $order = in_array($order, ['asc', 'desc'], true) ? $order : self::SORTABLE[$orderBy];

        $query = Category::query()
            ->with('translations:id,category_id,locale,name,description')
            ->withCount('posts')
            ->search($search);

        match ($orderBy) {
            'name' => $query->orderByName($order),
            'slug' => $query->orderBy('slug', $order),
            'count' => $query->orderBy('posts_count', $order),
            default => $query->orderBy('sort_order', $order),
        };

        $categories = $query->orderBy('id', $order)
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        // Deleting the last rows of the last page must not leave an empty page.
        if ($categories->isEmpty() && $categories->currentPage() > 1) {
            $lastPage = $categories->lastPage();

            return to_route('admin.categories.index', [
                ...$request->except('page'),
                ...($lastPage > 1 ? ['page' => $lastPage] : []),
            ]);
        }

        $locales = $this->activeLocales();
        $publicLocales = $locales->pluck('code')->all();

        return Inertia::render('Admin/Categories/Index', [
            'categories' => $categories->through(
                fn (Category $category): array => $this->row($category, $user, $publicLocales),
            ),
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'orderby' => $orderBy,
                'order' => $order,
            ],
            'locales' => $locales,
            'can' => [
                'create' => $user->can('create', Category::class),
                'view_posts' => $user->can('viewAny', Post::class),
            ],
        ]);
    }

    /**
     * WordPress has no separate "add" screen: the form sits next to the list.
     */
    public function create(): RedirectResponse
    {
        return to_route('admin.categories.index');
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $category = DB::transaction(function () use ($request): Category {
            $category = Category::create([
                'slug' => $request->slug(),
                'sort_order' => $request->sortOrder()
                    ?? (int) Category::withTrashed()->max('sort_order') + 1,
            ]);

            $this->writeTranslations($category, $request);

            return $category;
        });

        return $this->backToIndex()
            ->with('success', 'Рубрика «'.$this->nameOf($category).'» добавлена.');
    }

    public function edit(Request $request, Category $category): Response
    {
        /** @var User $user */
        $user = $request->user();
        $category->load('translations')->loadCount('posts');
        $translation = Translations::pick($category->translations);
        $locales = $this->activeLocales();

        return Inertia::render('Admin/Categories/Edit', [
            'category' => [
                'id' => $category->id,
                'slug' => $category->slug,
                'sort_order' => $category->sort_order,
                'name' => $translation?->name ?? $category->slug,
                'translations' => $category->translations->mapWithKeys(
                    fn (CategoryTranslation $row): array => [
                        $row->locale => ['name' => $row->name, 'description' => $row->description],
                    ],
                ),
                'posts_count' => $category->posts_count,
                'view_url' => $this->viewUrl($category, $translation?->locale, $locales->pluck('code')->all()),
            ],
            'locales' => $locales,
            'can' => [
                'delete' => $user->can('delete', $category),
            ],
        ]);
    }

    /**
     * Stays on the edit screen afterwards, as WordPress does.
     */
    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        DB::transaction(function () use ($request, $category): void {
            $attributes = ['slug' => $request->slug()];

            if ($request->sortOrder() !== null) {
                $attributes['sort_order'] = $request->sortOrder();
            }

            $category->update($attributes);
            $this->writeTranslations($category, $request);
        });

        return to_route('admin.categories.edit', $category)
            ->with('success', 'Рубрика «'.$this->nameOf($category).'» обновлена.');
    }

    /**
     * The posts stay; they just leave this category.
     */
    public function destroy(Category $category): RedirectResponse
    {
        $name = $this->nameOf($category);
        $category->delete();

        return $this->backToIndex()->with('success', "Рубрика «{$name}» удалена.");
    }

    public function bulkDestroy(BulkDestroyCategoriesRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $ids = $request->ids();

        $deleted = DB::transaction(function () use ($ids, $user): int {
            $deleted = 0;

            foreach (Category::query()->whereKey($ids)->get() as $category) {
                if ($user->can('delete', $category)) {
                    $category->delete();
                    $deleted++;
                }
            }

            return $deleted;
        });

        $message = "Удалено рубрик: {$deleted}.";
        $skipped = count($ids) - $deleted;

        if ($skipped > 0) {
            $message .= " Пропущено: {$skipped} (нет прав на удаление или рубрика уже удалена).";
        }

        return $this->backToIndex()->with($deleted > 0 ? 'success' : 'error', $message);
    }

    /**
     * @param  list<string>  $publicLocales
     * @return array<string, mixed>
     */
    private function row(Category $category, User $user, array $publicLocales): array
    {
        $translation = Translations::pick($category->translations);

        return [
            'id' => $category->id,
            'slug' => $category->slug,
            'name' => $translation?->name ?? $category->slug,
            'name_locale' => $translation?->locale,
            'description' => $translation?->description,
            'sort_order' => $category->sort_order,
            'posts_count' => $category->posts_count,
            'view_url' => $this->viewUrl($category, $translation?->locale, $publicLocales),
            'can' => [
                'update' => $user->can('update', $category),
                'delete' => $user->can('delete', $category),
            ],
        ];
    }

    /**
     * The category's posts on the public site, in the language of the name
     * shown (or the first site language).
     *
     * @param  list<string>  $publicLocales
     */
    private function viewUrl(Category $category, ?string $locale, array $publicLocales): ?string
    {
        $locale = in_array($locale, $publicLocales, true) ? $locale : ($publicLocales[0] ?? null);

        return $locale !== null
            ? route('news.index', ['locale' => $locale, 'category' => $category->slug])
            : null;
    }

    /**
     * Upserts every named language and removes the ones cleared in the form.
     */
    private function writeTranslations(Category $category, TermFormRequest $request): void
    {
        foreach ($request->namedTranslations() as $locale => $fields) {
            $category->translations()->updateOrCreate(['locale' => $locale], $fields);
        }

        $cleared = $request->clearedLocales();

        if ($cleared !== []) {
            $category->translations()->whereIn('locale', $cleared)->delete();
        }
    }

    private function nameOf(Category $category): string
    {
        $category->load('translations');

        return Translations::pick($category->translations)?->name ?? $category->slug;
    }

    /**
     * @return Collection<int, Locale>
     */
    private function activeLocales(): Collection
    {
        return Locale::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['code', 'name']);
    }

    /**
     * Back to the list the request came from — same page, search and sort —
     * or to its first page when it came from elsewhere (the edit screen).
     */
    private function backToIndex(): RedirectResponse
    {
        $index = route('admin.categories.index');
        $previous = parse_url(url()->previous());

        if (($previous['path'] ?? null) === parse_url($index, PHP_URL_PATH) && isset($previous['query'])) {
            return redirect()->to($index.'?'.$previous['query']);
        }

        return redirect()->to($index);
    }
}
