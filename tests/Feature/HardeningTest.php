<?php

use App\Models\Category;
use App\Models\ContactRequest;
use App\Models\Locale;
use App\Models\Post;
use App\Models\Service;
use App\Models\Tag;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    // Tests share the array cache across the same PHP process; reset rate-limiter
    // counters so neighbouring suites don't pre-poison the contact-form throttle.
    Cache::flush();
});

/* -------- SVG / strict MIME validation -------- */

test('media upload rejects svg files', function () {
    Storage::fake('public');
    $this->actingAs(userWithRole('admin'));

    $svgContent = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    $svg = UploadedFile::fake()->createWithContent('payload.svg', $svgContent);

    $this->post(route('admin.media.store'), ['files' => [$svg]])
        ->assertSessionHasErrors('files.0');

    expect(\App\Models\Media::count())->toBe(0);
});

test('media upload rejects a file with disallowed MIME', function () {
    Storage::fake('public');
    $this->actingAs(userWithRole('admin'));

    // PHP / shell scripts must never pass even if the extension was renamed.
    $file = UploadedFile::fake()->create('malware.png', 50, 'application/x-php');

    $this->post(route('admin.media.store'), ['files' => [$file]])
        ->assertSessionHasErrors('files.0');
});

test('media upload still accepts a real jpeg', function () {
    Storage::fake('public');
    $this->actingAs(userWithRole('admin'));

    $jpg = UploadedFile::fake()->image('ok.jpg', 200, 200);

    $this->post(route('admin.media.store'), ['files' => [$jpg]])
        ->assertRedirect();

    expect(\App\Models\Media::count())->toBe(1);
});

test('media upload rejects more than 20 files in a single batch', function () {
    Storage::fake('public');
    $this->actingAs(userWithRole('admin'));

    $files = array_fill(0, 21, UploadedFile::fake()->image('x.jpg'));

    $this->post(route('admin.media.store'), ['files' => $files])
        ->assertSessionHasErrors('files');
});

/* -------- Contact form rate limiting -------- */

test('contact form is rate limited per email after 3 submissions', function () {
    // Same email + IP key: per-email lane (3/min) should kick in before per-IP (5/min).
    $payload = [
        'name' => 'Spam Bot',
        'email' => 'spammer@example.com',
        'message' => 'Hello',
    ];

    for ($i = 0; $i < 3; $i++) {
        $this->post(route('contact.store', ['locale' => 'ru']), $payload)->assertRedirect();
    }

    $this->post(route('contact.store', ['locale' => 'ru']), $payload)->assertStatus(429);
});

test('contact form is rate limited per ip after 5 submissions across emails', function () {
    $base = [
        'name' => 'Spam',
        'message' => 'Hello',
    ];

    for ($i = 0; $i < 5; $i++) {
        $this->post(route('contact.store', ['locale' => 'ru']), $base + [
            'email' => "ip-spam-{$i}@example.com",
        ])->assertRedirect();
    }

    $this->post(route('contact.store', ['locale' => 'ru']), $base + [
        'email' => 'ip-spam-final@example.com',
    ])->assertStatus(429);
});

/* -------- Soft deletes -------- */

test('deleting a post soft-deletes it rather than removing the row', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    $post = Post::create(['slug' => 'soft-del', 'status' => 'draft', 'author_id' => $admin->id]);

    $this->delete(route('admin.posts.destroy', $post))->assertRedirect();

    expect(Post::find($post->id))->toBeNull()
        ->and(Post::withTrashed()->find($post->id))->not->toBeNull()
        ->and(Post::withTrashed()->find($post->id)->deleted_at)->not->toBeNull();
});

test('soft-deleted posts are excluded from the public news index', function () {
    $admin = userWithRole('admin');
    $post = Post::create([
        'slug' => 'deleted-news',
        'status' => 'published',
        'published_at' => now()->subDay(),
        'author_id' => $admin->id,
    ]);
    $post->translations()->create(['locale' => 'ru', 'title' => 'X', 'content' => '<p>x</p>']);
    $post->delete();

    $this->get(route('news.show', ['locale' => 'ru', 'slug' => 'deleted-news']))
        ->assertNotFound();
});

test('deleting category soft-deletes it', function () {
    $this->actingAs(userWithRole('admin'));

    $category = Category::create(['slug' => 'soft-cat', 'sort_order' => 0]);

    $this->delete(route('admin.categories.destroy', $category))->assertRedirect();

    expect(Category::find($category->id))->toBeNull()
        ->and(Category::withTrashed()->find($category->id))->not->toBeNull();
});

test('deleting tag soft-deletes it', function () {
    $this->actingAs(userWithRole('admin'));

    $tag = Tag::create(['slug' => 'soft-tag']);

    $this->delete(route('admin.tags.destroy', $tag))->assertRedirect();

    expect(Tag::find($tag->id))->toBeNull()
        ->and(Tag::withTrashed()->find($tag->id))->not->toBeNull();
});

test('deleting service soft-deletes it', function () {
    $this->actingAs(userWithRole('admin'));

    $service = Service::create(['slug' => 'soft-svc', 'is_active' => true, 'sort_order' => 0]);

    $this->delete(route('admin.services.destroy', $service))->assertRedirect();

    expect(Service::find($service->id))->toBeNull()
        ->and(Service::withTrashed()->find($service->id))->not->toBeNull();
});

test('deleting contact request soft-deletes it', function () {
    $this->actingAs(userWithRole('admin'));

    $request = ContactRequest::create([
        'name' => 'X', 'email' => 'x@y.com', 'message' => 'hi', 'locale' => 'ru',
    ]);

    $this->delete(route('admin.contact-requests.destroy', $request))->assertRedirect();

    expect(ContactRequest::find($request->id))->toBeNull()
        ->and(ContactRequest::withTrashed()->find($request->id))->not->toBeNull();
});

/* -------- Security headers -------- */

test('public pages return safe security headers', function () {
    $response = $this->get(route('home', ['locale' => 'ru']));

    $response->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
        ->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    expect($response->headers->get('Permissions-Policy'))->toContain('camera=()');
    expect($response->headers->has('X-Powered-By'))->toBeFalse();
});

test('admin pages return safe security headers', function () {
    $this->actingAs(userWithRole('admin'))
        ->get(route('admin.posts.index'))
        ->assertOk()
        ->assertHeader('X-Content-Type-Options', 'nosniff')
        ->assertHeader('X-Frame-Options', 'SAMEORIGIN');
});
