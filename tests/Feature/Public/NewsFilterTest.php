<?php

use App\Models\Category;
use App\Models\Locale;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
});

test('news index returns tags and categories', function () {
    $this->get(route('news.index', ['locale' => 'ru']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Public/News/Index')
            ->has('tags')
            ->has('categories')
            ->has('filters')
        );
});

test('news can be filtered by tag', function () {
    $user = User::factory()->create();

    $tag = Tag::create(['slug' => 'geology']);
    $tag->translations()->create(['locale' => 'ru', 'name' => 'Геология']);

    $post = Post::create([
        'slug' => 'tagged-post',
        'status' => 'published',
        'published_at' => now()->subDay(),
        'author_id' => $user->id,
    ]);
    $post->translations()->create([
        'locale' => 'ru',
        'title' => 'Пост с тегом',
        'content' => 'Содержание',
    ]);
    $post->tags()->attach($tag);

    $untaggedPost = Post::create([
        'slug' => 'untagged-post',
        'status' => 'published',
        'published_at' => now()->subDay(),
        'author_id' => $user->id,
    ]);
    $untaggedPost->translations()->create([
        'locale' => 'ru',
        'title' => 'Пост без тега',
        'content' => 'Содержание',
    ]);

    $this->get(route('news.index', ['locale' => 'ru', 'tag' => 'geology']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Public/News/Index')
            ->has('posts.data', 1)
        );
});

test('news can be filtered by category', function () {
    $user = User::factory()->create();

    $category = Category::create(['slug' => 'science', 'sort_order' => 1]);
    $category->translations()->create(['locale' => 'ru', 'name' => 'Наука']);

    $post = Post::create([
        'slug' => 'categorized-post',
        'status' => 'published',
        'published_at' => now()->subDay(),
        'author_id' => $user->id,
    ]);
    $post->translations()->create([
        'locale' => 'ru',
        'title' => 'Пост в категории',
        'content' => 'Содержание',
    ]);
    $post->categories()->attach($category);

    $this->get(route('news.index', ['locale' => 'ru', 'category' => 'science']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Public/News/Index')
            ->has('posts.data', 1)
        );
});
