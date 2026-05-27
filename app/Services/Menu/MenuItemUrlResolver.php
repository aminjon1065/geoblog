<?php

declare(strict_types=1);

namespace App\Services\Menu;

use App\Models\ContentPage;
use App\Models\MenuItem;

/**
 * Resolves a {@see MenuItem} to its final URL for rendering on the public site.
 *
 *   internal -> "/{locale}{link_target}"  (link_target starts with "/")
 *   external -> link_target verbatim
 *   page     -> "/{locale}/p/{slug}"      (slug looked up from ContentPage by id)
 *
 * Page lookups are cached per request — for a typical header menu with N items
 * the resolver runs N times so repeating queries would be wasteful.
 */
final class MenuItemUrlResolver
{
    /** @var array<int, ?string> */
    private array $pageSlugCache = [];

    public function resolve(MenuItem $item, string $locale): string
    {
        $target = $item->link_target ?? '';

        return match ($item->link_type) {
            'external' => $target,
            'page' => $this->resolvePageUrl($target, $locale),
            default => $this->resolveInternalUrl($target, $locale),
        };
    }

    private function resolveInternalUrl(string $target, string $locale): string
    {
        // Home item: target "/" should produce "/{locale}" (no trailing slash) so it
        // matches the canonical home URL produced by the frontend `url()` helper.
        if ($target === '' || $target === '/') {
            return "/{$locale}";
        }

        $path = $target[0] === '/' ? $target : '/'.$target;

        return "/{$locale}{$path}";
    }

    private function resolvePageUrl(string $idLike, string $locale): string
    {
        $id = (int) $idLike;
        if ($id === 0) {
            return "/{$locale}";
        }

        if (! array_key_exists($id, $this->pageSlugCache)) {
            $this->pageSlugCache[$id] = ContentPage::query()
                ->whereKey($id)
                ->value('slug');
        }

        $slug = $this->pageSlugCache[$id];

        return $slug === null
            ? "/{$locale}"
            : "/{$locale}/p/{$slug}";
    }
}
