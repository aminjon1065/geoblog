<?php

use App\Models\Locale;
use App\Models\Media;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
});

test('root redirects to default locale', function () {
    $this->get('/')->assertRedirect('/'.config('app.locale'));
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

test('gallery shows only images with their alt text and nothing internal', function () {
    Media::create([
        'disk' => 'public',
        'path' => 'media/pamir.jpg',
        'original_name' => 'IMG_0001.jpg',
        'mime_type' => 'image/jpeg',
        'size' => 2048,
        'alt' => 'Памир на рассвете',
        'caption' => 'Экспедиция 2026 года',
        'width' => 1600,
        'height' => 900,
    ]);
    Media::create([
        'disk' => 'public',
        'path' => 'media/report.pdf',
        'mime_type' => 'application/pdf',
        'size' => 4096,
    ]);

    $this->get(route('gallery', ['locale' => 'ru']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Public/Gallery')
            ->has('images.data', 1)
            ->has('images.links')
            ->has('images.data.0', fn (Assert $image) => $image
                ->whereType('id', 'integer')
                ->where('url', Storage::disk('public')->url('media/pamir.jpg'))
                ->where('alt', 'Памир на рассвете')
                ->where('caption', 'Экспедиция 2026 года')
                ->where('width', 1600)
                ->where('height', 900)
            )
        );
});

test('gallery is paginated', function () {
    foreach (range(1, 25) as $number) {
        Media::create([
            'disk' => 'public',
            'path' => "media/photo-{$number}.jpg",
            'mime_type' => 'image/jpeg',
            'size' => 1024,
        ]);
    }

    $this->get(route('gallery', ['locale' => 'ru', 'page' => 2]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('images.data', 1)
            ->where('images.current_page', 2)
            ->where('images.last_page', 2)
        );
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
