<?php

use App\Models\Category;
use App\Models\Locale;
use App\Models\Media;
use App\Models\Post;
use App\Models\Tag;
use App\Services\Content\ReadingTimeCalculator;
use App\Services\Content\RelatedPostsResolver;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
    userWithRole('admin'); // seed roles
});

test('reading-time calculator strips HTML and yields >= 1 minute for any content', function () {
    expect(ReadingTimeCalculator::fromHtml(null))->toBeNull();
    expect(ReadingTimeCalculator::fromHtml(''))->toBeNull();
    expect(ReadingTimeCalculator::fromHtml('<p>One short line.</p>'))->toBe(1);

    // 400 words → 2 minutes (400/200).
    $words = str_repeat('word ', 400);
    expect(ReadingTimeCalculator::fromHtml("<p>{$words}</p>"))->toBe(2);
});

test('PostService computes reading_time_minutes on save', function () {
    $this->actingAs(userWithRole('admin'));

    $longContent = '<p>'.str_repeat('слово ', 600).'</p>'; // 600 words → 3 minutes

    $this->post(route('admin.posts.store'), [
        'status' => 'draft',
        'translations' => [
            'ru' => [
                'title' => 'Длинная статья',
                'content' => $longContent,
            ],
        ],
    ])->assertRedirect();

    $post = Post::firstOrFail();
    expect($post->translations()->where('locale', 'ru')->value('reading_time_minutes'))
        ->toBe(3);
});

test('is_featured persists through store + update', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.posts.store'), [
        'status' => 'published',
        'is_featured' => true,
        'translations' => ['ru' => ['title' => 'Featured one', 'content' => 'body']],
    ])->assertRedirect();

    $post = Post::firstOrFail();
    expect($post->is_featured)->toBeTrue();

    $this->put(route('admin.posts.update', $post), [
        'status' => 'published',
        'is_featured' => false,
        'translations' => ['ru' => ['title' => 'Featured one', 'content' => 'body']],
    ])->assertRedirect();

    expect($post->fresh()->is_featured)->toBeFalse();
});

test('featured scope returns only featured published posts', function () {
    $authorId = authorIdForTestPost();
    Post::create(['slug' => 'a', 'status' => 'published', 'published_at' => now()->subDay(), 'is_featured' => true, 'author_id' => $authorId]);
    Post::create(['slug' => 'b', 'status' => 'published', 'published_at' => now()->subDay(), 'is_featured' => false, 'author_id' => $authorId]);
    Post::create(['slug' => 'c', 'status' => 'draft', 'is_featured' => true, 'author_id' => $authorId]);

    $featured = Post::published()->featured()->pluck('slug')->all();
    expect($featured)->toEqual(['a']);
});

test('home page exposes featuredPosts prop', function () {
    $featured = Post::create([
        'slug' => 'featured-one',
        'status' => 'published',
        'published_at' => now()->subDay(),
        'is_featured' => true,
        'author_id' => authorIdForTestPost(),
    ]);
    $featured->translations()->create([
        'locale' => 'ru',
        'title' => 'Featured One',
        'content' => 'body',
    ]);

    $this->get(route('home', ['locale' => 'ru']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('featuredPosts', 1)
            ->where('featuredPosts.0.is_featured', true));
});

test('admin index marks future-published posts as scheduled', function () {
    $this->actingAs(userWithRole('admin'));
    $scheduled = Post::create([
        'slug' => 's',
        'status' => 'published',
        'published_at' => now()->addDays(7),
        'author_id' => auth()->id(),
    ]);
    $scheduled->translations()->create(['locale' => 'ru', 'title' => 'Scheduled', 'content' => 'body']);

    $this->get(route('admin.posts.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('posts.data.0.is_scheduled', true)
            ->where('posts.data.0.status', 'published'));
});

test('related posts prefer tag overlap over category fallback', function () {
    $tagA = Tag::create(['slug' => 'a']);
    $tagB = Tag::create(['slug' => 'b']);
    $cat = Category::create(['slug' => 'c', 'sort_order' => 1]);

    $source = makePublishedPost('source');
    $source->tags()->attach([$tagA->id, $tagB->id]);

    $strongMatch = makePublishedPost('strong-match'); // shares both tags
    $strongMatch->tags()->attach([$tagA->id, $tagB->id]);

    $weakMatch = makePublishedPost('weak-match'); // shares one tag
    $weakMatch->tags()->attach([$tagA->id]);

    $categoryOnly = makePublishedPost('cat-only'); // no tag overlap, shares category
    $source->categories()->attach($cat->id);
    $categoryOnly->categories()->attach($cat->id);

    $related = app(RelatedPostsResolver::class)->resolve($source, 3);
    $slugs = $related->pluck('slug')->all();

    // Tag-overlap matches lead; category match comes after.
    expect($slugs[0])->toBe('strong-match');
    expect($slugs[1])->toBe('weak-match');
    expect($slugs)->toContain('cat-only');
    expect($related)->toHaveCount(3);
});

test('related-posts excludes the source post and drafts', function () {
    $tag = Tag::create(['slug' => 'shared']);

    $source = makePublishedPost('source');
    $source->tags()->attach($tag->id);

    $draftSharing = makeDraftPost('draft');
    $draftSharing->tags()->attach($tag->id);

    $related = app(RelatedPostsResolver::class)->resolve($source, 3);

    $ids = $related->pluck('id')->all();
    expect($ids)->not->toContain($source->id);
    expect($ids)->not->toContain($draftSharing->id);
});

test('og_image_id persists and resolves into the public show payload', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    $media = Media::create([
        'disk' => 'public',
        'path' => 'media/share.jpg',
        'mime_type' => 'image/jpeg',
        'size' => 100,
    ]);

    $this->actingAs(userWithRole('admin'));
    $this->post(route('admin.posts.store'), [
        'status' => 'published',
        'og_image_id' => $media->id,
        'translations' => ['ru' => ['title' => 'With OG', 'content' => 'body']],
    ])->assertRedirect();

    $post = Post::firstOrFail();
    expect($post->og_image_id)->toBe($media->id);

    $this->get(route('news.show', ['locale' => 'ru', 'slug' => $post->slug]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('post.meta.image', fn ($v) => is_string($v) && str_contains($v, 'media/share.jpg')));
});

test('public show ships a related-posts list', function () {
    $tag = Tag::create(['slug' => 't']);

    $source = makePublishedPost('main');
    $source->tags()->attach($tag->id);

    $related = makePublishedPost('related');
    $related->tags()->attach($tag->id);

    $this->get(route('news.show', ['locale' => 'ru', 'slug' => 'main']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('related', 1)
            ->where('related.0.slug', 'related'));
});

/**
 * Resolve an author id for test posts. Uses the currently authenticated user
 * when available, otherwise spins up a factory-built user — this lets us write
 * test bodies that don't bother with actingAs() when the test isn't about auth.
 */
function authorIdForTestPost(): int
{
    $id = auth()->id();
    if ($id !== null) {
        return $id;
    }

    return \App\Models\User::factory()->create()->id;
}

/**
 * Create a published post with a Russian translation and return it.
 */
function makePublishedPost(string $slug): \App\Models\Post
{
    $post = \App\Models\Post::create([
        'slug' => $slug,
        'status' => 'published',
        'published_at' => now()->subDay(),
        'author_id' => authorIdForTestPost(),
    ]);
    $post->translations()->create([
        'locale' => 'ru',
        'title' => ucfirst($slug),
        'content' => 'body',
    ]);

    return $post;
}

function makeDraftPost(string $slug): \App\Models\Post
{
    $post = \App\Models\Post::create([
        'slug' => $slug,
        'status' => 'draft',
        'author_id' => authorIdForTestPost(),
    ]);
    $post->translations()->create([
        'locale' => 'ru',
        'title' => ucfirst($slug),
        'content' => 'body',
    ]);

    return $post;
}
