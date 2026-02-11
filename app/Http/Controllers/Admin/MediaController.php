<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreMediaRequest;
use App\Models\Media;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MediaController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Media/Index', [
            'media' => Media::latest()
                ->paginate(24)
                ->through(fn (Media $m) => [
                    'id' => $m->id,
                    'path' => $m->path,
                    'url' => Storage::disk($m->disk)->url($m->path),
                    'mime_type' => $m->mime_type,
                    'size' => $m->size,
                    'created_at' => $m->created_at->toDateString(),
                ]),
        ]);
    }

    public function store(StoreMediaRequest $request): RedirectResponse
    {
        foreach ($request->file('files') as $file) {
            $path = $file->store('media', 'public');

            Media::create([
                'disk' => 'public',
                'path' => $path,
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
            ]);
        }

        return back()->with('success', 'Files uploaded.');
    }

    public function destroy(Media $medium): RedirectResponse
    {
        Storage::disk($medium->disk)->delete($medium->path);
        $medium->delete();

        return back()->with('success', 'File deleted.');
    }
}
