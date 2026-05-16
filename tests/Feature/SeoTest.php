<?php

use App\Models\Locale;
use App\Models\Post;
use App\Models\Service;
use App\Models\User;
use App\Support\Seo\SeoBuilder;
use Illuminate\Http\Request;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'en'], ['name' => 'English', 'is_active' => true, 'sort_order' => 1]);
    Locale::firstOrCreate(['code' => 'ru'], ['name' => 'Русский', 'is_active' => true, 'sort_order' => 2]);
    Locale::firstOrCreate(['code' => 'tj'], ['name' => 'Тоҷикӣ', 'is_active' => true, 'sort_order' => 3]);
});

test('hreflang alternates include every active locale plus x-default', function () {
    $request = Request::create('http://example.test/ru/news/some-post');

    $alternates = SeoBuilder::alternates($request, ['en', 'ru', 'tj']);

    expect($alternates)->toHaveCount(4)
        ->and(collect($alternates)->pluck('locale')->all())->toBe(['en', 'ru', 'tj', 'x-default'])
        ->and(collect($alternates)->firstWhere('locale', 'en')['url'])->toBe('http://example.test/en/news/some-post')
        ->and(collect($alternates)->firstWhere('locale', 'tj')['url'])->toBe('http://example.test/tj/news/some-post')
        ->and(collect($alternates)->firstWhere('locale', 'x-default')['url'])->toBe('http://example.test/en/news/some-post');
});

test('hreflang alternates are empty when route is not locale-prefixed', function () {
    $request = Request::create('http://example.test/dashboard');

    $alternates = SeoBuilder::alternates($request, ['en', 'ru', 'tj']);

    expect($alternates)->toBe([]);
});

test('hreflang alternates preserve query strings', function () {
    $request = Request::create('http://example.test/ru/news?page=2&tag=foo');

    $alternates = SeoBuilder::alternates($request, ['en', 'ru']);

    expect(collect($alternates)->firstWhere('locale', 'en')['url'])
        ->toBe('http://example.test/en/news?page=2&tag=foo');
});

test('canonical strips query string', function () {
    $request = Request::create('http://example.test/ru/news?utm_source=foo');

    expect(SeoBuilder::canonical($request))->toBe('http://example.test/ru/news');
});

test('article structured data contains schema.org NewsArticle fields', function () {
    $user = User::factory()->create(['name' => 'Author Name']);
    $post = Post::create([
        'slug' => 'big-news', 'status' => 'published', 'published_at' => now()->subDay(),
        'author_id' => $user->id,
    ]);
    $post->translations()->create([
        'locale' => 'ru', 'title' => 'Big News', 'content' => '<p>Body</p>',
        'meta_description' => 'A description',
    ]);
    $post->setRelation('author', $user);
    $post->load('translation');

    app()->setLocale('ru');
    $request = Request::create('http://example.test/ru/news/big-news');

    $blocks = SeoBuilder::articleStructuredData($post, $request);

    expect($blocks)->toHaveCount(2);

    $article = $blocks[0];
    expect($article['@type'])->toBe('NewsArticle')
        ->and($article['headline'])->toBe('Big News')
        ->and($article['inLanguage'])->toBe('ru')
        ->and($article['url'])->toBe('http://example.test/ru/news/big-news')
        ->and($article['author']['name'])->toBe('Author Name')
        ->and($article['publisher']['@type'])->toBe('Organization');

    $breadcrumb = $blocks[1];
    expect($breadcrumb['@type'])->toBe('BreadcrumbList')
        ->and($breadcrumb['itemListElement'])->toHaveCount(3)
        ->and($breadcrumb['itemListElement'][2]['name'])->toBe('Big News');
});

test('service structured data contains schema.org Service', function () {
    $service = Service::create(['slug' => 'consulting', 'is_active' => true, 'sort_order' => 0]);
    $service->translations()->create(['locale' => 'ru', 'title' => 'Consulting']);
    $service->load('translation');

    app()->setLocale('ru');
    $request = Request::create('http://example.test/ru/services/consulting');

    $blocks = SeoBuilder::serviceStructuredData($service, $request);

    expect($blocks)->toHaveCount(2)
        ->and($blocks[0]['@type'])->toBe('Service')
        ->and($blocks[0]['name'])->toBe('Consulting')
        ->and($blocks[1]['@type'])->toBe('BreadcrumbList');
});

test('seo props are shared globally via inertia for any inertia page', function () {
    $this->actingAs(userWithRole('admin'));

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('seo.canonical')
            ->has('seo.locale')
            ->has('seo.alternates'));
});

test('post show endpoint returns structured data and og image', function () {
    $admin = userWithRole('admin');
    $post = Post::create([
        'slug' => 'public-post', 'status' => 'published', 'published_at' => now()->subDay(),
        'author_id' => $admin->id,
    ]);
    $post->translations()->create([
        'locale' => 'ru', 'title' => 'Public Post', 'content' => '<p>x</p>',
        'meta_description' => 'Public post description.',
    ]);

    $this->get(route('news.show', ['locale' => 'ru', 'slug' => 'public-post']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Public/News/Show')
            ->has('structuredData', 2)
            ->where('structuredData.0.@type', 'NewsArticle')
            ->where('structuredData.1.@type', 'BreadcrumbList')
            ->has('post.meta'));
});

test('home page returns Organization structured data', function () {
    $this->get(route('home', ['locale' => 'ru']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Public/Home')
            ->has('structuredData', 1)
            ->where('structuredData.0.@type', 'Organization'));
});

test('sitemap includes xhtml:link hreflang alternates', function () {
    $admin = userWithRole('admin');
    $post = Post::create([
        'slug' => 'sitemap-post', 'status' => 'published', 'published_at' => now()->subDay(),
        'author_id' => $admin->id,
    ]);
    $post->translations()->create(['locale' => 'ru', 'title' => 'x', 'content' => '<p>x</p>']);

    $response = $this->get('/sitemap.xml')->assertOk();

    $body = $response->getContent();
    expect($body)
        ->toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
        ->toContain('<xhtml:link rel="alternate" hreflang="en"')
        ->toContain('<xhtml:link rel="alternate" hreflang="ru"')
        ->toContain('<xhtml:link rel="alternate" hreflang="tj"')
        ->toContain('<xhtml:link rel="alternate" hreflang="x-default"');
});
