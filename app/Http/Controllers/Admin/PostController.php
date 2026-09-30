<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\DataTransferObjects\Content\PostData;
use App\DataTransferObjects\Content\QuickPostData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\QuickEditPostRequest;
use App\Http\Requests\Admin\StorePostRequest;
use App\Http\Requests\Admin\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Category;
use App\Models\Locale;
use App\Models\Media;
use App\Models\Post;
use App\Models\PostTranslation;
use App\Models\Tag;
use App\Models\User;
use App\Services\Content\PostService;
use App\Support\Translations;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller implements HasMiddleware
{
    /**
     * List views, WordPress-style ("Все | Мои | Опубликованные | …"), in order.
     *
     * @var array<string, string>
     */
    private const VIEWS = [
        'all' => 'Все',
        'mine' => 'Мои',
        'published' => 'Опубликованные',
        'scheduled' => 'Запланированные',
        'pending' => 'На утверждении',
        'draft' => 'Черновики',
        'trash' => 'Корзина',
    ];

    public function __construct(private readonly PostService $service) {}

    public static function middleware(): array
    {
        return [
            new Middleware('can:viewAny,'.Post::class, only: ['index']),
            new Middleware('can:create,'.Post::class, only: ['create', 'store']),
            new Middleware('can:update,post', only: ['edit', 'update', 'quickUpdate']),
            new Middleware('can:delete,post', only: ['destroy']),
        ];
    }

    public function index(Request $request): Response
    {
        $viewer = $request->user();
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $view = array_key_exists($status, self::VIEWS) ? $status : 'all';
        $authorId = $request->integer('author');
        $categoryId = $request->integer('category');
        $month = $request->string('month')->trim()->toString();
        $orderBy = in_array($request->string('orderby')->toString(), ['title', 'date'], true)
            ? $request->string('orderby')->toString()
            : 'date';
        $order = $request->string('order')->toString() === 'asc' ? 'asc' : 'desc';

        $query = Post::query()
            ->with([
                'translations:id,post_id,locale,title',
                'author:id,name',
                'categories.translations:id,category_id,locale,name',
                'tags.translations:id,tag_id,locale,name',
            ]);

        $this->applyView($query, $view, $viewer);
        $this->applyFilters($query, $search, $authorId, $categoryId, $month);

        if ($orderBy === 'title') {
            $query->orderBy(
                PostTranslation::query()
                    ->select('title')
                    ->whereColumn('post_translations.post_id', 'posts.id')
                    ->orderByRaw('locale = ? desc', [app()->getLocale()])
                    ->limit(1),
                $order,
            );
        } else {
            $query->orderByRaw('COALESCE(published_at, created_at) '.$order);
        }

        $posts = $query
            ->orderBy('id', $order)
            ->paginate(20)
            ->withQueryString()
            ->through(fn (Post $post) => PostResource::forAdminIndex($post, $viewer));

        return Inertia::render('Admin/Posts/Index', [
            'posts' => $posts,
            'views' => $this->viewCounts($viewer),
            'filters' => [
                'status' => $view === 'all' ? null : $view,
                'search' => $search !== '' ? $search : null,
                'author' => $authorId > 0 ? $authorId : null,
                'category' => $categoryId > 0 ? $categoryId : null,
                'month' => $month !== '' ? $month : null,
                'orderby' => $orderBy,
                'order' => $order,
            ],
            'authors' => User::query()
                ->whereHas('posts')
                ->orderBy('name')
                ->get(['id', 'name']),
            'categories' => Category::query()
                ->with('translations:id,category_id,locale,name')
                ->orderBy('sort_order')
                ->get()
                ->map(fn (Category $category): array => [
                    'id' => $category->id,
                    'name' => Translations::pick($category->translations)?->name ?? $category->slug,
                ]),
            'tags' => Tag::query()
                ->with('translations:id,tag_id,locale,name')
                ->orderBy('slug')
                ->get()
                ->map(fn (Tag $tag): array => [
                    'id' => $tag->id,
                    'name' => Translations::pick($tag->translations)?->name ?? $tag->slug,
                ]),
            'months' => $this->months(),
            'can' => [
                'create' => $viewer?->can('create', Post::class) ?? false,
                'publish' => $viewer?->can('publish', Post::class) ?? false,
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Admin/Posts/Create', [
            'post' => null,
            ...$this->editorProps($request),
        ]);
    }

    public function store(StorePostRequest $request): RedirectResponse
    {
        $post = $this->service->create(
            PostData::fromRequest($request),
            $request->user(),
        );

        return to_route('admin.posts.edit', $post)->with('success', $this->savedMessage($post, null));
    }

    public function edit(Request $request, Post $post): Response
    {
        $post->load(['translations', 'categories', 'tags', 'author:id,name', 'ogImage']);

        return Inertia::render('Admin/Posts/Edit', [
            'post' => PostResource::forAdminEdit($post),
            ...$this->editorProps($request),
        ]);
    }

    public function update(UpdatePostRequest $request, Post $post): RedirectResponse
    {
        $previousStatus = $post->status;

        $this->service->update($post, PostData::fromRequest($request, $post));

        return to_route('admin.posts.edit', $post)
            ->with('success', $this->savedMessage($post->refresh(), $previousStatus));
    }

    /** "Свойства" (Quick Edit) from the posts list; stays on the list. */
    public function quickUpdate(QuickEditPostRequest $request, Post $post): RedirectResponse
    {
        $this->service->quickUpdate($post, QuickPostData::fromRequest($request, $post));

        return back()->with('success', 'Запись обновлена.');
    }

    /** "Удалить" in WordPress terms: moves the post to the trash. */
    public function destroy(Post $post): RedirectResponse
    {
        $this->service->trash($post);

        return to_route('admin.posts.index')->with('success', 'Запись перемещена в корзину.');
    }

    /**
     * Everything the editor needs besides the post itself.
     *
     * @return array<string, mixed>
     */
    private function editorProps(Request $request): array
    {
        $user = $request->user();

        return [
            'locales' => Locale::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(['code', 'name']),
            'categories' => Category::query()
                ->with('translations:id,category_id,locale,name')
                ->orderBy('sort_order')
                ->get()
                ->map(fn (Category $category): array => [
                    'id' => $category->id,
                    'slug' => $category->slug,
                    'names' => Translations::names($category->translations),
                ]),
            'tags' => Tag::query()
                ->with('translations:id,tag_id,locale,name')
                ->orderBy('slug')
                ->get()
                ->map(fn (Tag $tag): array => [
                    'id' => $tag->id,
                    'slug' => $tag->slug,
                    'names' => Translations::names($tag->translations),
                ]),
            'can' => [
                'publish' => $user?->can('publish', Post::class) ?? false,
                'create_categories' => $user?->can('create', Category::class) ?? false,
                'create_tags' => $user?->can('create', Tag::class) ?? false,
                'upload_media' => $user?->can('create', Media::class) ?? false,
            ],
            'site_url' => url('/'),
        ];
    }

    /**
     * @param  Builder<Post>  $query
     */
    private function applyView(Builder $query, string $view, ?User $viewer): void
    {
        match ($view) {
            'mine' => $query->where('author_id', $viewer?->id),
            'published' => $query->published(),
            'scheduled' => $query->scheduled(),
            'pending' => $query->where('status', Post::STATUS_PENDING),
            'draft' => $query->where('status', Post::STATUS_DRAFT),
            'trash' => $query->onlyTrashed(),
            default => null,
        };
    }

    /**
     * @param  Builder<Post>  $query
     */
    private function applyFilters(Builder $query, string $search, int $authorId, int $categoryId, string $month): void
    {
        if ($search !== '') {
            $like = '%'.addcslashes($search, '%_\\').'%';

            $query->where(function (Builder $inner) use ($like): void {
                $inner->where('slug', 'like', $like)
                    ->orWhereHas('translations', function (Builder $translation) use ($like): void {
                        $translation->where('title', 'like', $like)
                            ->orWhere('excerpt', 'like', $like);
                    });
            });
        }

        if ($authorId > 0) {
            $query->where('author_id', $authorId);
        }

        if ($categoryId > 0) {
            $query->whereHas('categories', fn (Builder $category) => $category->whereKey($categoryId));
        }

        if (preg_match('/^(\d{4})-(\d{2})$/', $month, $matches) === 1) {
            $start = CarbonImmutable::create((int) $matches[1], (int) $matches[2], 1)->startOfMonth();
            $end = $start->endOfMonth();

            $query->where(function (Builder $inner) use ($start, $end): void {
                $inner->whereBetween('published_at', [$start, $end])
                    ->orWhere(fn (Builder $draft) => $draft
                        ->whereNull('published_at')
                        ->whereBetween('created_at', [$start, $end]));
            });
        }
    }

    /**
     * @return list<array{key: string, label: string, count: int}>
     */
    private function viewCounts(?User $viewer): array
    {
        $views = [];

        foreach (self::VIEWS as $key => $label) {
            $query = Post::query();
            $this->applyView($query, $key, $viewer);
            $count = $query->count();

            // WordPress only lists the views that have posts ("Все" always).
            if ($key === 'all' || $count > 0) {
                $views[] = ['key' => $key, 'label' => $label, 'count' => $count];
            }
        }

        return $views;
    }

    /**
     * Months with posts, newest first, for the "Все даты" filter.
     *
     * @return list<array{value: string, label: string}>
     */
    private function months(): array
    {
        $names = [
            1 => 'Январь', 2 => 'Февраль', 3 => 'Март', 4 => 'Апрель', 5 => 'Май', 6 => 'Июнь',
            7 => 'Июль', 8 => 'Август', 9 => 'Сентябрь', 10 => 'Октябрь', 11 => 'Ноябрь', 12 => 'Декабрь',
        ];

        return Post::query()
            ->get(['published_at', 'created_at'])
            ->map(fn (Post $post) => ($post->published_at ?? $post->created_at)?->format('Y-m'))
            ->filter()
            ->unique()
            ->sortDesc()
            ->values()
            ->map(function (string $value) use ($names): array {
                [$year, $month] = explode('-', $value);

                return ['value' => $value, 'label' => $names[(int) $month].' '.$year];
            })
            ->all();
    }

    private function savedMessage(Post $post, ?string $previousStatus): string
    {
        if ($post->status === Post::STATUS_PENDING) {
            return 'Запись отправлена на утверждение.';
        }

        if ($post->isScheduled()) {
            return 'Запись запланирована на '.$post->published_at?->timezone(config('app.timezone'))->format('d.m.Y H:i').'.';
        }

        if ($post->status === Post::STATUS_PUBLISHED) {
            return $previousStatus === Post::STATUS_PUBLISHED ? 'Запись обновлена.' : 'Запись опубликована.';
        }

        return $previousStatus === Post::STATUS_PUBLISHED
            ? 'Запись переведена в черновики.'
            : 'Черновик сохранён.';
    }
}
