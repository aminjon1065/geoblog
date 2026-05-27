<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\DataTransferObjects\Media\MediaFolderData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMediaFolderRequest;
use App\Http\Requests\Admin\UpdateMediaFolderRequest;
use App\Models\MediaFolder;
use App\Services\Media\MediaFolderService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use RuntimeException;

class MediaFolderController extends Controller implements HasMiddleware
{
    public function __construct(private readonly MediaFolderService $service) {}

    public static function middleware(): array
    {
        return [
            new Middleware('can:create,'.MediaFolder::class, only: ['store']),
            new Middleware('can:update,media_folder', only: ['update']),
            new Middleware('can:delete,media_folder', only: ['destroy']),
        ];
    }

    public function store(StoreMediaFolderRequest $request): RedirectResponse
    {
        $folder = $this->service->create(MediaFolderData::fromRequest($request));

        return to_route('admin.media.index', ['folder' => $folder->id])
            ->with('success', 'Folder created.');
    }

    public function update(UpdateMediaFolderRequest $request, MediaFolder $mediaFolder): RedirectResponse
    {
        try {
            $this->service->update($mediaFolder, MediaFolderData::fromRequest($request));
        } catch (RuntimeException $e) {
            return back()->withErrors(['parent_id' => $e->getMessage()]);
        }

        return back()->with('success', 'Folder updated.');
    }

    public function destroy(MediaFolder $mediaFolder): RedirectResponse
    {
        try {
            $this->service->delete($mediaFolder);
        } catch (RuntimeException $e) {
            // Surface "folder not empty" as a 422-equivalent flash error rather than
            // letting the exception bubble to a 500 page.
            return back()->withErrors(['delete' => $e->getMessage()]);
        }

        return to_route('admin.media.index', ['folder' => $mediaFolder->parent_id])
            ->with('success', 'Folder deleted.');
    }
}
