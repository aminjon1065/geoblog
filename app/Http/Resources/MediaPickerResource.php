<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Media;
use Illuminate\Support\Facades\Storage;

/**
 * Media library item as the editors see it: the media picker, drag-and-drop
 * uploads into the text and the WordPress-style library grid.
 *
 * `path` is root-relative ("/storage/media/…"): it is what goes into saved
 * HTML, so content survives a change of host or port.
 */
final class MediaPickerResource
{
    /**
     * @return array{
     *     id: int,
     *     url: string,
     *     path: string,
     *     name: string,
     *     file_name: string,
     *     mime_type: string,
     *     ext: string,
     *     size: string,
     *     bytes: int,
     *     width: int|null,
     *     height: int|null,
     *     alt: string|null,
     *     title: string|null,
     *     caption: string|null,
     *     is_image: bool,
     *     folder_id: int|null,
     *     created_at: string|null,
     * }
     */
    public static function make(Media $media): array
    {
        $url = Storage::disk($media->disk)->url($media->path);
        $fileName = $media->original_name ?: basename($media->path);

        return [
            'id' => $media->id,
            'url' => $url,
            'path' => (string) (parse_url($url, PHP_URL_PATH) ?: $url),
            'name' => $media->name ?: $fileName,
            'file_name' => $fileName,
            'mime_type' => $media->mime_type,
            'ext' => strtoupper(pathinfo($fileName, PATHINFO_EXTENSION) ?: 'FILE'),
            'size' => self::humanSize((int) $media->size),
            'bytes' => (int) $media->size,
            'width' => $media->width,
            'height' => $media->height,
            'alt' => $media->alt,
            'title' => $media->title,
            'caption' => $media->caption,
            'is_image' => str_starts_with($media->mime_type, 'image/'),
            'folder_id' => $media->folder_id,
            'created_at' => $media->created_at?->toIso8601String(),
        ];
    }

    /**
     * "845 Б", "12 КБ", "1,4 МБ" — the way the Russian admin shows sizes.
     */
    public static function humanSize(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes.' Б';
        }

        $units = ['КБ', 'МБ', 'ГБ'];
        $value = $bytes / 1024;
        $unit = 0;

        while ($value >= 1024 && $unit < count($units) - 1) {
            $value /= 1024;
            $unit++;
        }

        $decimals = $value >= 10 ? 0 : 1;

        return str_replace('.', ',', number_format($value, $decimals, '.', '')).' '.$units[$unit];
    }
}
