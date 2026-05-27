<?php

use Spatie\Permission\Models\Role;

beforeEach(function () {
    // Seed roles + permissions via the test helper's side effect.
    userWithRole('admin');
});

test('editor cannot access role management', function () {
    $this->actingAs(userWithRole('editor'));

    $this->get(route('admin.roles.index'))->assertForbidden();
});

test('admin cannot access role management (no roles.manage)', function () {
    $this->actingAs(userWithRole('admin'));

    $this->get(route('admin.roles.index'))->assertForbidden();
});

test('super_admin can view roles list', function () {
    $this->actingAs(userWithRole('super_admin'));

    $this->get(route('admin.roles.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Roles/Index')
            ->has('roles'));
});

test('super_admin can view a role edit screen with grouped permissions', function () {
    $editor = Role::findByName('editor', 'web');
    $this->actingAs(userWithRole('super_admin'));

    $this->get(route('admin.roles.edit', $editor))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Roles/Edit')
            ->has('role')
            ->has('permissionGroups')
            ->where('role.name', 'editor'));
});

test('super_admin can update role permissions', function () {
    $editor = Role::findByName('editor', 'web');
    $this->actingAs(userWithRole('super_admin'));

    $this->put(route('admin.roles.update', $editor), [
        'permissions' => ['admin-panel.access', 'posts.viewAny'],
    ])->assertRedirect(route('admin.roles.edit', $editor));

    $editor->refresh();
    expect($editor->permissions->pluck('name')->all())
        ->toEqualCanonicalizing(['admin-panel.access', 'posts.viewAny']);
});

test('updating a role rejects unknown permission names', function () {
    $editor = Role::findByName('editor', 'web');
    $this->actingAs(userWithRole('super_admin'));

    $this->put(route('admin.roles.update', $editor), [
        'permissions' => ['definitely.not.a.permission'],
    ])->assertSessionHasErrors('permissions.0');
});

test('the super_admin role itself cannot be edited (Gate::before makes its row irrelevant)', function () {
    $super = Role::findByName('super_admin', 'web');
    $this->actingAs(userWithRole('super_admin'));

    $this->put(route('admin.roles.update', $super), [
        'permissions' => ['posts.viewAny'],
    ])->assertForbidden();

    $super->refresh();
    // Nothing changed: super_admin has no synced permissions (its bypass is in Gate::before).
    expect($super->permissions)->toHaveCount(0);
});

test('role update clears the spatie permission cache', function () {
    $editor = Role::findByName('editor', 'web');
    $target = userWithRole('editor');

    // Warm the cache by checking a permission the editor has.
    expect($target->can('posts.viewAny'))->toBeTrue();

    $this->actingAs(userWithRole('super_admin'))
        ->put(route('admin.roles.update', $editor), [
            'permissions' => ['admin-panel.access'],
        ])->assertRedirect();

    // Refresh the user so the relationship is reloaded post-cache-flush.
    $target = $target->fresh();
    expect($target->can('posts.viewAny'))->toBeFalse();
    expect($target->can('admin-panel.access'))->toBeTrue();
});
