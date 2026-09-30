<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\MediaFolder;

final class MediaFolderResource
{
    /**
     * Every folder as the library screens need it — the folder filter, the
     * "Папка" select of the attachment details and the folder manager — in
     * tree order. `path` is "Parent / Child / Grandchild"; counts come from
     * `withCount(['files', 'children'])` on the caller.
     *
     * @param  iterable<MediaFolder>  $folders
     * @return list<array{
     *     id: int,
     *     parent_id: int|null,
     *     name: string,
     *     path: string,
     *     depth: int,
     *     files_count: int,
     *     children_count: int,
     * }>
     */
    public static function forLibrary(iterable $folders): array
    {
        $byId = [];
        foreach ($folders as $folder) {
            $byId[$folder->id] = $folder;
        }

        $options = [];
        foreach ($byId as $folder) {
            $chain = self::chain($folder, $byId);

            $options[] = [
                'id' => $folder->id,
                'parent_id' => $folder->parent_id,
                'name' => $folder->name,
                'path' => implode(' / ', $chain),
                'depth' => count($chain) - 1,
                'files_count' => (int) ($folder->files_count ?? 0),
                'children_count' => (int) ($folder->children_count ?? 0),
            ];
        }

        usort($options, fn (array $a, array $b): int => strcmp(
            mb_strtolower($a['path']),
            mb_strtolower($b['path']),
        ));

        return $options;
    }

    /**
     * Names from the root down to the folder itself. A parent missing from
     * the set ends the chain; a broken (cyclic) tree cannot loop forever.
     *
     * @param  array<int, MediaFolder>  $byId
     * @return list<string>
     */
    private static function chain(MediaFolder $folder, array $byId): array
    {
        $names = [$folder->name];
        $seen = [$folder->id => true];
        $cursor = $folder;

        while ($cursor->parent_id !== null
            && isset($byId[$cursor->parent_id])
            && ! isset($seen[$cursor->parent_id])) {
            $cursor = $byId[$cursor->parent_id];
            $seen[$cursor->id] = true;
            array_unshift($names, $cursor->name);
        }

        return $names;
    }
}
