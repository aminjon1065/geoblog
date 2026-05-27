<?php

use App\Models\ContentPage;
use App\Models\Locale;
use App\Models\Menu;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
    userWithRole('admin');
    $this->menu = Menu::create(['slug' => 'main', 'name' => 'Main']);
});

test('admin can add an internal-link item with translations', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.menus.items.store', $this->menu), [
        'link_type' => 'internal',
        'link_target' => '/about',
        'translations' => ['ru' => ['label' => 'О нас']],
    ])->assertRedirect();

    $item = $this->menu->items()->firstOrFail();
    expect($item->link_type)->toBe('internal');
    expect($item->link_target)->toBe('/about');
    expect($item->translations()->where('locale', 'ru')->value('label'))->toBe('О нас');
});

test('store requires at least one translation with a label', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.menus.items.store', $this->menu), [
        'link_type' => 'internal',
        'link_target' => '/about',
        'translations' => ['ru' => ['label' => '']],
    ])->assertSessionHasErrors('translations');
});

test('internal path must start with /', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.menus.items.store', $this->menu), [
        'link_type' => 'internal',
        'link_target' => 'no-slash',
        'translations' => ['ru' => ['label' => 'x']],
    ])->assertSessionHasErrors('link_target');
});

test('external link must be an absolute URL', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.menus.items.store', $this->menu), [
        'link_type' => 'external',
        'link_target' => 'not-a-url',
        'translations' => ['ru' => ['label' => 'x']],
    ])->assertSessionHasErrors('link_target');
});

test('page link references a real ContentPage id', function () {
    $this->actingAs(userWithRole('admin'));
    $page = ContentPage::create([
        'slug' => 'about-us',
        'status' => 'published',
        'published_at' => now()->subDay(),
    ]);

    $this->post(route('admin.menus.items.store', $this->menu), [
        'link_type' => 'page',
        'link_target' => (string) $page->id,
        'translations' => ['ru' => ['label' => 'About']],
    ])->assertRedirect();

    expect($this->menu->items()->firstOrFail()->link_target)->toBe((string) $page->id);
});

test('admin can update an item including parent', function () {
    $this->actingAs(userWithRole('admin'));
    $parent = $this->menu->items()->create([
        'parent_id' => null, 'sort_order' => 1, 'link_type' => 'internal', 'link_target' => '/',
    ]);
    $parent->translations()->create(['locale' => 'ru', 'label' => 'Root']);

    $child = $this->menu->items()->create([
        'parent_id' => null, 'sort_order' => 2, 'link_type' => 'internal', 'link_target' => '/x',
    ]);
    $child->translations()->create(['locale' => 'ru', 'label' => 'Child']);

    $this->put(route('admin.menus.items.update', [$this->menu, $child]), [
        'parent_id' => $parent->id,
        'link_type' => 'internal',
        'link_target' => '/x',
        'translations' => ['ru' => ['label' => 'Renamed']],
    ])->assertRedirect();

    expect($child->fresh()->parent_id)->toBe($parent->id);
    expect($child->translations()->where('locale', 'ru')->value('label'))->toBe('Renamed');
});

test('parent must live in the same menu', function () {
    $this->actingAs(userWithRole('admin'));
    $other = Menu::create(['slug' => 'other', 'name' => 'Other']);
    $foreignParent = $other->items()->create([
        'parent_id' => null, 'sort_order' => 1, 'link_type' => 'internal', 'link_target' => '/',
    ]);
    $item = $this->menu->items()->create([
        'parent_id' => null, 'sort_order' => 1, 'link_type' => 'internal', 'link_target' => '/',
    ]);
    $item->translations()->create(['locale' => 'ru', 'label' => 'x']);

    $this->put(route('admin.menus.items.update', [$this->menu, $item]), [
        'parent_id' => $foreignParent->id,
        'link_type' => 'internal',
        'link_target' => '/',
        'translations' => ['ru' => ['label' => 'x']],
    ])->assertSessionHasErrors('parent_id');
});

test('cross-menu update rejects with 403', function () {
    $this->actingAs(userWithRole('admin'));
    $other = Menu::create(['slug' => 'b', 'name' => 'B']);
    $foreign = $other->items()->create([
        'parent_id' => null, 'sort_order' => 1, 'link_type' => 'internal', 'link_target' => '/',
    ]);

    $this->put(route('admin.menus.items.update', [$this->menu, $foreign]), [
        'link_type' => 'internal', 'link_target' => '/', 'translations' => ['ru' => ['label' => 'x']],
    ])->assertForbidden();
});

test('admin can reorder items', function () {
    $this->actingAs(userWithRole('admin'));
    $a = $this->menu->items()->create(['parent_id' => null, 'sort_order' => 1, 'link_type' => 'internal', 'link_target' => '/a']);
    $b = $this->menu->items()->create(['parent_id' => null, 'sort_order' => 2, 'link_type' => 'internal', 'link_target' => '/b']);
    $c = $this->menu->items()->create(['parent_id' => null, 'sort_order' => 3, 'link_type' => 'internal', 'link_target' => '/c']);

    $this->patch(route('admin.menus.items.reorder', $this->menu), [
        'order' => [$c->id, $a->id, $b->id],
    ])->assertRedirect();

    expect($c->fresh()->sort_order)->toBe(1);
    expect($a->fresh()->sort_order)->toBe(2);
    expect($b->fresh()->sort_order)->toBe(3);
});

test('reorder rejects ids belonging to another menu', function () {
    $this->actingAs(userWithRole('admin'));
    $other = Menu::create(['slug' => 'other', 'name' => 'Other']);
    $foreignItem = $other->items()->create([
        'parent_id' => null, 'sort_order' => 1, 'link_type' => 'internal', 'link_target' => '/',
    ]);

    $this->patch(route('admin.menus.items.reorder', $this->menu), [
        'order' => [$foreignItem->id],
    ])->assertSessionHasErrors('order.0');
});

test('admin can delete an item; children orphan to root via nullOnDelete', function () {
    $this->actingAs(userWithRole('admin'));
    $parent = $this->menu->items()->create([
        'parent_id' => null, 'sort_order' => 1, 'link_type' => 'internal', 'link_target' => '/',
    ]);
    $child = $this->menu->items()->create([
        'parent_id' => $parent->id, 'sort_order' => 1, 'link_type' => 'internal', 'link_target' => '/x',
    ]);

    $this->delete(route('admin.menus.items.destroy', [$this->menu, $parent]))->assertRedirect();

    $this->assertDatabaseMissing('menu_items', ['id' => $parent->id]);
    expect($child->fresh()->parent_id)->toBeNull();
});
