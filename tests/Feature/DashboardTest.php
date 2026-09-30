<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

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

test('every admin-panel role reaches the console', function (string $role) {
    $this->actingAs(userWithRole($role))
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('widgets.0.key', 'at-a-glance')
            ->where('widgets.0.label', 'На виду'));
})->with(['super_admin', 'admin', 'editor', 'author', 'moderator']);
