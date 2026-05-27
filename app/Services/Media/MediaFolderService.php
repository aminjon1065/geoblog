<?php

declare(strict_types=1);

namespace App\Services\Media;

use App\DataTransferObjects\Media\MediaFolderData;
use App\Models\MediaFolder;
use RuntimeException;

final class MediaFolderService
{
    public function create(MediaFolderData $data): MediaFolder
    {
        return MediaFolder::create([
            'parent_id' => $data->parentId,
            'name' => $data->name,
            'slug' => $data->slug,
        ]);
    }

    public function update(MediaFolder $folder, MediaFolderData $data): MediaFolder
    {
        $this->guardAgainstCycles($folder, $data->parentId);

        $folder->update([
            'parent_id' => $data->parentId,
            'name' => $data->name,
            'slug' => $data->slug,
        ]);

        return $folder->refresh();
    }

    /**
     * Delete a folder only if it has no contents. The controller surfaces this as a
     * 422 — never a silent data loss path.
     */
    public function delete(MediaFolder $folder): void
    {
        if ($folder->files()->exists() || $folder->children()->exists()) {
            throw new RuntimeException('Folder is not empty.');
        }

        $folder->delete();
    }

    /**
     * Refuse to make a folder its own ancestor.
     *
     * @throws RuntimeException
     */
    private function guardAgainstCycles(MediaFolder $folder, ?int $newParentId): void
    {
        if ($newParentId === null) {
            return;
        }

        if ($newParentId === $folder->id) {
            throw new RuntimeException('A folder cannot be its own parent.');
        }

        $cursor = MediaFolder::find($newParentId);
        while ($cursor !== null) {
            if ($cursor->id === $folder->id) {
                throw new RuntimeException('Cannot move a folder into one of its own descendants.');
            }
            $cursor = $cursor->parent;
        }
    }
}
