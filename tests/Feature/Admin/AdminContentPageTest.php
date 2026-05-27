<?php

use App\Models\ContentPage;
use App\Models\Locale;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    // Seed role catalog.
    userWithRole('admin');
});

test('editor and admin can view content pages list; moderator cannot', function () {
    $this->actingAs(userWithRole('moderator'));
    $this->get(route('admin.content-pages.index'))->assertForbidden();

    $this->actingAs(userWithRole('editor'));
    $this->get(route('admin.content-pages.index'))->assertOk();

    $this->actingAs(userWithRole('admin'));
    $this->get(route('admin.content-pages.index'))->assertOk();
});

test('admin can create a content page and lands on edit screen', function () {
    $this->actingAs(userWithRole('admin'));

    $response = $this->post(route('admin.content-pages.store'), [
        'slug' => 'about-us',
        'status' => 'draft',
        'translations' => [
            'ru' => ['title' => 'О нас'],
        ],
    ]);

    $page = ContentPage::firstOrFail();
    $response->assertRedirect(route('admin.content-pages.edit', $page));

    expect($page->slug)->toBe('about-us');
    expect($page->status)->toBe('draft');
    expect($page->created_by)->toBe(auth()->id());
    expect($page->translations()->where('locale', 'ru')->value('title'))->toBe('О нас');
});

test('slug must be unique within the same parent', function () {
    $this->actingAs(userWithRole('admin'));

    ContentPage::create(['slug' => 'team', 'status' => 'draft']);

    $this->post(route('admin.content-pages.store'), [
        'slug' => 'team',
        'status' => 'draft',
        'translations' => ['ru' => ['title' => 'Команда']],
    ])->assertSessionHasErrors('slug');
});

test('same slug is allowed under a different parent', function () {
    $this->actingAs(userWithRole('admin'));

    $parent = ContentPage::create(['slug' => 'geology', 'status' => 'draft']);

    $this->post(route('admin.content-pages.store'), [
        'slug' => 'team',
        'status' => 'draft',
        'translations' => ['ru' => ['title' => 'Geology Team']],
    ])->assertRedirect();

    $this->post(route('admin.content-pages.store'), [
        'slug' => 'team',
        'parent_id' => $parent->id,
        'status' => 'draft',
        'translations' => ['ru' => ['title' => 'Nested Team']],
    ])->assertRedirect();

    expect(ContentPage::where('slug', 'team')->count())->toBe(2);
});

test('store rejects slug with disallowed characters', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.content-pages.store'), [
        'slug' => 'NotAllowed_Slug!',
        'status' => 'draft',
        'translations' => ['ru' => ['title' => 'X']],
    ])->assertSessionHasErrors('slug');
});

test('publishing without an explicit date auto-fills published_at', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.content-pages.store'), [
        'slug' => 'live-now',
        'status' => 'published',
        'translations' => ['ru' => ['title' => 'Live']],
    ])->assertRedirect();

    expect(ContentPage::firstOrFail()->published_at)->not->toBeNull();
});

test('updating a page records updated_by and syncs translations', function () {
    $this->actingAs($admin = userWithRole('admin'));
    $page = ContentPage::create(['slug' => 'edit-me', 'status' => 'draft']);
    $page->translations()->create(['locale' => 'ru', 'title' => 'Old']);

    $this->put(route('admin.content-pages.update', $page), [
        'slug' => 'edit-me',
        'status' => 'draft',
        'translations' => ['ru' => ['title' => 'New']],
    ])->assertRedirect();

    $page->refresh();
    expect($page->updated_by)->toBe($admin->id);
    expect($page->translations()->where('locale', 'ru')->value('title'))->toBe('New');
});

test('a page cannot be its own parent', function () {
    $this->actingAs(userWithRole('admin'));
    $page = ContentPage::create(['slug' => 'self', 'status' => 'draft']);

    $this->put(route('admin.content-pages.update', $page), [
        'slug' => 'self',
        'parent_id' => $page->id,
        'status' => 'draft',
        'translations' => ['ru' => ['title' => 'Self']],
    ])->assertSessionHasErrors('parent_id');
});

test('admin can soft-delete a content page', function () {
    $this->actingAs(userWithRole('admin'));
    $page = ContentPage::create(['slug' => 'drop-me', 'status' => 'draft']);

    $this->delete(route('admin.content-pages.destroy', $page))->assertRedirect();

    $this->assertSoftDeleted('content_pages', ['id' => $page->id]);
});
