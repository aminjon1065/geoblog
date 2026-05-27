<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Menu;
use App\Models\MenuItem;
use App\Services\Menu\MenuItemUrlResolver;

final class MenuResource
{
    /**
     * Row shape for Admin\Menus\Index.
     *
     * @return array<string, mixed>
     */
    public static function forAdminIndex(Menu $menu): array
    {
        return [
            'id' => $menu->id,
            'slug' => $menu->slug,
            'name' => $menu->name,
            'items_count' => $menu->items()->count(),
        ];
    }

    /**
     * Edit payload — full item tree with raw link_type/link_target for the builder.
     *
     * @return array<string, mixed>
     */
    public static function forAdminEdit(Menu $menu): array
    {
        $allItems = $menu->items()->with('translations')->get();

        return [
            'id' => $menu->id,
            'slug' => $menu->slug,
            'name' => $menu->name,
            'items' => self::treeForAdmin($allItems, null),
        ];
    }

    /**
     * Public shared-props shape: pre-resolved URLs per current locale; raw link_type
     * intentionally stripped so the frontend doesn't replicate routing logic.
     *
     * @return array<string, mixed>
     */
    public static function forPublic(Menu $menu, string $locale, MenuItemUrlResolver $resolver): array
    {
        $allItems = $menu->items()->with('translations')->get();

        return [
            'slug' => $menu->slug,
            'items' => self::treeForPublic($allItems, null, $locale, $resolver),
        ];
    }

    /**
     * @param  \Illuminate\Support\Collection<int, MenuItem>  $all
     * @return list<array<string, mixed>>
     */
    private static function treeForAdmin($all, ?int $parentId): array
    {
        $children = $all->filter(fn (MenuItem $i) => $i->parent_id === $parentId)
            ->sortBy('sort_order')
            ->values();

        return $children->map(fn (MenuItem $item): array => [
            'id' => $item->id,
            'parent_id' => $item->parent_id,
            'sort_order' => $item->sort_order,
            'link_type' => $item->link_type,
            'link_target' => $item->link_target,
            'open_in_new_tab' => $item->open_in_new_tab,
            'translations' => $item->translations->keyBy('locale')->map(fn ($t) => [
                'label' => $t->label,
            ]),
            'children' => self::treeForAdmin($all, $item->id),
        ])->all();
    }

    /**
     * @param  \Illuminate\Support\Collection<int, MenuItem>  $all
     * @return list<array<string, mixed>>
     */
    private static function treeForPublic(
        $all,
        ?int $parentId,
        string $locale,
        MenuItemUrlResolver $resolver,
    ): array {
        $children = $all->filter(fn (MenuItem $i) => $i->parent_id === $parentId)
            ->sortBy('sort_order')
            ->values();

        $out = [];
        foreach ($children as $item) {
            $translation = $item->translations->firstWhere('locale', $locale)
                ?? $item->translations->first();

            // Skip items the admin hasn't given any label to — better an absent link
            // than a blank one cluttering the nav.
            if ($translation === null || $translation->label === '') {
                continue;
            }

            $out[] = [
                'id' => $item->id,
                'label' => $translation->label,
                'url' => $resolver->resolve($item, $locale),
                'open_in_new_tab' => $item->open_in_new_tab,
                'children' => self::treeForPublic($all, $item->id, $locale, $resolver),
            ];
        }

        return $out;
    }
}
