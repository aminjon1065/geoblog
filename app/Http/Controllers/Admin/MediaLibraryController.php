<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UploadMediaRequest;
use App\Http\Resources\MediaPickerResource;
use App\Models\Media;
use App\Services\Media\MediaService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

/**
 * JSON face of the media library for the editors: the picker's paginated,
 * searchable grid and single-file uploads (picker button, drag-and-drop and
 * paste into the text).
 */
class MediaLibraryController extends Controller implements HasMiddleware
{
    public function __construct(private readonly MediaService $service) {}

    public static function middleware(): array
    {
        return [
            new Middleware('can:viewAny,'.Media::class, only: ['index']),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->toString();
        $type = $request->string('type')->toString();
        $perPage = min(max($request->integer('per_page', 40), 1), 100);

        $media = Media::query()
            ->when($search !== '', function (Builder $query) use ($search): void {
                $like = '%'.addcslashes($search, '%_\\').'%';

                $query->where(function (Builder $inner) use ($like): void {
                    $inner->where('name', 'like', $like)
                        ->orWhere('original_name', 'like', $like)
                        ->orWhere('alt', 'like', $like)
                        ->orWhere('title', 'like', $like)
                        ->orWhere('caption', 'like', $like);
                });
            })
            ->when($type === 'image', fn (Builder $query) => $query->where('mime_type', 'like', 'image/%'))
            ->when($type === 'document', fn (Builder $query) => $query->where('mime_type', 'not like', 'image/%'))
            ->when($request->filled('folder'), fn (Builder $query) => $query->where('folder_id', $request->integer('folder')))
            ->when(
                $request->string('month')->match('/^\d{4}-\d{2}$/')->isNotEmpty(),
                function (Builder $query) use ($request): void {
                    [$year, $month] = explode('-', $request->string('month')->toString());
                    $query->whereYear('created_at', (int) $year)->whereMonth('created_at', (int) $month);
                },
            );

        match ($request->string('sort')->toString()) {
            'oldest' => $media->oldest()->oldest('id'),
            'name' => $media->orderBy('name')->orderBy('id'),
            default => $media->latest()->latest('id'),
        };

        $page = $media->paginate($perPage)->withQueryString();

        return response()->json([
            'data' => array_map(
                fn (Media $item): array => MediaPickerResource::make($item),
                $page->items(),
            ),
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
            ],
        ]);
    }

    public function store(UploadMediaRequest $request): JsonResponse
    {
        $folderId = $request->validated('folder_id');

        $media = $this->service->upload(
            $request->file('file'),
            $folderId !== null ? (int) $folderId : null,
        );

        if ($request->filled('alt')) {
            $media->update(['alt' => $request->string('alt')->trim()->toString()]);
        }

        return response()->json(['data' => MediaPickerResource::make($media)], 201);
    }
}
