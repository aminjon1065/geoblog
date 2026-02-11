<?php

use App\Models\Locale;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
});

test('root redirects to default locale', function () {
    $this->get('/')->assertRedirect('/ru');
});

test('home page returns successful response', function () {
    $this->get(route('home', ['locale' => 'ru']))->assertOk();
});

test('about page returns successful response', function () {
    $this->get(route('about', ['locale' => 'ru']))->assertOk();
});

test('news index returns successful response', function () {
    $this->get(route('news.index', ['locale' => 'ru']))->assertOk();
});

test('projects page returns successful response', function () {
    $this->get(route('projects', ['locale' => 'ru']))->assertOk();
});

test('gallery page returns successful response', function () {
    $this->get(route('gallery', ['locale' => 'ru']))->assertOk();
});

test('members page returns successful response', function () {
    $this->get(route('members', ['locale' => 'ru']))->assertOk();
});

test('contact page returns successful response', function () {
    $this->get(route('contact.show', ['locale' => 'ru']))->assertOk();
});

test('contact form can be submitted', function () {
    $this->post(route('contact.store', ['locale' => 'ru']), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'message' => 'This is a test message',
    ])->assertRedirect();

    $this->assertDatabaseHas('contact_requests', [
        'name' => 'Test User',
        'email' => 'test@example.com',
    ]);
});

test('contact form requires name', function () {
    $this->post(route('contact.store', ['locale' => 'ru']), [
        'email' => 'test@example.com',
        'message' => 'Test',
    ])->assertSessionHasErrors('name');
});

test('contact form requires valid email', function () {
    $this->post(route('contact.store', ['locale' => 'ru']), [
        'name' => 'Test',
        'email' => 'not-an-email',
        'message' => 'Test',
    ])->assertSessionHasErrors('email');
});
