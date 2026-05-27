<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Media;
use Illuminate\Support\Facades\Storage;

final class MediaResource
{
    /**
     * Grid-card shape for Admin\Media\Index.
     *
     * @return array<string, mixed>
     */
    public static function forAdminGrid(Media $media): array
    {
        return [
            'id' => $media->id,
            'folder_id' => $media->folder_id,
            'name' => $media->name ?? $media->original_name ?? $media->path,
            'original_name' => $media->original_name,
            'alt' => $media->alt,
            'title' => $media->title,
            'caption' => $media->caption,
            'disk' => $media->disk,
            'path' => $media->path,
            'url' => Storage::disk($media->disk)->url($media->path),
            'mime_type' => $media->mime_type,
            'size' => $media->size,
            'width' => $media->width,
            'height' => $media->height,
            'created_at' => $media->created_at?->toIso8601String(),
        ];
    }
}
