<?php

use App\Models\Category;
use App\Models\ContactRequest;
use App\Models\Locale;
use App\Models\Media;
use App\Models\Post;
use App\Models\Service;
use App\Models\Tag;
use App\Models\User;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
});

test('verified user without any role cannot access admin panel', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $this->actingAs($user);

    $this->get(route('admin.posts.index'))->assertForbidden();
    $this->get(route('admin.categories.index'))->assertForbidden();
    $this->get(route('admin.media.index'))->assertForbidden();
    $this->get(route('admin.contact-requests.index'))->assertForbidden();
});

test('super admin can do everything via Gate::before', function () {
    $this->actingAs(userWithRole('super_admin'));

    $this->get(route('admin.posts.index'))->assertOk();
    $this->get(route('admin.categories.index'))->assertOk();
    $this->get(route('admin.media.index'))->assertOk();
    $this->get(route('admin.contact-requests.index'))->assertOk();

    $post = Post::create(['slug' => 'x', 'status' => 'draft', 'author_id' => $this->app['auth']->id()]);
    $this->delete(route('admin.posts.destroy', $post))->assertRedirect();
});

test('editor can manage content but cannot see contact requests', function () {
    $this->actingAs(userWithRole('editor'));

    $this->get(route('admin.posts.index'))->assertOk();
    $this->get(route('admin.categories.index'))->assertOk();
    $this->get(route('admin.media.index'))->assertOk();

    $this->get(route('admin.contact-requests.index'))->assertForbidden();
});

test('moderator can view contact requests but not create posts or categories', function () {
    $user = userWithRole('moderator');
    $this->actingAs($user);

    $this->get(route('admin.contact-requests.index'))->assertOk();
    $this->get(route('admin.posts.index'))->assertOk();

    $this->get(route('admin.posts.create'))->assertForbidden();
    $this->post(route('admin.posts.store'), [])->assertForbidden();
    $this->get(route('admin.categories.index'))->assertForbidden();
});

test('moderator can delete a contact request', function () {
    $this->actingAs(userWithRole('moderator'));

    $request = ContactRequest::create([
        'name' => 'X', 'email' => 'x@example.com', 'message' => 'hi', 'locale' => 'ru',
    ]);

    $this->delete(route('admin.contact-requests.destroy', $request))
        ->assertRedirect();
    $this->assertSoftDeleted('contact_requests', ['id' => $request->id]);
});

test('author can edit own post but not someone elses post', function () {
    $author = userWithRole('author');
    $otherAuthor = userWithRole('author');

    $ownPost = Post::create(['slug' => 'mine', 'status' => 'draft', 'author_id' => $author->id]);
    $foreignPost = Post::create(['slug' => 'theirs', 'status' => 'draft', 'author_id' => $otherAuthor->id]);

    $this->actingAs($author);

    $this->get(route('admin.posts.edit', $ownPost))->assertOk();
    $this->get(route('admin.posts.edit', $foreignPost))->assertForbidden();

    $payload = [
        'status' => 'draft',
        'translations' => ['ru' => ['title' => 'Updated', 'content' => 'body']],
    ];

    $this->put(route('admin.posts.update', $ownPost), $payload)->assertRedirect();
    $this->put(route('admin.posts.update', $foreignPost), $payload)->assertForbidden();
});

test('author cannot delete someone elses post', function () {
    $author = userWithRole('author');
    $otherAuthor = userWithRole('author');

    $foreignPost = Post::create(['slug' => 'theirs', 'status' => 'draft', 'author_id' => $otherAuthor->id]);

    $this->actingAs($author);
    $this->delete(route('admin.posts.destroy', $foreignPost))->assertForbidden();
    $this->assertDatabaseHas('posts', ['id' => $foreignPost->id]);
});

test('editor can delete any post (full posts.delete permission)', function () {
    $editor = userWithRole('editor');
    $someone = userWithRole('author');

    $post = Post::create(['slug' => 'targeted', 'status' => 'draft', 'author_id' => $someone->id]);

    $this->actingAs($editor)
        ->delete(route('admin.posts.destroy', $post))
        ->assertRedirect();

    $this->assertSoftDeleted('posts', ['id' => $post->id]);
});

test('non-author cannot upload media', function () {
    $this->actingAs(userWithRole('moderator'));

    $this->post(route('admin.media.store'), [
        'files' => [Illuminate\Http\UploadedFile::fake()->image('x.jpg')],
    ])->assertForbidden();
});

test('author cannot delete media (delete not granted)', function () {
    $author = userWithRole('author');

    Illuminate\Support\Facades\Storage::fake('public');
    $media = Media::create([
        'disk' => 'public', 'path' => 'media/x.jpg',
        'mime_type' => 'image/jpeg', 'size' => 100,
    ]);

    $this->actingAs($author)
        ->delete(route('admin.media.destroy', $media))
        ->assertForbidden();
});

test('editor can create and update categories, tags, services', function () {
    $this->actingAs(userWithRole('editor'));

    $this->post(route('admin.categories.store'), [
        'slug' => 'editor-made',
        'translations' => ['ru' => ['name' => 'Категория']],
    ])->assertRedirect();

    $category = Category::where('slug', 'editor-made')->firstOrFail();

    $this->put(route('admin.categories.update', $category), [
        'slug' => 'editor-made',
        'translations' => ['ru' => ['name' => 'Изменено']],
    ])->assertRedirect();

    $this->post(route('admin.tags.store'), [
        'slug' => 'tag-x',
        'translations' => ['ru' => ['name' => 'Тег']],
    ])->assertRedirect();
    $this->assertDatabaseHas('tags', ['slug' => 'tag-x']);

    $this->post(route('admin.services.store'), [
        'is_active' => true,
        'translations' => ['ru' => ['title' => 'Услуга']],
    ])->assertRedirect();
    $this->assertDatabaseHas('services', ['slug' => 'usluga']);

    Tag::query()->delete();
    Service::query()->delete();
});

test('store-level FormRequest authorize blocks the request before validation runs', function () {
    $this->actingAs(userWithRole('moderator'));

    // Moderator has no posts.create permission. Even with empty payload (which would
    // trigger validation errors), we should get 403 first, not 422.
    $this->post(route('admin.posts.store'), [])->assertForbidden();
});
