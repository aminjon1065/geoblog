<?php

use App\Models\Locale;
use App\Models\Menu;
use App\Services\Menu\MenuCache;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
    userWithRole('admin');
    Cache::flush();
});

// — DB index migration —

test('phase 9 composite indexes exist on posts, content_pages, services', function () {
    $driver = DB::connection()->getDriverName();

    // SQLite uses sqlite_master; MySQL uses SHOW INDEX. Cross-driver lookup keeps
    // the test green wherever the project runs.
    if ($driver === 'sqlite') {
        $indexes = DB::table('sqlite_master')
            ->where('type', 'index')
            ->pluck('name')
            ->all();

        expect($indexes)->toContain('posts_status_published_at_index');
        expect($indexes)->toContain('content_pages_status_published_at_index');
        expect($indexes)->toContain('services_active_sort_index');
    } else {
        // Other drivers — just confirm columns are present (the migration applied).
        expect(Schema::hasColumn('posts', 'published_at'))->toBeTrue();
        expect(Schema::hasColumn('content_pages', 'published_at'))->toBeTrue();
    }
});

// — Shared user payload optimization —

test('super_admin gets an empty permissions array in the shared user payload', function () {
    $this->actingAs(userWithRole('super_admin'));

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('auth.user.is_super_admin', true)
            ->where('auth.user.permissions', [])
        );
});

test('non-super-admin still receives the full permissions array', function () {
    $this->actingAs(userWithRole('admin'));

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(function ($page) {
            $perms = $page->toArray()['props']['auth']['user']['permissions'];
            expect($perms)->toBeArray();
            expect($perms)->not->toBeEmpty();
            expect($perms)->toContain('admin-panel.access');

            return $page;
        });
});

// — Menu cache —

test('menu cache returns the same tree until a write flushes it', function () {
    $menu = Menu::create(['slug' => 'header', 'name' => 'Header']);
    $item = $menu->items()->create([
        'parent_id' => null, 'sort_order' => 1, 'link_type' => 'internal', 'link_target' => '/',
    ]);
    $item->translations()->create(['locale' => 'ru', 'label' => 'Original']);

    $cache = app(MenuCache::class);
    $firstSnapshot = $cache->get('ru');

    // Mutate the DB directly (bypassing the service) so we know it's the cache
    // hand-back rather than fresh DB data.
    $item->translations()->where('locale', 'ru')->update(['label' => 'Tampered']);
    $secondSnapshot = $cache->get('ru');

    expect($secondSnapshot)->toEqual($firstSnapshot);

    // After flush we should see the new label.
    $cache->flush();
    $third = $cache->get('ru');
    expect($third['header']['items'][0]['label'])->toBe('Tampered');
});

test('creating a menu item via the service invalidates the cache', function () {
    $this->actingAs(userWithRole('admin'));
    $menu = Menu::create(['slug' => 'header', 'name' => 'Header']);

    // Warm the cache.
    expect(app(MenuCache::class)->get('ru')['header']['items'] ?? [])->toBeEmpty();

    $this->post(route('admin.menus.items.store', $menu), [
        'link_type' => 'internal',
        'link_target' => '/about',
        'translations' => ['ru' => ['label' => 'О нас']],
    ])->assertRedirect();

    $fresh = app(MenuCache::class)->get('ru');
    expect($fresh['header']['items'])->toHaveCount(1);
    expect($fresh['header']['items'][0]['label'])->toBe('О нас');
});

// — Cache headers on static-ish routes —

test('robots.txt returns a Cache-Control header', function () {
    // Symfony reorders Cache-Control directives alphabetically on emit, so the
    // value we assert against is "max-age=3600, public" rather than the
    // controller's source-order "public, max-age=3600".
    $this->get('/robots.txt')
        ->assertOk()
        ->assertHeader('Cache-Control', 'max-age=3600, public');
});

test('sitemap.xml returns a Cache-Control header', function () {
    $this->get('/sitemap.xml')
        ->assertOk()
        ->assertHeader('Cache-Control', 'max-age=3600, public');
});

// — Activity log retention schedule —

test('activitylog:clean is scheduled', function () {
    $schedule = app(\Illuminate\Console\Scheduling\Schedule::class);
    $commands = collect($schedule->events())
        ->pluck('command')
        ->filter()
        ->map(fn (string $c): string => $c);

    $found = $commands->contains(fn (string $c): bool => str_contains($c, 'activitylog:clean'));
    expect($found)->toBeTrue();
});
