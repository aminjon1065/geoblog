<?php

use App\Models\Locale;
use App\Models\Media;
use App\Models\Post;
use App\Models\User;
use Carbon\CarbonImmutable;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'tj'], ['name' => 'Тоҷикӣ', 'is_active' => true, 'sort_order' => 1]);
    Locale::firstOrCreate(['code' => 'ru'], ['name' => 'Русский', 'is_active' => true, 'sort_order' => 2]);
    Locale::firstOrCreate(['code' => 'en'], ['name' => 'English', 'is_active' => true, 'sort_order' => 3]);
});

function postPayload(array $overrides = []): array
{
    return array_replace_recursive([
        'status' => 'draft',
        'translations' => [
            'ru' => ['title' => 'Заголовок', 'excerpt' => '', 'content' => '<p>Текст</p>'],
        ],
        'categories' => [],
        'tags' => [],
    ], $overrides);
}

test('the create screen gets everything the editor needs', function () {
    $this->actingAs(userWithRole('author'));

    $this->get(route('admin.posts.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Posts/Create')
            ->where('post', null)
            ->has('locales', 3)
            ->has('categories')
            ->has('tags')
            ->where('can.publish', false)
            ->where('can.upload_media', true));
});

test('the edit screen ships the featured image as a media item', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);
    $media = Media::create(['disk' => 'public', 'path' => 'media/cover.jpg', 'mime_type' => 'image/jpeg', 'size' => 2048, 'alt' => 'Обложка']);
    $post = Post::create(['slug' => 'with-cover', 'status' => 'draft', 'author_id' => $admin->id, 'og_image_id' => $media->id]);
    $post->translations()->create(['locale' => 'ru', 'title' => 'С обложкой', 'content' => '<p>x</p>']);

    $this->get(route('admin.posts.edit', $post))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Posts/Edit')
            ->where('post.og_image.id', $media->id)
            ->where('post.og_image.alt', 'Обложка')
            ->where('post.og_image.is_image', true)
            ->where('post.translations.ru.title', 'С обложкой'));
});

test('an author without the publish permission cannot publish', function () {
    $this->actingAs(userWithRole('author'));

    $this->post(route('admin.posts.store'), postPayload(['status' => 'published']))
        ->assertSessionHasErrors('status');

    expect(Post::count())->toBe(0);
});

test('an author sends a post for review instead', function () {
    $author = userWithRole('author');
    $this->actingAs($author);

    $this->post(route('admin.posts.store'), postPayload([
        'status' => 'pending',
        'is_featured' => true,
        'published_at' => '2030-01-01T10:00:00+05:00',
    ]))->assertSessionHasNoErrors()
        ->assertSessionHas('success', 'Запись отправлена на утверждение.');

    $post = Post::firstOrFail();
    expect($post->status)->toBe('pending')
        ->and($post->author_id)->toBe($author->id)
        // Featuring and dating are publishing decisions.
        ->and($post->is_featured)->toBeFalse()
        ->and($post->published_at)->toBeNull();
});

test('an author cannot edit or trash a post once it is published', function () {
    $author = userWithRole('author');
    $post = Post::create(['slug' => 'live', 'status' => 'published', 'published_at' => now()->subDay(), 'author_id' => $author->id]);
    $post->translations()->create(['locale' => 'ru', 'title' => 'Живая', 'content' => '<p>x</p>']);
    $this->actingAs($author);

    $this->get(route('admin.posts.edit', $post))->assertForbidden();
    $this->put(route('admin.posts.update', $post), postPayload(['status' => 'draft']))->assertForbidden();
    $this->delete(route('admin.posts.destroy', $post))->assertForbidden();
});

test('a draft with a title and no text is saved', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.posts.store'), postPayload([
        'translations' => ['ru' => ['title' => 'Только заголовок', 'content' => '']],
    ]))->assertSessionHasNoErrors();

    $translation = Post::firstOrFail()->translations()->firstOrFail();
    expect($translation->content)->toBeNull()
        ->and($translation->reading_time_minutes)->toBeNull();
});

test('identical titles get unique addresses, trashed posts included', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    $trashed = Post::create(['slug' => 'geologiia', 'status' => 'draft', 'author_id' => $admin->id]);
    $trashed->delete();

    $this->post(route('admin.posts.store'), postPayload(['translations' => ['ru' => ['title' => 'Геология']]]))->assertSessionHasNoErrors();
    $this->post(route('admin.posts.store'), postPayload(['translations' => ['ru' => ['title' => 'Геология']]]))->assertSessionHasNoErrors();

    expect(Post::query()->orderBy('id')->pluck('slug')->all())->toBe(['geologiia-2', 'geologiia-3']);
});

test('tajik titles keep their letters in the address', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.posts.store'), postPayload([
        'translations' => ['tj' => ['title' => 'Ҳамкорӣ бо ҷомеа'], 'ru' => ['title' => '']],
    ]))->assertSessionHasNoErrors();

    expect(Post::firstOrFail()->slug)->toBe('hamkori-bo-jomea');
});

test('an address typed in the editor is normalised and kept unique', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);
    Post::create(['slug' => 'polevoi-sezon', 'status' => 'draft', 'author_id' => $admin->id]);
    $post = Post::create(['slug' => 'old', 'status' => 'draft', 'author_id' => $admin->id]);

    $this->put(route('admin.posts.update', $post), postPayload(['slug' => 'Polevoi Sezon!']))
        ->assertSessionHasNoErrors();

    expect($post->fresh()->slug)->toBe('polevoi-sezon-2');
});

test('the publication date keeps the editor\'s time zone and a future date schedules the post', function () {
    $this->actingAs(userWithRole('admin'));
    $this->travelTo(CarbonImmutable::parse('2030-01-01 00:00:00', 'UTC'));

    $this->post(route('admin.posts.store'), postPayload([
        'status' => 'published',
        'published_at' => '2030-01-02T18:30:00+05:00',
    ]))->assertSessionHas('success', 'Запись запланирована на 02.01.2030 13:30.');

    $post = Post::firstOrFail();
    expect($post->published_at->utc()->format('Y-m-d H:i'))->toBe('2030-01-02 13:30')
        ->and($post->isScheduled())->toBeTrue()
        ->and(Post::published()->count())->toBe(0);
});

test('publishing without a date publishes now and updating keeps the date', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.posts.store'), postPayload(['status' => 'published']))
        ->assertSessionHas('success', 'Запись опубликована.');

    $post = Post::firstOrFail();
    $publishedAt = $post->published_at->toIso8601String();

    $this->put(route('admin.posts.update', $post), postPayload([
        'status' => 'published',
        'published_at' => $publishedAt,
    ]))->assertSessionHas('success', 'Запись обновлена.');

    expect($post->fresh()->published_at->toIso8601String())->toBe($publishedAt);
});

test('switching a published post to draft says so', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);
    $post = Post::create(['slug' => 'p', 'status' => 'published', 'published_at' => now()->subHour(), 'author_id' => $admin->id]);
    $post->translations()->create(['locale' => 'ru', 'title' => 'P', 'content' => '<p>x</p>']);

    $this->put(route('admin.posts.update', $post), postPayload(['status' => 'draft']))
        ->assertSessionHas('success', 'Запись переведена в черновики.');
});

test('translations of languages not sent are kept, cleared ones are deleted', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);
    $post = Post::create(['slug' => 'three', 'status' => 'draft', 'author_id' => $admin->id]);
    $post->translations()->create(['locale' => 'tj', 'title' => 'TJ', 'content' => '<p>tj</p>']);
    $post->translations()->create(['locale' => 'ru', 'title' => 'RU', 'content' => '<p>ru</p>']);
    $post->translations()->create(['locale' => 'en', 'title' => 'EN', 'content' => '<p>en</p>']);

    // English switched off meanwhile: the editor doesn't send it at all.
    $this->put(route('admin.posts.update', $post), [
        'status' => 'draft',
        'translations' => [
            'tj' => ['title' => ''],
            'ru' => ['title' => 'RU 2', 'content' => '<p>ru</p>'],
        ],
    ])->assertSessionHasNoErrors();

    expect($post->translations()->orderBy('locale')->pluck('title', 'locale')->all())
        ->toBe(['en' => 'EN', 'ru' => 'RU 2']);
});

test('a title in a language the site does not know is rejected', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.posts.store'), postPayload([
        'translations' => ['de' => ['title' => 'Titel']],
    ]))->assertSessionHasErrors('translations');
});

test('search descriptions longer than the column are rejected, not a server error', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.posts.store'), postPayload([
        'translations' => ['ru' => ['meta_description' => str_repeat('а', 256)]],
    ]))->assertSessionHasErrors('translations.ru.meta_description');
});

test('a trashed image cannot become the featured image', function () {
    $this->actingAs(userWithRole('admin'));
    $media = Media::create(['disk' => 'public', 'path' => 'media/gone.jpg', 'mime_type' => 'image/jpeg', 'size' => 1]);
    $media->delete();

    $this->post(route('admin.posts.store'), postPayload(['og_image_id' => $media->id]))
        ->assertSessionHasErrors('og_image_id');
});

test('deleting a user keeps their posts', function () {
    $author = userWithRole('author');
    $post = Post::create(['slug' => 'orphan', 'status' => 'draft', 'author_id' => $author->id]);

    $author->delete();

    expect(Post::withTrashed()->find($post->id))->not->toBeNull()
        ->and($post->fresh()->author_id)->toBeNull();
    expect(User::query()->whereKey($author->id)->exists())->toBeFalse();
});

test('the public news page shows the featured image as its cover', function () {
    $admin = userWithRole('admin');
    $media = Media::create(['disk' => 'public', 'path' => 'media/cover.jpg', 'mime_type' => 'image/jpeg', 'size' => 10, 'alt' => 'Горы', 'width' => 1200, 'height' => 800]);
    $post = Post::create(['slug' => 'covered', 'status' => 'published', 'published_at' => now()->subDay(), 'author_id' => $admin->id, 'og_image_id' => $media->id]);
    $post->translations()->create(['locale' => 'ru', 'title' => 'С обложкой', 'content' => '<p>x</p>']);

    $this->get(route('news.show', ['locale' => 'ru', 'slug' => 'covered']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('post.cover.alt', 'Горы')
            ->where('post.cover.width', 1200)
            ->where('post.cover.url', fn ($url) => str_contains($url, 'media/cover.jpg')));
});

test('a signed preview link opens a draft on the site, kept out of search engines', function () {
    $admin = userWithRole('admin');
    $post = Post::create(['slug' => 'secret-draft', 'status' => 'draft', 'author_id' => $admin->id]);
    $post->translations()->create(['locale' => 'ru', 'title' => 'Черновик', 'content' => '<p>Скоро</p>']);

    $this->get(route('news.show', ['locale' => 'ru', 'slug' => 'secret-draft']))->assertNotFound();
    $this->get(route('news.show', ['locale' => 'ru', 'slug' => 'secret-draft', 'preview' => 1]))->assertNotFound();

    $this->actingAs($admin);
    $previewUrl = null;
    $this->get(route('admin.posts.edit', $post))
        ->assertInertia(function ($page) use (&$previewUrl) {
            $previewUrl = $page->toArray()['props']['post']['preview_url'];

            return $page;
        });

    expect($previewUrl)->toBeString();

    auth()->logout();
    $this->get($previewUrl)
        ->assertSuccessful()
        ->assertSee('noindex, nofollow', false)
        ->assertInertia(fn ($page) => $page
            ->where('post.title', 'Черновик')
            ->where('isPreview', true));
});

test('public pages stay indexable and admin screens do not', function () {
    $this->get(route('home', ['locale' => 'ru']))->assertSee('content="index, follow"', false);
    $this->get('/login')->assertSee('noindex, nofollow', false);
});
