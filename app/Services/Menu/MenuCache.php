<?php

declare(strict_types=1);

namespace App\Services\Menu;

use App\Http\Resources\MenuResource;
use App\Models\Menu;
use Illuminate\Support\Facades\Cache;

/**
 * Per-locale cache for the fully-resolved public menu tree.
 *
 * The tree is rebuilt every request without this cache (HandleInertiaRequests
 * runs `Menu::with('items.translations')->get()` on every page load). Caching
 * the resolved output is safe because we explicitly invalidate from
 * MenuService / MenuItemService on every write.
 */
final class MenuCache
{
    private const PREFIX = 'menus.tree.v1.';

    public function __construct(private readonly MenuItemUrlResolver $resolver) {}

    /**
     * @return array<string, array<string, mixed>>
     */
    public function get(string $locale): array
    {
        return Cache::rememberForever(self::PREFIX.$locale, function () use ($locale): array {
            return Menu::query()
                ->with(['items.translations'])
                ->get()
                ->keyBy('slug')
                ->map(fn (Menu $menu): array => MenuResource::forPublic($menu, $locale, $this->resolver))
                ->all();
        });
    }

    /**
     * Invalidate every locale's snapshot. Called after any Menu / MenuItem write.
     */
    public function flush(): void
    {
        // Active locales drive what we store; flush each. Inactive locales have no
        // cached row to evict.
        foreach (\App\Models\Locale::where('is_active', true)->pluck('code') as $code) {
            Cache::forget(self::PREFIX.(string) $code);
        }
    }
}
