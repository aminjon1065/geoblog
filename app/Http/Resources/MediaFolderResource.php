<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\MediaFolder;

final class MediaFolderResource
{
    /**
     * Folder card shape for the admin grid. Counts come from `withCount()` on the caller.
     *
     * @return array<string, mixed>
     */
    public static function forAdminGrid(MediaFolder $folder): array
    {
        return [
            'id' => $folder->id,
            'parent_id' => $folder->parent_id,
            'name' => $folder->name,
            'slug' => $folder->slug,
            'children_count' => (int) ($folder->children_count ?? 0),
            'files_count' => (int) ($folder->files_count ?? 0),
        ];
    }

    /**
     * Resolve a breadcrumb chain (root → current folder, inclusive) for the header.
     *
     * @return list<array{id: int, name: string}>
     */
    public static function breadcrumb(?MediaFolder $folder): array
    {
        if ($folder === null) {
            return [];
        }

        $chain = $folder->ancestors();
        $chain[] = $folder;

        return array_map(
            fn (MediaFolder $f): array => ['id' => $f->id, 'name' => $f->name],
            $chain,
        );
    }

    /**
     * Flat options list for the "move to folder" select. Path is the
     * "Parent / Child / Grandchild" string formed from the ancestor chain.
     *
     * @param  iterable<MediaFolder>  $folders
     * @return list<array{id: int, path: string}>
     */
    public static function optionList(iterable $folders): array
    {
        $byId = [];
        foreach ($folders as $folder) {
            $byId[$folder->id] = $folder;
        }

        $resolvePath = function (MediaFolder $folder) use (&$byId, &$resolvePath): string {
            if ($folder->parent_id === null || ! isset($byId[$folder->parent_id])) {
                return $folder->name;
            }

            return $resolvePath($byId[$folder->parent_id]).' / '.$folder->name;
        };

        $options = [];
        foreach ($byId as $folder) {
            $options[] = ['id' => $folder->id, 'path' => $resolvePath($folder)];
        }

        usort($options, fn (array $a, array $b): int => strcmp($a['path'], $b['path']));

        return $options;
    }
}
