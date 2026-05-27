<?php

declare(strict_types=1);

namespace App\Services\Media;

use App\DataTransferObjects\Media\MediaUpdateData;
use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Owns the write-side lifecycle of a Media row. Upload extracts image dimensions
 * via getimagesize so non-image MIME types simply receive null width/height.
 */
final class MediaService
{
    public function upload(UploadedFile $file, ?int $folderId, string $disk = 'public'): Media
    {
        $path = $file->store('media', $disk);
        $originalName = (string) $file->getClientOriginalName();

        [$width, $height] = $this->dimensions($file);

        return Media::create([
            'folder_id' => $folderId,
            'name' => $originalName,
            'original_name' => $originalName,
            'disk' => $disk,
            'path' => $path,
            'mime_type' => (string) $file->getMimeType(),
            'size' => (int) $file->getSize(),
            'width' => $width,
            'height' => $height,
        ]);
    }

    public function update(Media $media, MediaUpdateData $data): Media
    {
        $media->update([
            'folder_id' => $data->folderId,
            'name' => $data->name,
            'alt' => $data->alt,
            'title' => $data->title,
            'caption' => $data->caption,
        ]);

        return $media->refresh();
    }

    public function delete(Media $media): void
    {
        // Storage::delete is a no-op when the file is already gone — safe to call
        // even when an earlier failed upload left the row without an actual file.
        Storage::disk($media->disk)->delete($media->path);
        $media->delete();
    }

    /**
     * Extract pixel dimensions from an uploaded file. Non-image MIME types and files
     * whose contents getimagesize() can't read both return [null, null] without raising.
     *
     * @return array{0: int|null, 1: int|null}
     */
    private function dimensions(UploadedFile $file): array
    {
        if (! str_starts_with((string) $file->getMimeType(), 'image/')) {
            return [null, null];
        }

        $info = @getimagesize($file->getRealPath());

        if ($info === false) {
            return [null, null];
        }

        return [(int) $info[0], (int) $info[1]];
    }
}
