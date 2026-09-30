<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Media;
use App\Services\Media\MediaUsageResolver;

/**
 * Media library shapes on top of the shared library item
 * ({@see MediaPickerResource}), so a row of the list, a tile of the grid
 * and a page appended by "Загрузить ещё" all read the same fields.
 */
final class MediaResource
{
    /**
     * A row of the list mode: the library item plus how many places use the
     * file. Expects a row loaded through MediaUsageResolver::withUsageCounts().
     *
     * @return array<string, mixed>
     */
    public static function forList(Media $media): array
    {
        return [
            ...MediaPickerResource::make($media),
            'usage_count' => MediaUsageResolver::countOf($media),
        ];
    }

    /**
     * "Параметры вложения": the library item plus the places using it.
     *
     * @param  list<array{type: string, label: string, title: string, url: string|null}>  $usage
     * @return array<string, mixed>
     */
    public static function details(Media $media, array $usage): array
    {
        return [
            ...MediaPickerResource::make($media),
            'usage' => $usage,
        ];
    }
}
