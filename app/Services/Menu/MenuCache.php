<?php

declare(strict_types=1);

namespace App\Services\Menu;

use App\Http\Resources\MenuResource;
use App\Models\Locale;
use App\Models\Menu;
use Illuminate\Support\Facades\Cache;

/**
 * Per-locale cache for the fully-resolved public menu tree.
 *
 * The tree is rebuilt every request without this cache (HandleInertiaRequests
 * runs `Menu::with('items.translations')->get()` on every page load). Caching
 * the resolved output is safe because we explicitly invalidate from
 * MenuService / MenuItemService on every write, and ContentPageService
 * invalidates it when a page — the target of "page" links — changes.
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
     * Invalidate every locale's snapshot. Called after any Menu / MenuItem write
     * and whenever a content page (a link target) is saved or deleted.
     */
    public function flush(): void
    {
        // Every known locale, not only the active ones: a locale switched off
        // and on again must not come back with a snapshot from before.
        foreach (Locale::query()->pluck('code') as $code) {
            Cache::forget(self::PREFIX.(string) $code);
        }
    }
}
