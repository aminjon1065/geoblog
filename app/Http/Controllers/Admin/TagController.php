<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyTagsRequest;
use App\Http\Requests\Admin\StoreTagRequest;
use App\Http\Requests\Admin\TermFormRequest;
use App\Http\Requests\Admin\UpdateTagRequest;
use App\Models\Locale;
use App\Models\Tag;
use App\Models\TagTranslation;
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
 * "Записи → Метки", as in WordPress: the add form and the list share one
 * screen (edit-tags.php); a tag is edited on its own screen (term.php).
 */
class TagController extends Controller implements HasMiddleware
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
    ];

    /**
     * @return list<Middleware>
     */
    public static function middleware(): array
    {
        return [
            new Middleware('can:viewAny,'.Tag::class, only: ['index']),
            new Middleware('can:create,'.Tag::class, only: ['create', 'store']),
            new Middleware('can:update,tag', only: ['edit', 'update']),
            new Middleware('can:delete,tag', only: ['destroy']),
        ];
    }

    public function index(Request $request): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $search = $request->string('search')->trim()->toString();
        $orderBy = $request->string('orderby')->toString();
        $orderBy = array_key_exists($orderBy, self::SORTABLE) ? $orderBy : 'name';
        $order = $request->string('order')->toString();
        $order = in_array($order, ['asc', 'desc'], true) ? $order : self::SORTABLE[$orderBy];

        $query = Tag::query()
            ->with('translations:id,tag_id,locale,name')
            ->withCount('posts')
            ->search($search);

        match ($orderBy) {
            'slug' => $query->orderBy('slug', $order),
            'count' => $query->orderBy('posts_count', $order),
            default => $query->orderByName($order),
        };

        $tags = $query->orderBy('id', $order)
            ->paginate(self::PER_PAGE)
            ->withQueryString();

        // Deleting the last rows of the last page must not leave an empty page.
        if ($tags->isEmpty() && $tags->currentPage() > 1) {
            $lastPage = $tags->lastPage();

            return to_route('admin.tags.index', [
                ...$request->except('page'),
                ...($lastPage > 1 ? ['page' => $lastPage] : []),
            ]);
        }

        $locales = $this->activeLocales();
        $publicLocales = $locales->pluck('code')->all();

        return Inertia::render('Admin/Tags/Index', [
            'tags' => $tags->through(
                fn (Tag $tag): array => $this->row($tag, $user, $publicLocales),
            ),
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'orderby' => $orderBy,
                'order' => $order,
            ],
            'locales' => $locales,
            'can' => [
                'create' => $user->can('create', Tag::class),
            ],
        ]);
    }

    /**
     * WordPress has no separate "add" screen: the form sits next to the list.
     */
    public function create(): RedirectResponse
    {
        return to_route('admin.tags.index');
    }

    public function store(StoreTagRequest $request): RedirectResponse
    {
        $tag = DB::transaction(function () use ($request): Tag {
            $tag = Tag::create(['slug' => $request->slug()]);

            $this->writeTranslations($tag, $request);

            return $tag;
        });

        return $this->backToIndex()
            ->with('success', 'Метка «'.$this->nameOf($tag).'» добавлена.');
    }

    public function edit(Request $request, Tag $tag): Response
    {
        /** @var User $user */
        $user = $request->user();
        $tag->load('translations')->loadCount('posts');
        $translation = Translations::pick($tag->translations);
        $locales = $this->activeLocales();

        return Inertia::render('Admin/Tags/Edit', [
            'tag' => [
                'id' => $tag->id,
                'slug' => $tag->slug,
                'name' => $translation?->name ?? $tag->slug,
                'translations' => $tag->translations->mapWithKeys(
                    fn (TagTranslation $row): array => [$row->locale => ['name' => $row->name]],
                ),
                'posts_count' => $tag->posts_count,
                'view_url' => $this->viewUrl($tag, $translation?->locale, $locales->pluck('code')->all()),
            ],
            'locales' => $locales,
            'can' => [
                'delete' => $user->can('delete', $tag),
            ],
        ]);
    }

    /**
     * Stays on the edit screen afterwards, as WordPress does.
     */
    public function update(UpdateTagRequest $request, Tag $tag): RedirectResponse
    {
        DB::transaction(function () use ($request, $tag): void {
            $tag->update(['slug' => $request->slug()]);
            $this->writeTranslations($tag, $request);
        });

        return to_route('admin.tags.edit', $tag)
            ->with('success', 'Метка «'.$this->nameOf($tag).'» обновлена.');
    }

    /**
     * The posts stay; they just lose this tag.
     */
    public function destroy(Tag $tag): RedirectResponse
    {
        $name = $this->nameOf($tag);
        $tag->delete();

        return $this->backToIndex()->with('success', "Метка «{$name}» удалена.");
    }

    public function bulkDestroy(BulkDestroyTagsRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $ids = $request->ids();

        $deleted = DB::transaction(function () use ($ids, $user): int {
            $deleted = 0;

            foreach (Tag::query()->whereKey($ids)->get() as $tag) {
                if ($user->can('delete', $tag)) {
                    $tag->delete();
                    $deleted++;
                }
            }

            return $deleted;
        });

        $message = "Удалено меток: {$deleted}.";
        $skipped = count($ids) - $deleted;

        if ($skipped > 0) {
            $message .= " Пропущено: {$skipped} (нет прав на удаление или метка уже удалена).";
        }

        return $this->backToIndex()->with($deleted > 0 ? 'success' : 'error', $message);
    }

    /**
     * @param  list<string>  $publicLocales
     * @return array<string, mixed>
     */
    private function row(Tag $tag, User $user, array $publicLocales): array
    {
        $translation = Translations::pick($tag->translations);

        return [
            'id' => $tag->id,
            'slug' => $tag->slug,
            'name' => $translation?->name ?? $tag->slug,
            'name_locale' => $translation?->locale,
            'posts_count' => $tag->posts_count,
            'view_url' => $this->viewUrl($tag, $translation?->locale, $publicLocales),
            'can' => [
                'update' => $user->can('update', $tag),
                'delete' => $user->can('delete', $tag),
            ],
        ];
    }

    /**
     * The tag's posts on the public site, in the language of the name shown
     * (or the first site language).
     *
     * @param  list<string>  $publicLocales
     */
    private function viewUrl(Tag $tag, ?string $locale, array $publicLocales): ?string
    {
        $locale = in_array($locale, $publicLocales, true) ? $locale : ($publicLocales[0] ?? null);

        return $locale !== null
            ? route('news.index', ['locale' => $locale, 'tag' => $tag->slug])
            : null;
    }

    /**
     * Upserts every named language and removes the ones cleared in the form.
     */
    private function writeTranslations(Tag $tag, TermFormRequest $request): void
    {
        foreach ($request->namedTranslations() as $locale => $fields) {
            $tag->translations()->updateOrCreate(['locale' => $locale], $fields);
        }

        $cleared = $request->clearedLocales();

        if ($cleared !== []) {
            $tag->translations()->whereIn('locale', $cleared)->delete();
        }
    }

    private function nameOf(Tag $tag): string
    {
        $tag->load('translations');

        return Translations::pick($tag->translations)?->name ?? $tag->slug;
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
        $index = route('admin.tags.index');
        $previous = parse_url(url()->previous());

        if (($previous['path'] ?? null) === parse_url($index, PHP_URL_PATH) && isset($previous['query'])) {
            return redirect()->to($index.'?'.$previous['query']);
        }

        return redirect()->to($index);
    }
}
