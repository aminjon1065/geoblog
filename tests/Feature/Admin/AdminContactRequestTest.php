<?php

use App\Models\ContactRequest;
use App\Models\Locale;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);

    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
});

test('guests cannot access admin contact requests', function () {
    auth()->logout();

    $this->get(route('admin.contact-requests.index'))->assertRedirect();
});

test('authenticated user can view contact requests index', function () {
    $this->get(route('admin.contact-requests.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Admin/ContactRequests/Index'));
});

test('authenticated user can view a contact request', function () {
    $request = ContactRequest::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'message' => 'Test message',
        'locale' => 'ru',
    ]);

    $this->get(route('admin.contact-requests.show', $request))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Admin/ContactRequests/Show'));
});

test('viewing a contact request marks it as read', function () {
    $request = ContactRequest::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'message' => 'Test message',
        'locale' => 'ru',
        'is_read' => false,
    ]);

    $this->get(route('admin.contact-requests.show', $request));

    $request->refresh();
    expect($request->is_read)->toBeTrue();
});

test('authenticated user can delete a contact request', function () {
    $request = ContactRequest::create([
        'name' => 'Delete Me',
        'email' => 'delete@example.com',
        'message' => 'Delete this',
        'locale' => 'ru',
    ]);

    $this->delete(route('admin.contact-requests.destroy', $request))
        ->assertRedirect(route('admin.contact-requests.index'));

    $this->assertDatabaseMissing('contact_requests', ['id' => $request->id]);
});
