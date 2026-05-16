<?php

use App\Models\ContactRequest;
use App\Models\Locale;
use App\Models\Post;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
});

test('posts index filters by status', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    Post::create(['slug' => 'draft-1', 'status' => 'draft', 'author_id' => $admin->id]);
    Post::create(['slug' => 'pub-1', 'status' => 'published', 'published_at' => now(), 'author_id' => $admin->id]);
    Post::create(['slug' => 'pub-2', 'status' => 'published', 'published_at' => now(), 'author_id' => $admin->id]);

    $this->get(route('admin.posts.index', ['status' => 'published']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Posts/Index')
            ->has('posts.data', 2)
            ->where('filters.status', 'published'));
});

test('posts index filters by search across slug and translation title', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    $p1 = Post::create(['slug' => 'amazing-fieldwork', 'status' => 'draft', 'author_id' => $admin->id]);
    $p1->translations()->create(['locale' => 'ru', 'title' => 'Amazing fieldwork', 'content' => 'x']);

    $p2 = Post::create(['slug' => 'totally-different', 'status' => 'draft', 'author_id' => $admin->id]);
    $p2->translations()->create(['locale' => 'ru', 'title' => 'Totally different', 'content' => 'y']);

    $this->get(route('admin.posts.index', ['search' => 'fieldwork']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Posts/Index')
            ->has('posts.data', 1)
            ->where('posts.data.0.slug', 'amazing-fieldwork'));
});

test('posts index filters by author', function () {
    $admin = userWithRole('admin');
    $other = userWithRole('admin');
    $this->actingAs($admin);

    Post::create(['slug' => 'mine', 'status' => 'draft', 'author_id' => $admin->id]);
    Post::create(['slug' => 'other-1', 'status' => 'draft', 'author_id' => $other->id]);
    Post::create(['slug' => 'other-2', 'status' => 'draft', 'author_id' => $other->id]);

    $this->get(route('admin.posts.index', ['author' => $other->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('posts.data', 2)
            ->where('filters.author', $other->id));
});

test('posts index returns per-row can map respecting ownership for authors', function () {
    $author = userWithRole('author');
    $otherAuthor = userWithRole('author');
    $this->actingAs($author);

    Post::create(['slug' => 'mine', 'status' => 'draft', 'author_id' => $author->id]);
    Post::create(['slug' => 'theirs', 'status' => 'draft', 'author_id' => $otherAuthor->id]);

    $this->get(route('admin.posts.index'))
        ->assertOk()
        ->assertInertia(function ($page) use ($author) {
            $rows = collect($page->toArray()['props']['posts']['data']);
            $own = $rows->firstWhere('slug', 'mine');
            $foreign = $rows->firstWhere('slug', 'theirs');

            expect($own['can']['update'])->toBeTrue()
                ->and($own['can']['delete'])->toBeTrue()
                ->and($foreign['can']['update'])->toBeFalse()
                ->and($foreign['can']['delete'])->toBeFalse()
                ->and($own['author_id'])->toBe($author->id);

            return $page;
        });
});

test('posts index returns can map true for admin on every row', function () {
    $admin = userWithRole('admin');
    $author = userWithRole('author');
    $this->actingAs($admin);

    Post::create(['slug' => 'p', 'status' => 'draft', 'author_id' => $author->id]);

    $this->get(route('admin.posts.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('posts.data.0.can.update', true)
            ->where('posts.data.0.can.delete', true));
});

test('contact requests index filters by unread status', function () {
    $this->actingAs(userWithRole('admin'));

    ContactRequest::create(['name' => 'A', 'email' => 'a@x.com', 'message' => 'hi', 'locale' => 'ru', 'is_read' => false]);
    ContactRequest::create(['name' => 'B', 'email' => 'b@x.com', 'message' => 'hi', 'locale' => 'ru', 'is_read' => true]);
    ContactRequest::create(['name' => 'C', 'email' => 'c@x.com', 'message' => 'hi', 'locale' => 'ru', 'is_read' => false]);

    $this->get(route('admin.contact-requests.index', ['status' => 'unread']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('requests.data', 2)->where('filters.status', 'unread'));
});

test('contact requests index searches across name email and message', function () {
    $this->actingAs(userWithRole('admin'));

    ContactRequest::create(['name' => 'Alice', 'email' => 'alice@example.com', 'message' => 'hello', 'locale' => 'ru']);
    ContactRequest::create(['name' => 'Bob', 'email' => 'bob@example.com', 'message' => 'lorem', 'locale' => 'ru']);

    $this->get(route('admin.contact-requests.index', ['search' => 'alice']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('requests.data', 1)->where('requests.data.0.name', 'Alice'));
});

test('contact requests index returns empty filters object on plain request', function () {
    $this->actingAs(userWithRole('admin'));

    $this->get(route('admin.contact-requests.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('filters.search', null)->where('filters.status', null));
});
