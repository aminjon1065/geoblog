<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    // Seed the role catalog via the helper's side effect; we want a clean DB but
    // the role rows in place before any test acts on them.
    userWithRole('admin');
    User::query()->delete();
});

test('editor cannot access user management', function () {
    $this->actingAs(userWithRole('editor'));

    $this->get(route('admin.users.index'))->assertForbidden();
    $this->get(route('admin.users.create'))->assertForbidden();
});

test('moderator cannot access user management', function () {
    $this->actingAs(userWithRole('moderator'));

    $this->get(route('admin.users.index'))->assertForbidden();
});

test('admin can view the users list and is excluded from it', function () {
    $admin = userWithRole('admin');
    $other = userWithRole('editor');
    $this->actingAs($admin);

    $this->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(function ($page) use ($admin, $other) {
            $emails = collect($page->toArray()['props']['users']['data'])
                ->pluck('email')
                ->all();

            expect($emails)->not->toContain($admin->email);
            expect($emails)->toContain($other->email);

            return $page;
        });
});

test('admin can create a user with assigned roles', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.users.store'), [
        'name' => 'Jane Editor',
        'email' => 'jane@geo.tj',
        'password' => 'plain-password-1234',
        'password_confirmation' => 'plain-password-1234',
        'roles' => ['editor'],
    ])->assertRedirect(route('admin.users.index'));

    $user = User::where('email', 'jane@geo.tj')->firstOrFail();
    expect($user->getRoleNames()->all())->toEqual(['editor']);
    expect($user->email_verified_at)->not->toBeNull();
});

test('create rejects unconfirmed passwords', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.users.store'), [
        'name' => 'X',
        'email' => 'x@geo.tj',
        'password' => 'one-secret-1234',
        'password_confirmation' => 'two-secret-1234',
    ])->assertSessionHasErrors('password');
});

test('create rejects duplicate emails', function () {
    User::factory()->create(['email' => 'dup@geo.tj']);
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.users.store'), [
        'name' => 'Dup',
        'email' => 'dup@geo.tj',
        'password' => 'plain-password-1234',
        'password_confirmation' => 'plain-password-1234',
    ])->assertSessionHasErrors('email');
});

test('create rejects unknown role names', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.users.store'), [
        'name' => 'X',
        'email' => 'x@geo.tj',
        'password' => 'plain-password-1234',
        'password_confirmation' => 'plain-password-1234',
        'roles' => ['definitely-not-a-role'],
    ])->assertSessionHasErrors('roles.0');
});

test('admin can update a user including roles', function () {
    $this->actingAs(userWithRole('admin'));
    $target = userWithRole('editor');

    $this->put(route('admin.users.update', $target), [
        'name' => 'Renamed',
        'email' => $target->email,
        'roles' => ['author'],
    ])->assertRedirect(route('admin.users.index'));

    $target->refresh();
    expect($target->name)->toBe('Renamed');
    expect($target->getRoleNames()->all())->toEqual(['author']);
});

test('admin can reset another user\'s password', function () {
    $admin = userWithRole('admin');
    $target = userWithRole('editor');

    $this->actingAs($admin)
        ->put(route('admin.users.password.update', $target), [
            'password' => 'shiny-new-pass-1234',
            'password_confirmation' => 'shiny-new-pass-1234',
        ])
        ->assertRedirect();

    $target->refresh();
    expect(Hash::check('shiny-new-pass-1234', $target->password))->toBeTrue();
});

test('admin cannot edit self via /admin/users (redirected through profile instead)', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    $this->get(route('admin.users.edit', $admin))->assertForbidden();
});

test('admin cannot delete themselves', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    $this->delete(route('admin.users.destroy', $admin))->assertForbidden();
    $this->assertDatabaseHas('users', ['id' => $admin->id]);
});

test('admin cannot delete or edit a super_admin', function () {
    $this->actingAs(userWithRole('admin'));
    $super = userWithRole('super_admin');

    $this->get(route('admin.users.edit', $super))->assertForbidden();
    $this->delete(route('admin.users.destroy', $super))->assertForbidden();
    $this->put(route('admin.users.update', $super), [
        'name' => 'hijacked',
        'email' => $super->email,
    ])->assertForbidden();
});

test('super_admin can delete an admin user', function () {
    $super = userWithRole('super_admin');
    $admin = userWithRole('admin');

    $this->actingAs($super)
        ->delete(route('admin.users.destroy', $admin))
        ->assertRedirect(route('admin.users.index'));

    $this->assertDatabaseMissing('users', ['id' => $admin->id]);
});

test('super_admin cannot delete themselves either', function () {
    $super = userWithRole('super_admin');
    $this->actingAs($super);

    $this->delete(route('admin.users.destroy', $super))->assertForbidden();
    $this->assertDatabaseHas('users', ['id' => $super->id]);
});
