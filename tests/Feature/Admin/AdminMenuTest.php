<?php

use App\Models\Locale;
use App\Models\Menu;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
    userWithRole('admin'); // seed role catalog
});

test('moderator cannot access menus; editor and admin can', function () {
    $this->actingAs(userWithRole('moderator'));
    $this->get(route('admin.menus.index'))->assertForbidden();

    $this->actingAs(userWithRole('editor'));
    $this->get(route('admin.menus.index'))->assertOk();

    $this->actingAs(userWithRole('admin'));
    $this->get(route('admin.menus.index'))->assertOk();
});

test('admin can create a menu and is redirected to its edit screen', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.menus.store'), [
        'slug' => 'custom-menu',
        'name' => 'Custom Menu',
    ])->assertRedirect(route('admin.menus.edit', Menu::firstWhere('slug', 'custom-menu')));

    $this->assertDatabaseHas('menus', ['slug' => 'custom-menu', 'name' => 'Custom Menu']);
});

test('slug must be unique across all menus', function () {
    $this->actingAs(userWithRole('admin'));
    Menu::create(['slug' => 'header', 'name' => 'Header']);

    $this->post(route('admin.menus.store'), [
        'slug' => 'header',
        'name' => 'Duplicate',
    ])->assertSessionHasErrors('slug');
});

test('slug must use only lowercase letters, digits, hyphens', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.menus.store'), [
        'slug' => 'Not_Valid!',
        'name' => 'Test',
    ])->assertSessionHasErrors('slug');
});

test('admin can rename a menu', function () {
    $this->actingAs(userWithRole('admin'));
    $menu = Menu::create(['slug' => 'header', 'name' => 'Old']);

    $this->put(route('admin.menus.update', $menu), [
        'slug' => 'header',
        'name' => 'New Name',
    ])->assertRedirect();

    expect($menu->fresh()->name)->toBe('New Name');
});

test('admin can delete a menu; items cascade', function () {
    $this->actingAs(userWithRole('admin'));
    $menu = Menu::create(['slug' => 'doomed', 'name' => 'Doomed']);
    $item = $menu->items()->create([
        'parent_id' => null,
        'sort_order' => 1,
        'link_type' => 'internal',
        'link_target' => '/',
    ]);

    $this->delete(route('admin.menus.destroy', $menu))->assertRedirect();

    $this->assertDatabaseMissing('menus', ['id' => $menu->id]);
    $this->assertDatabaseMissing('menu_items', ['id' => $item->id]);
});
