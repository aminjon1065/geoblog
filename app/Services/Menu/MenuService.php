<?php

declare(strict_types=1);

namespace App\Services\Menu;

use App\DataTransferObjects\Menu\MenuData;
use App\Models\Menu;

final class MenuService
{
    public function __construct(private readonly MenuCache $cache) {}

    public function create(MenuData $data): Menu
    {
        $menu = Menu::create([
            'slug' => $data->slug,
            'name' => $data->name,
        ]);

        $this->cache->flush();

        return $menu;
    }

    public function update(Menu $menu, MenuData $data): Menu
    {
        $menu->update([
            'slug' => $data->slug,
            'name' => $data->name,
        ]);

        $this->cache->flush();

        return $menu->refresh();
    }

    public function delete(Menu $menu): void
    {
        // Items + their translations cascade via the FKs.
        $menu->delete();
        $this->cache->flush();
    }
}
