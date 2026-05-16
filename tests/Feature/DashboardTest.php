<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('users without admin-panel access cannot visit the dashboard', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $this->actingAs($user);

    $this->get(route('dashboard'))->assertForbidden();
});

test('users with admin-panel access can visit the dashboard', function () {
    $user = userWithRole('admin');
    $this->actingAs($user);

    $this->get(route('dashboard'))->assertOk();
});
