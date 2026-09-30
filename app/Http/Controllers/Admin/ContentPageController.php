<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Cms\Blocks\BlockRegistry;
use App\DataTransferObjects\Content\ContentPageData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkContentPageActionRequest;
use App\Http\Requests\Admin\StoreContentPageRequest;
use App\Http\Requests\Admin\UpdateContentPageRequest;
use App\Http\Resources\ContentPageResource;
use App\Models\ContentPage;
use App\Models\Locale;
use App\Services\Content\ContentPageService;
use App\Support\RussianPlural;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ContentPageController extends Controller implements HasMiddleware
{
    public function __construct(
        private readonly ContentPageService $service,
        private readonly BlockRegistry $blockRegistry,
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('can:viewAny,'.ContentPage::class, only: ['index']),
            new Middleware('can:create,'.ContentPage::class, only: ['create', 'store']),
            new Middleware('can:update,content_page', only: ['edit', 'update']),
            new Middleware('can:delete,content_page', only: ['destroy']),
        ];
    }

    public function index(Request $request): Response
    {
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $status = in_array($status, ['draft', 'published'], true) ? $status : null;

        $pages = ContentPage::query()
            ->with(['translations', 'creator:id,name', 'parent.translations'])
            ->when($search !== '', fn (Builder $query) => $query->where(
                fn (Builder $inner) => $inner
                    ->where('slug', 'like', "%{$search}%")
                    ->orWhereHas('translations', fn (Builder $translation) => $translation->where('title', 'like', "%{$search}%")),
            ))
            ->when($status !== null, fn (Builder $query) => $query->where('status', $status))
            ->latest('updated_at')
            ->latest('id')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (ContentPage $page): array => ContentPageResource::forAdminIndex($page));

        return Inertia::render('Admin/Content/Index', [
            'pages' => $pages,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => $status,
            ],
            'counts' => [
                'all' => ContentPage::query()->count(),
                'published' => ContentPage::query()->where('status', 'published')->count(),
                'draft' => ContentPage::query()->where('status', 'draft')->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Content/Create', [
            'locales' => $this->activeLocales(),
            'parents' => $this->parentOptions(),
        ]);
    }

    public function store(StoreContentPageRequest $request): RedirectResponse
    {
        $page = $this->service->create(
            ContentPageData::fromRequest($request),
            $request->user(),
        );

        return to_route('admin.content-pages.edit', $page)
            ->with('success', 'Страница создана. Теперь добавьте на неё блоки.');
    }

    public function edit(ContentPage $contentPage): Response
    {
        $contentPage->load(['translations', 'blocks.translations', 'creator:id,name']);

        return Inertia::render('Admin/Content/Edit', [
            'page' => ContentPageResource::forAdminEdit($contentPage),
            'locales' => $this->activeLocales(),
            'parents' => $this->parentOptions($contentPage->id),
            // The frontend needs to know which block types exist so the "Add Block"
            // dropdown stays in sync with the registry without a separate config call.
            'blockTypes' => $this->blockTypeOptions(),
        ]);
    }

    public function update(UpdateContentPageRequest $request, ContentPage $contentPage): RedirectResponse
    {
        $this->service->update(
            $contentPage,
            ContentPageData::fromRequest($request),
            $request->user(),
        );

        return to_route('admin.content-pages.edit', $contentPage)->with('success', 'Страница обновлена.');
    }

    public function destroy(ContentPage $contentPage): RedirectResponse
    {
        $this->service->delete($contentPage);

        return to_route('admin.content-pages.index')->with('success', 'Страница удалена.');
    }

    /**
     * Publish, unpublish or delete the ticked pages.
     */
    public function bulk(BulkContentPageActionRequest $request): RedirectResponse
    {
        $action = (string) $request->validated('action');
        $ability = $action === 'delete' ? 'delete' : 'update';
        $pages = ContentPage::query()->whereKey($request->validated('ids'))->get();
        $user = $request->user();

        abort_unless(
            $pages->every(fn (ContentPage $page): bool => $user?->can($ability, $page) ?? false),
            403,
        );

        if ($pages->isEmpty()) {
            return back()->with('error', 'Отмеченные страницы не найдены — возможно, их уже удалили.');
        }

        DB::transaction(function () use ($pages, $action, $user): void {
            foreach ($pages as $page) {
                match ($action) {
                    'publish' => $this->service->setStatus($page, 'published', $user),
                    'draft' => $this->service->setStatus($page, 'draft', $user),
                    default => $this->service->delete($page),
                };
            }
        });

        $forms = match ($action) {
            'publish' => ':count страница опубликована|:count страницы опубликованы|:count страниц опубликовано',
            'draft' => ':count страница переведена в черновики|:count страницы переведены в черновики|:count страниц переведено в черновики',
            default => ':count страница удалена|:count страницы удалены|:count страниц удалено',
        };

        return back()->with('success', RussianPlural::format($forms, $pages->count()).'.');
    }

    /**
     * Option list for the parent selector. Leaves out the page being edited
     * and its subpages, so the dropdown cannot turn the tree into a loop.
     *
     * @return list<array{id: int, slug: string, title: string}>
     */
    private function parentOptions(?int $excludeId = null): array
    {
        $pages = ContentPage::query()
            ->with('translations')
            ->orderBy('slug')
            ->get(['id', 'slug', 'parent_id']);

        $excluded = $excludeId !== null ? $this->withDescendants($pages, $excludeId) : [];

        return $pages
            ->reject(fn (ContentPage $page): bool => in_array($page->id, $excluded, true))
            ->map(fn (ContentPage $page): array => [
                'id' => $page->id,
                'slug' => $page->slug,
                'title' => ContentPageResource::title($page),
            ])
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, ContentPage>  $pages
     * @return list<int>
     */
    private function withDescendants(Collection $pages, int $rootId): array
    {
        $childrenOf = $pages->groupBy('parent_id');
        $ids = [];
        $queue = [$rootId];

        while ($queue !== []) {
            $id = array_shift($queue);

            if (in_array($id, $ids, true)) {
                continue;
            }

            $ids[] = $id;

            foreach ($childrenOf->get($id, collect()) as $child) {
                $queue[] = $child->id;
            }
        }

        return $ids;
    }

    /**
     * @return list<array{key: string, label: string, settingsSchema: array<string, string>, contentSchema: array<string, string>}>
     */
    private function blockTypeOptions(): array
    {
        $out = [];
        foreach ($this->blockRegistry->all() as $type) {
            $out[] = [
                'key' => $type->key(),
                'label' => $type->label(),
                'settingsSchema' => $type->settingsSchema(),
                'contentSchema' => $type->contentSchema(),
            ];
        }

        return $out;
    }

    /**
     * @return Collection<int, Locale>
     */
    private function activeLocales(): Collection
    {
        return Locale::query()->where('is_active', true)->orderBy('sort_order')->get();
    }
}
