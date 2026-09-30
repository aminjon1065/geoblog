<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\DataTransferObjects\Media\MediaLibraryFilters;
use App\DataTransferObjects\Media\MediaUpdateData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkDestroyMediaRequest;
use App\Http\Requests\Admin\StoreMediaRequest;
use App\Http\Requests\Admin\UpdateMediaRequest;
use App\Http\Resources\MediaFolderResource;
use App\Http\Resources\MediaPickerResource;
use App\Http\Resources\MediaResource;
use App\Models\Media;
use App\Models\MediaFolder;
use App\Services\Media\MediaLibraryQuery;
use App\Services\Media\MediaService;
use App\Services\Media\MediaUsageResolver;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The WordPress-style media library: "Медиатека" (grid and list modes with
 * the attachment details modal), "Загрузить медиафайлы" and the JSON
 * answers the library screens need (details, autosave, deletion).
 */
class MediaController extends Controller implements HasMiddleware
{
    /** Tiles per load in grid mode — the library endpoint's page size. */
    public const GRID_PER_PAGE = 40;

    /** Rows per page in list mode, as in WordPress. */
    public const LIST_PER_PAGE = 20;

    public function __construct(
        private readonly MediaService $service,
        private readonly MediaLibraryQuery $library,
        private readonly MediaUsageResolver $usage,
    ) {}

    public static function middleware(): array
    {
        return [
            new Middleware('can:viewAny,'.Media::class, only: ['index']),
            new Middleware('can:view,medium', only: ['show']),
            new Middleware('can:create,'.Media::class, only: ['create', 'store']),
            new Middleware('can:update,medium', only: ['update']),
            new Middleware('can:delete,medium', only: ['destroy']),
            new Middleware('can:deleteAny,'.Media::class, only: ['bulkDestroy']),
        ];
    }

    public function index(Request $request): Response
    {
        $filters = MediaLibraryFilters::fromRequest($request);
        $mode = $request->string('mode')->toString() === 'list' ? 'list' : 'grid';
        [$orderBy, $order] = $this->listSorting($request);

        // Closures: the screen's background refreshes (`only: months, folders`)
        // skip the queries they don't need.
        return Inertia::render('Admin/Media/Index', [
            'mode' => $mode,
            'filters' => $filters->toArray(),
            'sorting' => ['orderby' => $orderBy, 'order' => $order],
            'media' => fn (): array => $mode === 'list'
                ? $this->listPage($filters, $orderBy, $order)
                : $this->gridPage($filters),
            'months' => fn (): array => $this->library->months(),
            'folders' => fn (): array => $this->folders(),
            'item' => fn (): ?array => $this->requestedItem($request),
            'upload' => fn (): array => $this->service->uploadLimits(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Media/Create', [
            'folders' => $this->folders(),
            'upload' => $this->service->uploadLimits(),
        ]);
    }

    public function store(StoreMediaRequest $request): RedirectResponse
    {
        $folderId = $request->validated('folder_id');
        $folderId = $folderId !== null && $folderId !== '' ? (int) $folderId : null;

        $uploaded = 0;
        foreach ($request->file('files') as $file) {
            $this->service->upload($file, $folderId);
            $uploaded++;
        }

        return back()->with('success', "Загружено файлов: {$uploaded}.");
    }

    /**
     * Attachment details as JSON; a browser landing here is sent to the
     * library with the file open (`/admin/media?item=…`, like upload.php).
     */
    public function show(Request $request, Media $medium): JsonResponse|RedirectResponse
    {
        if (! $request->wantsJson()) {
            return to_route('admin.media.index', ['item' => $medium->id]);
        }

        return response()->json([
            'data' => MediaResource::details($medium, $this->usage->usagesOf($medium, $request->user())),
        ]);
    }

    public function update(UpdateMediaRequest $request, Media $medium): JsonResponse|RedirectResponse
    {
        $media = $this->service->update($medium, MediaUpdateData::fromRequest($request, $medium));

        if ($request->wantsJson()) {
            return response()->json(['data' => MediaPickerResource::make($media)]);
        }

        return back()->with('success', 'Медиафайл обновлён.');
    }

    public function destroy(Request $request, Media $medium): JsonResponse|RedirectResponse
    {
        $this->service->delete($medium);

        $message = 'Медиафайл удалён навсегда.';

        if ($request->wantsJson()) {
            return response()->json(['deleted' => 1, 'message' => $message]);
        }

        return back()->with('success', $message);
    }

    /**
     * "Удалить выбранные навсегда": every file is authorized before any is
     * deleted, so a batch is never half-done because of permissions.
     */
    public function bulkDestroy(BulkDestroyMediaRequest $request): JsonResponse|RedirectResponse
    {
        $media = Media::query()->whereKey($request->ids())->get();

        foreach ($media as $item) {
            Gate::authorize('delete', $item);
        }

        $deleted = $this->service->deleteMany($media);
        $message = "Удалено медиафайлов: {$deleted}.";

        if ($request->wantsJson()) {
            return response()->json(['deleted' => $deleted, 'message' => $message]);
        }

        return back()->with('success', $message);
    }

    /**
     * First page of the grid, ordered and sized like the library endpoint
     * so "Загрузить ещё" continues it seamlessly.
     *
     * @return array{data: list<array<string, mixed>>, meta: array{current_page: int, last_page: int, per_page: int, total: int}}
     */
    private function gridPage(MediaLibraryFilters $filters): array
    {
        $page = $this->library
            ->newestFirst($this->library->filtered($filters))
            ->paginate(self::GRID_PER_PAGE, page: 1);

        return [
            'data' => array_map(
                fn (Media $media): array => MediaPickerResource::make($media),
                $page->items(),
            ),
            'meta' => $this->meta($page),
        ];
    }

    /**
     * @return array{data: list<array<string, mixed>>, meta: array{current_page: int, last_page: int, per_page: int, total: int}}
     */
    private function listPage(MediaLibraryFilters $filters, string $orderBy, string $order): array
    {
        $rows = fn () => $this->usage
            ->withUsageCounts($this->library->filtered($filters))
            ->orderBy($orderBy === 'title' ? 'name' : 'created_at', $order)
            ->orderBy('id', $order);

        $page = $rows()->paginate(self::LIST_PER_PAGE)->withQueryString();

        // Deleting the last rows of the last page lands past the end: show
        // what is now the last page instead of an empty table.
        if ($page->isEmpty() && $page->total() > 0 && $page->currentPage() > $page->lastPage()) {
            $page = $rows()->paginate(self::LIST_PER_PAGE, page: $page->lastPage())->withQueryString();
        }

        return [
            'data' => array_map(
                fn (Media $media): array => MediaResource::forList($media),
                $page->items(),
            ),
            'meta' => $this->meta($page),
        ];
    }

    /**
     * List mode's sortable columns: "Файл" (title) and "Дата" (newest first
     * by default).
     *
     * @return array{0: 'title'|'date', 1: 'asc'|'desc'}
     */
    private function listSorting(Request $request): array
    {
        $orderBy = $request->string('orderby')->toString() === 'title' ? 'title' : 'date';
        $requested = $request->string('order')->lower()->toString();
        $order = in_array($requested, ['asc', 'desc'], true)
            ? $requested
            : ($orderBy === 'title' ? 'asc' : 'desc');

        return [$orderBy, $order];
    }

    /**
     * @param  LengthAwarePaginator<int, Media>  $page
     * @return array{current_page: int, last_page: int, per_page: int, total: int}
     */
    private function meta(LengthAwarePaginator $page): array
    {
        return [
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'per_page' => $page->perPage(),
            'total' => $page->total(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function folders(): array
    {
        return MediaFolderResource::forLibrary(
            MediaFolder::query()->withCount(['files', 'children'])->get(),
        );
    }

    /**
     * The file named by `?item=` — opened in the attachment details on load.
     *
     * @return array<string, mixed>|null
     */
    private function requestedItem(Request $request): ?array
    {
        if (! $request->filled('item')) {
            return null;
        }

        $media = Media::query()->find($request->integer('item'));

        return $media !== null ? MediaPickerResource::make($media) : null;
    }
}
