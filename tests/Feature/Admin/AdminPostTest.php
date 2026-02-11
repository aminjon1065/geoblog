<?php

use App\Models\Category;
use App\Models\Locale;
use App\Models\Post;
use App\Models\Tag;
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

test('guests cannot access admin posts', function () {
    auth()->logout();

    $this->get(route('admin.posts.index'))->assertRedirect();
    $this->get(route('admin.posts.create'))->assertRedirect();
    $this->post(route('admin.posts.store'))->assertRedirect();
});

test('authenticated user can view posts index', function () {
    Post::create([
        'slug' => 'test-post',
        'status' => 'draft',
        'author_id' => $this->user->id,
    ]);

    $this->get(route('admin.posts.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Admin/Posts/Index'));
});

test('authenticated user can view create post form', function () {
    $this->get(route('admin.posts.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Posts/Create')
            ->has('locales')
            ->has('categories')
            ->has('tags')
        );
});

test('authenticated user can store a post', function () {
    $category = Category::create(['slug' => 'geology', 'sort_order' => 1]);
    $tag = Tag::create(['slug' => 'fieldwork']);

    $this->post(route('admin.posts.store'), [
        'slug' => 'new-post',
        'status' => 'draft',
        'published_at' => null,
        'translations' => [
            'ru' => [
                'title' => 'Тестовая статья',
                'excerpt' => 'Краткое описание',
                'content' => 'Содержание статьи',
            ],
        ],
        'categories' => [$category->id],
        'tags' => [$tag->id],
    ])->assertRedirect(route('admin.posts.index'));

    $this->assertDatabaseHas('posts', ['slug' => 'new-post', 'status' => 'draft']);
    $this->assertDatabaseHas('post_translations', ['title' => 'Тестовая статья', 'locale' => 'ru']);

    $post = Post::where('slug', 'new-post')->first();
    expect($post->categories)->toHaveCount(1);
    expect($post->tags)->toHaveCount(1);
    expect($post->author_id)->toBe($this->user->id);
});

test('store post validates required fields', function () {
    $this->post(route('admin.posts.store'), [])
        ->assertSessionHasErrors(['slug', 'status', 'translations']);
});

test('store post validates unique slug', function () {
    Post::create([
        'slug' => 'existing-slug',
        'status' => 'draft',
        'author_id' => $this->user->id,
    ]);

    $this->post(route('admin.posts.store'), [
        'slug' => 'existing-slug',
        'status' => 'draft',
        'translations' => [
            'ru' => ['title' => 'Test'],
        ],
    ])->assertSessionHasErrors('slug');
});

test('authenticated user can view edit post form', function () {
    $post = Post::create([
        'slug' => 'edit-me',
        'status' => 'draft',
        'author_id' => $this->user->id,
    ]);

    $this->get(route('admin.posts.edit', $post))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Posts/Edit')
            ->has('post')
            ->has('locales')
            ->has('categories')
            ->has('tags')
        );
});

test('authenticated user can update a post', function () {
    $post = Post::create([
        'slug' => 'old-slug',
        'status' => 'draft',
        'author_id' => $this->user->id,
    ]);

    $this->put(route('admin.posts.update', $post), [
        'slug' => 'updated-slug',
        'status' => 'published',
        'published_at' => '2025-01-01',
        'translations' => [
            'ru' => [
                'title' => 'Обновлённая статья',
                'excerpt' => null,
                'content' => 'Новое содержание',
            ],
        ],
        'categories' => [],
        'tags' => [],
    ])->assertRedirect(route('admin.posts.index'));

    $post->refresh();
    expect($post->slug)->toBe('updated-slug');
    expect($post->status)->toBe('published');
});

test('authenticated user can delete a post', function () {
    $post = Post::create([
        'slug' => 'delete-me',
        'status' => 'draft',
        'author_id' => $this->user->id,
    ]);

    $this->delete(route('admin.posts.destroy', $post))
        ->assertRedirect(route('admin.posts.index'));

    $this->assertDatabaseMissing('posts', ['id' => $post->id]);
});

test('published post appears on news index', function () {
    $post = Post::create([
        'slug' => 'published-news',
        'status' => 'published',
        'published_at' => now()->subDay(),
        'author_id' => $this->user->id,
    ]);

    $post->translations()->create([
        'locale' => 'ru',
        'title' => 'Опубликованная новость',
        'content' => 'Содержание',
    ]);

    $this->get(route('news.index', ['locale' => 'ru']))
        ->assertSuccessful();
});
