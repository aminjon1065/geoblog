<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Cms\Blocks\BlockRegistry;
use App\DataTransferObjects\Content\ContentPageData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreContentPageRequest;
use App\Http\Requests\Admin\UpdateContentPageRequest;
use App\Http\Resources\ContentPageResource;
use App\Models\ContentPage;
use App\Models\Locale;
use App\Services\Content\ContentPageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
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

        $pages = ContentPage::query()
            ->with('translation')
            ->when($search !== '', fn ($q) => $q->where(function ($query) use ($search) {
                $query->where('slug', 'like', "%{$search}%")
                    ->orWhereHas('translations', fn ($t) => $t->where('title', 'like', "%{$search}%"));
            }))
            ->when(in_array($status, ['draft', 'published'], true), fn ($q) => $q->where('status', $status))
            ->latest('updated_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (ContentPage $p) => ContentPageResource::forAdminIndex($p));

        return Inertia::render('Admin/Content/Index', [
            'pages' => $pages,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => $status !== '' ? $status : null,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Content/Create', [
            'locales' => Locale::where('is_active', true)->orderBy('sort_order')->get(),
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
            ->with('success', 'Page created. Add blocks below.');
    }

    public function edit(ContentPage $contentPage): Response
    {
        $contentPage->load(['translations', 'blocks.translations']);

        return Inertia::render('Admin/Content/Edit', [
            'page' => ContentPageResource::forAdminEdit($contentPage),
            'locales' => Locale::where('is_active', true)->orderBy('sort_order')->get(),
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

        return back()->with('success', 'Page updated.');
    }

    public function destroy(ContentPage $contentPage): RedirectResponse
    {
        $this->service->delete($contentPage);

        return to_route('admin.content-pages.index')->with('success', 'Page deleted.');
    }

    /**
     * Flat option list for the parent selector. Excludes the page being edited so
     * an admin can't make a page its own parent through the dropdown.
     *
     * @return list<array{id: int, slug: string}>
     */
    private function parentOptions(?int $excludeId = null): array
    {
        return ContentPage::query()
            ->when($excludeId !== null, fn ($q) => $q->where('id', '!=', $excludeId))
            ->orderBy('slug')
            ->get(['id', 'slug'])
            ->map(fn (ContentPage $p): array => ['id' => $p->id, 'slug' => $p->slug])
            ->all();
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
}
