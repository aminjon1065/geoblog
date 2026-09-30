<?php

use App\Models\Locale;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
});

test('sitemap returns xml response', function () {
    $this->get('/sitemap.xml')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/xml');
});

test('sitemap lists posts and pages only in the languages they are written in', function () {
    Locale::firstOrCreate(['code' => 'en'], ['name' => 'English', 'is_active' => true, 'sort_order' => 2]);
    $author = App\Models\User::factory()->create();

    $post = App\Models\Post::create([
        'slug' => 'only-ru',
        'status' => 'published',
        'published_at' => now()->subDay(),
        'author_id' => $author->id,
    ]);
    $post->translations()->create(['locale' => 'ru', 'title' => 'Только по-русски', 'content' => '<p>x</p>']);

    App\Models\Post::create([
        'slug' => 'draft-news',
        'status' => 'draft',
        'author_id' => $author->id,
    ])->translations()->create(['locale' => 'ru', 'title' => 'Черновик', 'content' => '<p>x</p>']);

    $page = App\Models\ContentPage::create(['slug' => 'o-proekte', 'status' => 'published', 'published_at' => now()->subDay()]);
    $page->translations()->create(['locale' => 'en', 'title' => 'About the project']);

    $xml = $this->get('/sitemap.xml')->assertOk()->getContent();

    expect($xml)
        ->toContain(url('/ru/news/only-ru'))
        ->not->toContain(url('/en/news/only-ru'))
        ->not->toContain('draft-news')
        ->toContain(url('/en/p/o-proekte'))
        ->not->toContain(url('/ru/p/o-proekte'));
});
