<?php

declare(strict_types=1);

namespace App\Services\Menu;

use App\DataTransferObjects\Menu\MenuItemData;
use App\Models\Menu;
use App\Models\MenuItem;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class MenuItemService
{
    public function __construct(private readonly MenuCache $cache) {}

    public function create(Menu $menu, MenuItemData $data): MenuItem
    {
        $this->guardAgainstCycles($menu, null, $data->parentId);

        $item = DB::transaction(function () use ($menu, $data): MenuItem {
            $siblings = $menu->items()
                ->where(function ($q) use ($data) {
                    $data->parentId === null
                        ? $q->whereNull('parent_id')
                        : $q->where('parent_id', $data->parentId);
                });

            $nextOrder = (int) ($siblings->max('sort_order') ?? 0) + 1;

            $item = $menu->items()->create([
                'parent_id' => $data->parentId,
                'sort_order' => $nextOrder,
                'link_type' => $data->linkType,
                'link_target' => $data->linkTarget,
                'open_in_new_tab' => $data->openInNewTab,
            ]);

            $this->writeTranslations($item, $data);

            return $item;
        });

        $this->cache->flush();

        return $item;
    }

    public function update(MenuItem $item, MenuItemData $data): MenuItem
    {
        $this->guardAgainstCycles($item->menu, $item->id, $data->parentId);

        $item = DB::transaction(function () use ($item, $data): MenuItem {
            $item->update([
                'parent_id' => $data->parentId,
                'link_type' => $data->linkType,
                'link_target' => $data->linkTarget,
                'open_in_new_tab' => $data->openInNewTab,
            ]);

            $this->writeTranslations($item, $data);

            return $item;
        });

        $this->cache->flush();

        return $item;
    }

    public function delete(MenuItem $item): void
    {
        $item->delete();
        $this->cache->flush();
    }

    /**
     * Apply an explicit sort_order list. Ids not present keep their current order.
     *
     * @param  list<int>  $orderedIds
     */
    public function reorder(Menu $menu, array $orderedIds): void
    {
        DB::transaction(function () use ($menu, $orderedIds): void {
            foreach ($orderedIds as $position => $id) {
                $menu->items()->whereKey($id)->update(['sort_order' => $position + 1]);
            }
        });

        $this->cache->flush();
    }

    /**
     * Refuse to set parent_id to self or any descendant — would form a cycle.
     */
    private function guardAgainstCycles(Menu $menu, ?int $itemId, ?int $newParentId): void
    {
        if ($newParentId === null) {
            return;
        }

        if ($itemId !== null && $newParentId === $itemId) {
            throw new RuntimeException('A menu item cannot be its own parent.');
        }

        $cursor = MenuItem::find($newParentId);
        while ($cursor !== null) {
            if ($itemId !== null && $cursor->id === $itemId) {
                throw new RuntimeException('Cannot move an item into one of its own descendants.');
            }
            // Defence in depth: don't follow a parent chain into another menu.
            if ($cursor->menu_id !== $menu->id) {
                throw new RuntimeException('Cross-menu parent reference rejected.');
            }
            $cursor = $cursor->parent;
        }
    }

    private function writeTranslations(MenuItem $item, MenuItemData $data): void
    {
        foreach ($data->translations as $locale => $label) {
            $item->translations()->updateOrCreate(
                ['locale' => $locale],
                ['label' => $label],
            );
        }

        $item->translations()
            ->whereNotIn('locale', array_keys($data->translations))
            ->delete();
    }
}
