<?php

use App\Models\Locale;
use App\Models\Page;
use App\Models\Post;
use App\Models\Service;
use App\Support\HtmlSanitizer;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $this->actingAs(userWithRole('admin'));
});

test('sanitizer strips script tags', function () {
    $cleaned = HtmlSanitizer::clean('<p>hello</p><script>alert(1)</script>');

    expect($cleaned)
        ->not->toContain('<script>')
        ->not->toContain('alert(1)')
        ->toContain('<p>hello</p>');
});

test('sanitizer strips inline event handlers', function () {
    $cleaned = HtmlSanitizer::clean('<p onclick="alert(1)">x</p><a href="#" onmouseover="evil()">y</a>');

    expect($cleaned)
        ->not->toContain('onclick')
        ->not->toContain('onmouseover')
        ->not->toContain('alert(1)');
});

test('sanitizer blocks javascript: URLs in anchors', function () {
    $cleaned = HtmlSanitizer::clean('<a href="javascript:alert(1)">click</a>');

    expect($cleaned)->not->toContain('javascript:');
});

test('sanitizer blocks data: URLs in images', function () {
    $payload = '<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==" alt="x">';
    $cleaned = HtmlSanitizer::clean($payload);

    expect($cleaned)->not->toContain('data:');
});

test('sanitizer preserves allowed TipTap output', function () {
    $tiptap = '<h2>Title</h2><p>Body with <strong>bold</strong> and <em>italic</em> and <a href="https://example.com">link</a>.</p><ul><li>one</li><li>two</li></ul><blockquote>quote</blockquote>';
    $cleaned = HtmlSanitizer::clean($tiptap);

    expect($cleaned)
        ->toContain('<h2>Title</h2>')
        ->toContain('<strong>bold</strong>')
        ->toContain('<em>italic</em>')
        ->toContain('href="https://example.com"')
        ->toContain('<blockquote>')
        ->toContain('<ul>')
        ->toContain('<li>one</li>');
});

test('sanitizer adds rel and target on external links', function () {
    $cleaned = HtmlSanitizer::clean('<a href="https://example.com">x</a>');

    expect($cleaned)
        ->toContain('rel=')
        ->toContain('nofollow')
        ->toContain('target="_blank"');
});

test('storing a post sanitizes content before persisting', function () {
    $this->post(route('admin.posts.store'), [
        'status' => 'draft',
        'translations' => [
            'ru' => [
                'title' => 'Тест',
                'content' => '<p>safe</p><script>alert(1)</script><img src="x" onerror="alert(1)">',
            ],
        ],
    ])->assertRedirect(route('admin.posts.index'));

    $stored = Post::firstOrFail()->translations()->where('locale', 'ru')->value('content');

    expect($stored)
        ->not->toContain('<script>')
        ->not->toContain('onerror')
        ->not->toContain('alert(1)')
        ->toContain('<p>safe</p>');
});

test('updating a post re-sanitizes content', function () {
    $post = Post::create(['slug' => 'p', 'status' => 'draft', 'author_id' => auth()->id()]);
    $post->translations()->create([
        'locale' => 'ru',
        'title' => 'X',
        'content' => '<p>old</p>',
    ]);

    $this->put(route('admin.posts.update', $post), [
        'status' => 'draft',
        'translations' => [
            'ru' => [
                'title' => 'X',
                'content' => '<p>new</p><iframe src="https://evil.example"></iframe>',
            ],
        ],
    ])->assertRedirect(route('admin.posts.index'));

    $stored = $post->translations()->where('locale', 'ru')->value('content');

    expect($stored)
        ->not->toContain('<iframe')
        ->toContain('<p>new</p>');
});

test('storing a service sanitizes content', function () {
    $this->post(route('admin.services.store'), [
        'is_active' => true,
        'translations' => [
            'ru' => [
                'title' => 'Услуга',
                'content' => '<p>ok</p><svg onload="alert(1)"></svg>',
            ],
        ],
    ])->assertRedirect();

    $stored = Service::firstOrFail()->translations()->where('locale', 'ru')->value('content');

    expect($stored)
        ->not->toContain('<svg')
        ->not->toContain('onload')
        ->toContain('<p>ok</p>');
});

test('updating a page sanitizes content', function () {
    $page = Page::create(['key' => 'about', 'is_active' => true]);
    $page->translations()->create(['locale' => 'ru', 'title' => 'About', 'content' => '<p>old</p>']);

    $this->put(route('admin.pages.update', $page), [
        'is_active' => true,
        'translations' => [
            'ru' => [
                'title' => 'About',
                'content' => '<p>fresh</p><script>document.cookie</script>',
            ],
        ],
    ])->assertRedirect(route('admin.pages.index'));

    $stored = $page->translations()->where('locale', 'ru')->value('content');

    expect($stored)
        ->not->toContain('<script>')
        ->not->toContain('document.cookie')
        ->toContain('<p>fresh</p>');
});

test('backfill command sanitizes existing rows', function () {
    $post = Post::create(['slug' => 'old-post', 'status' => 'draft', 'author_id' => auth()->id()]);
    // Bypass controller sanitization to simulate legacy unsanitized data.
    $post->translations()->create([
        'locale' => 'ru',
        'title' => 'Old',
        'content' => '<p>x</p><script>alert(99)</script>',
    ]);

    $this->artisan('app:sanitize-content')->assertSuccessful();

    $stored = $post->translations()->where('locale', 'ru')->value('content');

    expect($stored)
        ->not->toContain('<script>')
        ->toContain('<p>x</p>');
});
