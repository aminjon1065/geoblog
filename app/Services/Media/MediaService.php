<?php

declare(strict_types=1);

namespace App\Services\Media;

use App\DataTransferObjects\Media\MediaUpdateData;
use App\Http\Requests\Admin\UploadMediaRequest;
use App\Http\Resources\MediaPickerResource;
use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Owns the write-side lifecycle of a Media row. Upload extracts image dimensions
 * via getimagesize so non-image MIME types simply receive null width/height.
 */
final class MediaService
{
    /** The library's own cap on one file, in kilobytes (validation `max:`). */
    public const MAX_UPLOAD_KILOBYTES = 10240;

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

    /**
     * "Удалить навсегда": the row goes for good (no trash — a trashed row
     * would point at a file that no longer exists), then the file. Posts
     * showing it as their featured image lose it (`og_image_id` is
     * nullOnDelete) and service galleries drop it (`media_ables` cascades).
     */
    public function delete(Media $media): void
    {
        $disk = $media->disk;
        $path = $media->path;

        $media->forceDelete();

        // Storage::delete is a no-op when the file is already gone — safe to call
        // even when an earlier failed upload left the row without an actual file.
        Storage::disk($disk)->delete($path);
    }

    /**
     * @param  iterable<Media>  $media
     * @return int number of deleted files
     */
    public function deleteMany(iterable $media): int
    {
        $deleted = 0;

        foreach ($media as $item) {
            $this->delete($item);
            $deleted++;
        }

        return $deleted;
    }

    /**
     * What the uploaders announce ("Максимальный размер загружаемого файла")
     * and check before sending: the library's cap or PHP's upload limit,
     * whichever is smaller — the way WordPress computes wp_max_upload_size().
     *
     * @return array{max_bytes: int, max_size: string, accept: string}
     */
    public function uploadLimits(): array
    {
        $maxBytes = (int) min(self::MAX_UPLOAD_KILOBYTES * 1024, UploadedFile::getMaxFilesize());

        return [
            'max_bytes' => $maxBytes,
            'max_size' => $maxBytes % (1024 * 1024) === 0
                ? intdiv($maxBytes, 1024 * 1024).' МБ'
                : MediaPickerResource::humanSize($maxBytes),
            'accept' => implode(',', UploadMediaRequest::MIME_TYPES),
        ];
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
