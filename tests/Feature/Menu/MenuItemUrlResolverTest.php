<?php

use App\Models\ContentPage;
use App\Models\Locale;
use App\Models\Menu;
use App\Services\Menu\MenuItemUrlResolver;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
});

test('internal home target resolves without trailing slash', function () {
    $menu = Menu::create(['slug' => 'h', 'name' => 'H']);
    $item = $menu->items()->create([
        'parent_id' => null, 'sort_order' => 1, 'link_type' => 'internal', 'link_target' => '/',
    ]);

    expect(app(MenuItemUrlResolver::class)->resolve($item, 'ru'))->toBe('/ru');
});

test('internal path target is locale-prefixed', function () {
    $menu = Menu::create(['slug' => 'h', 'name' => 'H']);
    $item = $menu->items()->create([
        'parent_id' => null, 'sort_order' => 1, 'link_type' => 'internal', 'link_target' => '/news',
    ]);

    expect(app(MenuItemUrlResolver::class)->resolve($item, 'en'))->toBe('/en/news');
});

test('external target is passed through verbatim', function () {
    $menu = Menu::create(['slug' => 'h', 'name' => 'H']);
    $item = $menu->items()->create([
        'parent_id' => null, 'sort_order' => 1, 'link_type' => 'external',
        'link_target' => 'https://example.com',
    ]);

    expect(app(MenuItemUrlResolver::class)->resolve($item, 'ru'))->toBe('https://example.com');
});

test('page target resolves to /{locale}/p/{slug}', function () {
    $page = ContentPage::create(['slug' => 'about-us', 'status' => 'published', 'published_at' => now()->subDay()]);
    $menu = Menu::create(['slug' => 'h', 'name' => 'H']);
    $item = $menu->items()->create([
        'parent_id' => null, 'sort_order' => 1, 'link_type' => 'page',
        'link_target' => (string) $page->id,
    ]);

    expect(app(MenuItemUrlResolver::class)->resolve($item, 'ru'))->toBe('/ru/p/about-us');
});

test('page target with missing page falls back to locale root', function () {
    $menu = Menu::create(['slug' => 'h', 'name' => 'H']);
    $item = $menu->items()->create([
        'parent_id' => null, 'sort_order' => 1, 'link_type' => 'page',
        'link_target' => '99999',
    ]);

    expect(app(MenuItemUrlResolver::class)->resolve($item, 'en'))->toBe('/en');
});

test('Inertia share exposes menus keyed by slug with resolved URLs', function () {
    $menu = Menu::create(['slug' => 'header', 'name' => 'Header']);
    $item = $menu->items()->create([
        'parent_id' => null, 'sort_order' => 1, 'link_type' => 'internal', 'link_target' => '/about',
    ]);
    $item->translations()->create(['locale' => 'ru', 'label' => 'О нас']);

    $this->get('/ru')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('menus.header.items', 1)
            ->where('menus.header.items.0.label', 'О нас')
            ->where('menus.header.items.0.url', '/ru/about'));
});
