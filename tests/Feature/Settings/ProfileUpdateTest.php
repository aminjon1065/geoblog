<?php

use App\Models\User;

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response->assertOk();
});

test('profile information can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->name)->toBe('Test User');
    expect($user->email)->toBe('test@example.com');
    expect($user->email_verified_at)->toBeNull();
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

test('user can delete their account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();
    expect($user->fresh())->toBeNull();
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh())->not->toBeNull();
});

test('the only super administrator cannot delete their own account', function () {
    $super = userWithRole('super_admin');

    $this->actingAs($super)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), ['password' => 'password'])
        ->assertSessionHasErrors([
            'account' => 'Нельзя удалить единственного суперадминистратора сайта. Сначала назначьте эту роль другому пользователю.',
        ])
        ->assertRedirect(route('profile.edit'));

    $this->assertAuthenticatedAs($super);
    expect($super->fresh())->not->toBeNull();
});

test('a super administrator can delete their account while another one remains', function () {
    $super = userWithRole('super_admin');
    userWithRole('super_admin');

    $this->actingAs($super)
        ->delete(route('profile.destroy'), ['password' => 'password'])
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();
    expect($super->fresh())->toBeNull();
});

test('the profile screen tells whether the account may be deleted', function () {
    $super = userWithRole('super_admin');

    $this->actingAs($super)
        ->get(route('profile.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/profile')
            ->where('canDeleteAccount', false)
            ->where('roles', ['Суперадминистратор']));

    $this->actingAs(userWithRole('editor'))
        ->get(route('profile.edit'))
        ->assertInertia(fn ($page) => $page
            ->where('canDeleteAccount', true)
            ->where('roles', ['Редактор']));
});

test('profile updates flash a russian confirmation', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Новое имя',
            'email' => $user->email,
        ])
        ->assertSessionHas('success', 'Профиль обновлён.');
});

test('profile validation errors are in russian', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => '',
            'email' => 'not-an-email',
        ])
        ->assertSessionHasErrors([
            'name' => 'Поле имя обязательно для заполнения.',
            'email' => 'Значение поля e-mail должно быть действительным адресом электронной почты.',
        ]);
});
