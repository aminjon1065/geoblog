<?php

use App\Models\Locale;
use App\Models\Page;
use App\Models\PageTranslation;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $this->actingAs(userWithRole('admin'));
});

test('system pages index shows each page with a title, falling back to another language', function () {
    Locale::firstOrCreate(['code' => 'tj'], ['name' => 'Тоҷикӣ', 'is_active' => true, 'sort_order' => 0]);
    $about = Page::create(['key' => 'about', 'is_active' => true]);
    $about->translations()->create(['locale' => 'ru', 'title' => 'О нас', 'content' => '<p>x</p>']);
    $privacy = Page::create(['key' => 'privacy', 'is_active' => false]);
    $privacy->translations()->create(['locale' => 'tj', 'title' => 'Сиёсати махфият', 'content' => '<p>x</p>']);

    $this->get(route('admin.pages.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Pages/Index')
            ->has('pages', 2)
            ->where('pages.0.title', 'О нас')
            ->where('pages.1.title', 'Сиёсати махфият')
            ->where('pages.1.is_active', false));
});

test('a system page can be saved with an empty text', function () {
    $page = Page::create(['key' => 'about', 'is_active' => true]);
    $page->translations()->create(['locale' => 'ru', 'title' => 'О нас', 'content' => '<p>old</p>']);

    $this->put(route('admin.pages.update', $page), [
        'is_active' => true,
        'translations' => ['ru' => ['title' => 'О нас', 'content' => '']],
    ])->assertRedirect(route('admin.pages.index'))
        ->assertSessionHas('success', 'Страница обновлена.');

    expect($page->translations()->where('locale', 'ru')->value('content'))->toBeNull();
});

test('an empty editor paragraph counts as no text', function () {
    $page = Page::create(['key' => 'about', 'is_active' => true]);

    $this->put(route('admin.pages.update', $page), [
        'translations' => ['ru' => ['title' => 'О нас', 'content' => '<p></p>']],
    ])->assertSessionHasNoErrors();

    expect($page->translations()->where('locale', 'ru')->value('content'))->toBeNull();
});

test('saving a system page keeps the texts of languages the form does not send', function () {
    Locale::firstOrCreate(['code' => 'en'], ['name' => 'English', 'is_active' => false, 'sort_order' => 3]);
    $page = Page::create(['key' => 'about', 'is_active' => true]);
    $page->translations()->create(['locale' => 'ru', 'title' => 'О нас', 'content' => '<p>ru</p>']);
    $page->translations()->create(['locale' => 'en', 'title' => 'About', 'content' => '<p>en</p>']);

    $this->put(route('admin.pages.update', $page), [
        'translations' => ['ru' => ['title' => 'О компании', 'content' => '<p>ru</p>']],
    ])->assertRedirect();

    expect($page->translations()->orderBy('locale')->pluck('title', 'locale')->all())
        ->toBe(['en' => 'About', 'ru' => 'О компании']);
});

test('a language sent empty is removed from a system page, a half-filled one is refused', function () {
    Locale::firstOrCreate(['code' => 'en'], ['name' => 'English', 'is_active' => true, 'sort_order' => 3]);
    $page = Page::create(['key' => 'about', 'is_active' => true]);
    $page->translations()->create(['locale' => 'ru', 'title' => 'О нас', 'content' => '<p>ru</p>']);
    $page->translations()->create(['locale' => 'en', 'title' => 'About', 'content' => '<p>en</p>']);

    $this->put(route('admin.pages.update', $page), [
        'translations' => [
            'ru' => ['title' => 'О нас'],
            'en' => ['title' => '', 'content' => '<p>still here</p>'],
        ],
    ])->assertSessionHasErrors('translations.en.title');

    $this->put(route('admin.pages.update', $page), [
        'translations' => [
            'ru' => ['title' => 'О нас'],
            'en' => ['title' => '', 'content' => ''],
        ],
    ])->assertSessionHasNoErrors();

    expect($page->translations()->pluck('locale')->all())->toBe(['ru']);
});

test('the visibility of a system page is kept when the form does not send it', function () {
    $page = Page::create(['key' => 'about', 'is_active' => false]);

    $this->put(route('admin.pages.update', $page), [
        'translations' => ['ru' => ['title' => 'О нас']],
    ])->assertRedirect();

    expect((bool) $page->fresh()->is_active)->toBeFalse();
});

test('system page meta description is limited to 255 characters', function () {
    $page = Page::create(['key' => 'about', 'is_active' => true]);

    $this->put(route('admin.pages.update', $page), [
        'translations' => ['ru' => ['title' => 'О нас', 'meta_description' => str_repeat('в', 256)]],
    ])->assertSessionHasErrors('translations.ru.meta_description');
});

test('a failed translation write leaves the system page as it was', function () {
    $page = Page::create(['key' => 'about', 'is_active' => true]);

    PageTranslation::saving(function (): void {
        throw new RuntimeException('disk full');
    });

    $this->withoutExceptionHandling();

    expect(fn () => $this->put(route('admin.pages.update', $page), [
        'is_active' => false,
        'translations' => ['ru' => ['title' => 'О нас']],
    ]))->toThrow(RuntimeException::class, 'disk full');

    expect((bool) $page->fresh()->is_active)->toBeTrue();
});
