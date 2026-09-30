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

test('content pages index shows titles, authors and counts per status', function () {
    $this->actingAs($admin = userWithRole('admin'));

    $published = ContentPage::create(['slug' => 'live', 'status' => 'published', 'published_at' => now()->subDay(), 'created_by' => $admin->id]);
    $published->translations()->create(['locale' => 'ru', 'title' => 'Опубликованная']);
    ContentPage::create(['slug' => 'draft-one', 'status' => 'draft']);

    $this->get(route('admin.content-pages.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Content/Index')
            ->has('pages.data', 2)
            ->where('counts.all', 2)
            ->where('counts.published', 1)
            ->where('counts.draft', 1));

    $this->get(route('admin.content-pages.index', ['status' => 'published']))
        ->assertInertia(fn ($page) => $page
            ->has('pages.data', 1)
            ->where('pages.data.0.title', 'Опубликованная')
            ->where('pages.data.0.author', $admin->name)
            ->where('pages.data.0.is_viewable', true)
            ->where('filters.status', 'published'));
});

test('a page created without a slug gets one from its title', function () {
    $this->actingAs(userWithRole('admin'));
    ContentPage::create(['slug' => 'o-kompanii', 'status' => 'draft']);

    $this->post(route('admin.content-pages.store'), [
        'slug' => '',
        'status' => 'draft',
        'translations' => ['ru' => ['title' => 'О компании']],
    ])->assertRedirect()->assertSessionHas('success', 'Страница создана. Теперь добавьте на неё блоки.');

    expect(ContentPage::query()->latest('id')->value('slug'))->toBe('o-kompanii-2');
});

test('saving a page keeps the texts of languages the form does not send', function () {
    Locale::firstOrCreate(['code' => 'en'], ['name' => 'English', 'is_active' => false, 'sort_order' => 3]);
    $this->actingAs(userWithRole('admin'));
    $page = ContentPage::create(['slug' => 'keep', 'status' => 'draft']);
    $page->translations()->create(['locale' => 'ru', 'title' => 'Старое']);
    $page->translations()->create(['locale' => 'en', 'title' => 'English title']);

    $this->put(route('admin.content-pages.update', $page), [
        'slug' => 'keep',
        'status' => 'draft',
        'translations' => ['ru' => ['title' => 'Новое']],
    ])->assertRedirect(route('admin.content-pages.edit', $page));

    expect($page->translations()->orderBy('locale')->pluck('title', 'locale')->all())
        ->toBe(['en' => 'English title', 'ru' => 'Новое']);
});

test('a language sent with an empty title is removed from the page', function () {
    Locale::firstOrCreate(['code' => 'en'], ['name' => 'English', 'is_active' => true, 'sort_order' => 3]);
    $this->actingAs(userWithRole('admin'));
    $page = ContentPage::create(['slug' => 'clear', 'status' => 'draft']);
    $page->translations()->create(['locale' => 'ru', 'title' => 'Русский']);
    $page->translations()->create(['locale' => 'en', 'title' => 'English']);

    $this->put(route('admin.content-pages.update', $page), [
        'slug' => 'clear',
        'status' => 'draft',
        'translations' => [
            'ru' => ['title' => 'Русский'],
            'en' => ['title' => '', 'meta_title' => '', 'meta_description' => ''],
        ],
    ])->assertSessionHasNoErrors();

    expect($page->translations()->pluck('locale')->all())->toBe(['ru']);
});

test('SEO fields without a title in that language are refused', function () {
    Locale::firstOrCreate(['code' => 'en'], ['name' => 'English', 'is_active' => true, 'sort_order' => 3]);
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.content-pages.store'), [
        'slug' => 'seo',
        'status' => 'draft',
        'translations' => [
            'ru' => ['title' => 'Страница'],
            'en' => ['title' => '', 'meta_title' => 'SEO title'],
        ],
    ])->assertSessionHasErrors('translations.en.title');
});

test('page meta description is limited to 255 characters', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.content-pages.store'), [
        'slug' => 'long-meta',
        'status' => 'draft',
        'translations' => ['ru' => ['title' => 'Страница', 'meta_description' => str_repeat('б', 256)]],
    ])->assertSessionHasErrors('translations.ru.meta_description');
});

test('a page cannot be nested into one of its own subpages', function () {
    $this->actingAs(userWithRole('admin'));
    $parent = ContentPage::create(['slug' => 'parent', 'status' => 'draft']);
    $child = ContentPage::create(['slug' => 'child', 'status' => 'draft', 'parent_id' => $parent->id]);
    $grandchild = ContentPage::create(['slug' => 'grandchild', 'status' => 'draft', 'parent_id' => $child->id]);

    $this->put(route('admin.content-pages.update', $parent), [
        'slug' => 'parent',
        'parent_id' => $grandchild->id,
        'status' => 'draft',
        'translations' => ['ru' => ['title' => 'Родитель']],
    ])->assertSessionHasErrors('parent_id');

    expect($parent->fresh()->parent_id)->toBeNull();
});

test('the edit screen does not offer the page or its subpages as a parent', function () {
    $this->actingAs(userWithRole('admin'));
    $parent = ContentPage::create(['slug' => 'parent', 'status' => 'draft']);
    ContentPage::create(['slug' => 'child', 'status' => 'draft', 'parent_id' => $parent->id]);
    ContentPage::create(['slug' => 'other', 'status' => 'draft']);

    $this->get(route('admin.content-pages.edit', $parent))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Content/Edit')
            ->has('parents', 1)
            ->where('parents.0.slug', 'other'));
});

test('changing or deleting a page refreshes the cached menus that link to it', function () {
    $this->actingAs(userWithRole('admin'));
    $page = ContentPage::create(['slug' => 'old-slug', 'status' => 'published', 'published_at' => now()->subDay()]);
    $page->translations()->create(['locale' => 'ru', 'title' => 'Страница']);

    $menu = App\Models\Menu::create(['slug' => 'header', 'name' => 'Header']);
    $item = $menu->items()->create([
        'parent_id' => null, 'sort_order' => 1, 'link_type' => 'page', 'link_target' => (string) $page->id,
    ]);
    $item->translations()->create(['locale' => 'ru', 'label' => 'Страница']);

    $cache = app(App\Services\Menu\MenuCache::class);
    expect($cache->get('ru')['header']['items'][0]['url'])->toBe('/ru/p/old-slug');

    $this->put(route('admin.content-pages.update', $page), [
        'slug' => 'new-slug',
        'status' => 'published',
        'translations' => ['ru' => ['title' => 'Страница']],
    ])->assertRedirect();

    expect(app(App\Services\Menu\MenuCache::class)->get('ru')['header']['items'][0]['url'])->toBe('/ru/p/new-slug');

    $this->delete(route('admin.content-pages.destroy', $page))
        ->assertRedirect(route('admin.content-pages.index'))
        ->assertSessionHas('success', 'Страница удалена.');

    expect(app(App\Services\Menu\MenuCache::class)->get('ru')['header']['items'][0]['url'])->toBe('/ru');
});

test('bulk actions publish, unpublish and delete ticked pages', function () {
    $this->actingAs($admin = userWithRole('admin'));
    $first = ContentPage::create(['slug' => 'first', 'status' => 'draft']);
    $second = ContentPage::create(['slug' => 'second', 'status' => 'draft']);

    $this->post(route('admin.content-pages.bulk'), [
        'action' => 'publish',
        'ids' => [$first->id, $second->id],
    ])->assertRedirect()
        ->assertSessionHas('success', '2 страницы опубликованы.');

    expect($first->fresh()->status)->toBe('published')
        ->and($first->fresh()->published_at)->not->toBeNull()
        ->and($first->fresh()->updated_by)->toBe($admin->id);

    $this->post(route('admin.content-pages.bulk'), [
        'action' => 'draft',
        'ids' => [$second->id],
    ])->assertSessionHas('success', '1 страница переведена в черновики.');

    expect($second->fresh()->status)->toBe('draft');

    $this->post(route('admin.content-pages.bulk'), [
        'action' => 'delete',
        'ids' => [$first->id, $second->id],
    ])->assertSessionHas('success', '2 страницы удалены.');

    $this->assertSoftDeleted('content_pages', ['id' => $first->id]);
    $this->assertSoftDeleted('content_pages', ['id' => $second->id]);
});

test('bulk page actions need the matching permission', function () {
    $page = ContentPage::create(['slug' => 'guarded', 'status' => 'draft']);

    $this->actingAs(userWithRole('moderator'));

    $this->post(route('admin.content-pages.bulk'), [
        'action' => 'publish',
        'ids' => [$page->id],
    ])->assertForbidden();

    expect($page->fresh()->status)->toBe('draft');
});
