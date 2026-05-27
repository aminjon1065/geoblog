<?php

use App\Models\ContentPage;
use App\Models\Locale;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    userWithRole('admin'); // seed role catalog
});

test('a draft page returns 404 from the public route', function () {
    $page = ContentPage::create(['slug' => 'wip', 'status' => 'draft']);
    $page->translations()->create(['locale' => 'ru', 'title' => 'WIP']);

    $this->get(route('content-pages.show', ['locale' => 'ru', 'slug' => 'wip']))
        ->assertNotFound();
});

test('a published page renders with its blocks in order', function () {
    $page = ContentPage::create([
        'slug' => 'about',
        'status' => 'published',
        'published_at' => now()->subDay(),
    ]);
    $page->translations()->create(['locale' => 'ru', 'title' => 'About']);

    $b1 = $page->blocks()->create(['type' => 'hero', 'sort_order' => 1]);
    $b1->translations()->create([
        'locale' => 'ru',
        'content' => ['title' => 'Welcome', 'subtitle' => 'Sub'],
    ]);
    $b2 = $page->blocks()->create(['type' => 'rich_text', 'sort_order' => 2]);
    $b2->translations()->create([
        'locale' => 'ru',
        'content' => ['body' => '<p>Hello</p>'],
    ]);

    $this->get(route('content-pages.show', ['locale' => 'ru', 'slug' => 'about']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Public/ContentPage/Show')
            ->where('page.title', 'About')
            ->has('page.blocks', 2)
            ->where('page.blocks.0.type', 'hero')
            ->where('page.blocks.0.content.title', 'Welcome')
            ->where('page.blocks.1.type', 'rich_text'));
});

test('a published page scheduled for the future is hidden', function () {
    $page = ContentPage::create([
        'slug' => 'soon',
        'status' => 'published',
        'published_at' => now()->addDay(),
    ]);
    $page->translations()->create(['locale' => 'ru', 'title' => 'Later']);

    $this->get(route('content-pages.show', ['locale' => 'ru', 'slug' => 'soon']))
        ->assertNotFound();
});
