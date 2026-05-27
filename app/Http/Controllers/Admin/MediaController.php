<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\DataTransferObjects\Media\MediaUpdateData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMediaRequest;
use App\Http\Requests\Admin\UpdateMediaRequest;
use App\Http\Resources\MediaFolderResource;
use App\Http\Resources\MediaResource;
use App\Models\Media;
use App\Models\MediaFolder;
use App\Services\Media\MediaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller implements HasMiddleware
{
    public function __construct(private readonly MediaService $service) {}

    public static function middleware(): array
    {
        return [
            new Middleware('can:viewAny,'.Media::class, only: ['index']),
            new Middleware('can:create,'.Media::class, only: ['store']),
            new Middleware('can:update,medium', only: ['update']),
            new Middleware('can:delete,medium', only: ['destroy']),
        ];
    }

    public function index(Request $request): Response
    {
        $folderId = $request->integer('folder') ?: null;
        $search = $request->string('search')->trim()->toString();

        $currentFolder = $folderId !== null
            ? MediaFolder::with('parent')->find($folderId)
            : null;

        $childFolders = MediaFolder::query()
            ->withCount(['children', 'files'])
            ->when($folderId === null,
                fn ($q) => $q->whereNull('parent_id'),
                fn ($q) => $q->where('parent_id', $folderId),
            )
            ->orderBy('name')
            ->get();

        $files = Media::query()
            ->when($folderId === null,
                fn ($q) => $q->whereNull('folder_id'),
                fn ($q) => $q->where('folder_id', $folderId),
            )
            ->when($search !== '', fn ($q) => $q->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('original_name', 'like', "%{$search}%")
                    ->orWhere('alt', 'like', "%{$search}%");
            }))
            ->latest()
            ->paginate(24)
            ->withQueryString()
            ->through(fn (Media $m) => MediaResource::forAdminGrid($m));

        return Inertia::render('Admin/Media/Index', [
            'media' => $files,
            'folders' => $childFolders->map(fn (MediaFolder $f) => MediaFolderResource::forAdminGrid($f)),
            'currentFolder' => $currentFolder !== null ? [
                'id' => $currentFolder->id,
                'name' => $currentFolder->name,
                'parent_id' => $currentFolder->parent_id,
            ] : null,
            'breadcrumb' => MediaFolderResource::breadcrumb($currentFolder),
            // Full folder option list powers the per-file "move to" select; we don't
            // expect this to grow large enough to require pagination.
            'folderOptions' => MediaFolderResource::optionList(MediaFolder::query()->get()),
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'folder' => $folderId,
            ],
        ]);
    }

    public function store(StoreMediaRequest $request): RedirectResponse
    {
        $folderId = $request->validated('folder_id');
        $folderId = $folderId !== null && $folderId !== '' ? (int) $folderId : null;

        foreach ($request->file('files') as $file) {
            $this->service->upload($file, $folderId);
        }

        return back()->with('success', 'Files uploaded.');
    }

    public function update(UpdateMediaRequest $request, Media $medium): RedirectResponse
    {
        $this->service->update($medium, MediaUpdateData::fromRequest($request));

        return back()->with('success', 'File updated.');
    }

    public function destroy(Media $medium): RedirectResponse
    {
        $this->service->delete($medium);

        return back()->with('success', 'File deleted.');
    }
}
