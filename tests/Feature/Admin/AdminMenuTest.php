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

test('menus index shows item counts', function () {
    $this->actingAs(userWithRole('admin'));
    $menu = Menu::create(['slug' => 'header', 'name' => 'Шапка']);
    $menu->items()->create(['parent_id' => null, 'sort_order' => 1, 'link_type' => 'internal', 'link_target' => '/']);
    $menu->items()->create(['parent_id' => null, 'sort_order' => 2, 'link_type' => 'internal', 'link_target' => '/about']);

    $this->get(route('admin.menus.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Menus/Index')
            ->where('menus.0.name', 'Шапка')
            ->where('menus.0.items_count', 2));
});

test('menu edit screen offers content pages with their titles', function () {
    $this->actingAs(userWithRole('admin'));
    $menu = Menu::create(['slug' => 'header', 'name' => 'Шапка']);
    $page = App\Models\ContentPage::create(['slug' => 'about-us', 'status' => 'published']);
    $page->translations()->create(['locale' => 'ru', 'title' => 'О нас']);

    $this->get(route('admin.menus.edit', $menu))
        ->assertOk()
        ->assertInertia(fn ($inertia) => $inertia
            ->component('Admin/Menus/Edit')
            ->where('contentPages.0.id', $page->id)
            ->where('contentPages.0.title', 'О нас')
            ->where('contentPages.0.titles', ['ru' => 'О нас']));
});

test('menu flash and validation messages are in Russian', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.menus.store'), [
        'slug' => 'footer',
        'name' => 'Подвал',
    ])->assertSessionHas('success', 'Меню создано. Теперь добавьте в него пункты.');

    $this->post(route('admin.menus.store'), [
        'slug' => 'Bad Slug',
        'name' => 'Плохое',
    ])->assertSessionHasErrors([
        'slug' => 'Ярлык может содержать только строчные латинские буквы, цифры и дефисы.',
    ]);
});
