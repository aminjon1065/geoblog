<?php

use App\Models\Locale;
use App\Models\Post;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
    userWithRole('admin');
});

test('search requires admin-panel.access (guests redirect)', function () {
    auth()->logout();
    $this->get('/admin/search?q=test')->assertRedirect();
});

test('search returns empty groups for queries shorter than 2 chars', function () {
    $this->actingAs(userWithRole('admin'));

    $this->getJson('/admin/search?q=')->assertOk()->assertJson(['groups' => []]);
    $this->getJson('/admin/search?q=a')->assertOk()->assertJson(['groups' => []]);
});

test('search returns matching posts grouped by type', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    $post = Post::create([
        'slug' => 'amazing-fieldwork',
        'status' => 'published',
        'published_at' => now()->subDay(),
        'author_id' => $admin->id,
    ]);
    $post->translations()->create([
        'locale' => 'ru',
        'title' => 'Amazing fieldwork',
        'content' => 'body',
    ]);

    $this->getJson('/admin/search?q=fieldwork')
        ->assertOk()
        ->assertJsonPath('groups.0.type', 'post')
        ->assertJsonPath('groups.0.items.0.title', 'Amazing fieldwork')
        ->assertJsonPath('groups.0.items.0.url', "/admin/posts/{$post->id}/edit");
});

test('search excludes providers the viewer has no permission for', function () {
    // Moderator has admin-panel.access + posts.viewAny + contact-requests.* only —
    // categories/tags/users are deliberately out of their permission set, so even if
    // matching rows exist those groups must not appear in the response.
    $moderator = userWithRole('moderator');
    $this->actingAs($moderator);

    \App\Models\Category::create(['slug' => 'hidden-from-moderator', 'sort_order' => 1]);
    $tag = \App\Models\Tag::create(['slug' => 'hidden-from-moderator-tag']);
    $tag->translations()->create(['locale' => 'ru', 'name' => 'Hidden Tag']);

    $response = $this->getJson('/admin/search?q=hidden')->assertOk();
    $groupTypes = collect($response->json('groups'))->pluck('type')->all();

    expect($groupTypes)->not->toContain('category');
    expect($groupTypes)->not->toContain('tag');
    expect($groupTypes)->not->toContain('user');
});
