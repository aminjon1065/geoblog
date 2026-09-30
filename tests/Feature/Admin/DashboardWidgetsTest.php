<?php

use App\Cms\Widgets\AtAGlanceWidget;
use App\Cms\Widgets\WidgetRegistry;
use App\Models\Category;
use App\Models\ContactRequest;
use App\Models\ContentPage;
use App\Models\Media;
use App\Models\Post;
use App\Models\Service;
use App\Models\Tag;
use Database\Seeders\LocaleSeeder;
use Illuminate\Support\Collection;
use Illuminate\Testing\TestResponse;

beforeEach(function () {
    $this->seed(LocaleSeeder::class);
    userWithRole('admin'); // seed roles
});

/**
 * @param  array<string, string>  $titles  by locale
 * @param  array<string, mixed>  $attributes
 */
function dashboardPost(string $slug, array $attributes = [], array $titles = ['ru' => 'Запись'], ?string $content = null): Post
{
    $post = Post::create([
        'slug' => $slug,
        'status' => Post::STATUS_DRAFT,
        ...$attributes,
    ]);

    foreach ($titles as $locale => $title) {
        $post->translations()->create(['locale' => $locale, 'title' => $title, 'content' => $content]);
    }

    return $post;
}

/**
 * The dashboard's widgets by key.
 *
 * @return Collection<string, array<string, mixed>>
 */
function dashboardWidgets(TestResponse $response): Collection
{
    return collect($response->inertiaProps('widgets'))->keyBy('key');
}

test('the registry holds the WordPress dashboard widgets in order', function () {
    expect(app(WidgetRegistry::class)->keys())->toBe([
        'at-a-glance',
        'activity',
        'quick-draft',
        'featured-posts',
        'recent-activity',
    ]);
});

test('registering the same widget key twice throws', function () {
    $registry = new WidgetRegistry;
    $registry->register(new AtAGlanceWidget);

    expect(fn () => $registry->register(new AtAGlanceWidget))
        ->toThrow(InvalidArgumentException::class);
});

test('an admin sees every widget with its Russian title', function () {
    $response = $this->actingAs(userWithRole('admin'))->get(route('dashboard'))->assertOk();

    $response->assertInertia(fn ($page) => $page->component('dashboard'));

    expect(dashboardWidgets($response)->map(fn (array $widget): array => [$widget['label'], $widget['component']])->all())
        ->toBe([
            'at-a-glance' => ['На виду', 'AtAGlance'],
            'activity' => ['Активность', 'Activity'],
            'quick-draft' => ['Быстрый черновик', 'QuickDraft'],
            'featured-posts' => ['Избранные записи', 'FeaturedPosts'],
            'recent-activity' => ['Журнал действий', 'RecentActivity'],
        ]);
});

test('widgets and their parts follow the viewer permissions', function () {
    $moderator = $this->actingAs(userWithRole('moderator'))->get(route('dashboard'))->assertOk();
    $widgets = dashboardWidgets($moderator);

    expect($widgets->keys()->all())->toBe(['at-a-glance', 'activity', 'featured-posts'])
        ->and(collect($widgets['at-a-glance']['data']['items'])->pluck('key')->all())->toBe(['posts', 'contact_requests'])
        ->and($widgets['activity']['data']['contact_requests'])->toBeArray();

    $author = $this->actingAs(userWithRole('author'))->get(route('dashboard'))->assertOk();
    $widgets = dashboardWidgets($author);

    expect($widgets->keys()->all())->toBe(['at-a-glance', 'activity', 'quick-draft', 'featured-posts'])
        ->and(collect($widgets['at-a-glance']['data']['items'])->pluck('key')->all())->toBe(['posts', 'media'])
        ->and($widgets['activity']['data']['contact_requests'])->toBeNull()
        ->and($widgets['activity']['data']['published'])->toBeArray();
});

test('«На виду» counts the site content', function () {
    $admin = userWithRole('admin');

    dashboardPost('live-1', ['status' => Post::STATUS_PUBLISHED, 'published_at' => now()->subDay()]);
    dashboardPost('live-2', ['status' => Post::STATUS_PUBLISHED, 'published_at' => now()->subHour()]);
    dashboardPost('scheduled', ['status' => Post::STATUS_PUBLISHED, 'published_at' => now()->addDay()]);
    dashboardPost('draft-1');
    dashboardPost('draft-2');
    dashboardPost('pending', ['status' => Post::STATUS_PENDING]);
    dashboardPost('trashed', ['status' => Post::STATUS_PUBLISHED, 'published_at' => now()->subDay()])->delete();

    ContentPage::create(['slug' => 'about', 'status' => 'published', 'published_at' => now()->subDay()]);
    ContentPage::create(['slug' => 'draft-page', 'status' => 'draft']);
    Service::create(['slug' => 'survey', 'is_active' => true]);
    Service::create(['slug' => 'hidden', 'is_active' => false]);
    Category::create(['slug' => 'science', 'sort_order' => 1]);
    Tag::create(['slug' => 'lava']);
    Tag::create(['slug' => 'basalt']);
    Media::create(['disk' => 'public', 'path' => 'media/a.jpg', 'mime_type' => 'image/jpeg', 'size' => 10]);
    ContactRequest::create(['name' => 'A', 'email' => 'a@example.com', 'message' => 'Привет', 'locale' => 'ru', 'is_read' => true]);
    ContactRequest::create(['name' => 'B', 'email' => 'b@example.com', 'message' => 'Привет', 'locale' => 'ru', 'is_read' => false]);

    $data = dashboardWidgets($this->actingAs($admin)->get(route('dashboard')))['at-a-glance']['data'];

    expect($data['items'])->toBe([
        ['key' => 'posts', 'count' => 2],
        ['key' => 'pages', 'count' => 1],
        ['key' => 'services', 'count' => 1],
        ['key' => 'categories', 'count' => 1],
        ['key' => 'tags', 'count' => 2],
        ['key' => 'media', 'count' => 1],
        ['key' => 'contact_requests', 'count' => 2, 'unread' => 1],
    ])->and($data['posts'])->toBe(['drafts' => 2, 'pending' => 1, 'scheduled' => 1]);
});

test('«Активность» lists upcoming and recent posts and the latest requests', function () {
    $author = userWithRole('author');
    $someone = userWithRole('editor');

    foreach (range(1, 6) as $day) {
        dashboardPost("future-{$day}", [
            'status' => Post::STATUS_PUBLISHED,
            'published_at' => now()->addDays($day),
            'author_id' => $someone->id,
        ], ['ru' => "Скоро {$day}"]);
    }

    $own = dashboardPost('own-live', [
        'status' => Post::STATUS_PUBLISHED,
        'published_at' => now()->subHour(),
        'author_id' => $author->id,
    ], ['tj' => 'Хабар']);
    dashboardPost('older-live', [
        'status' => Post::STATUS_PUBLISHED,
        'published_at' => now()->subDays(2),
        'author_id' => $someone->id,
    ], ['ru' => 'Старая']);

    $data = dashboardWidgets($this->actingAs($author)->get(route('dashboard')))['activity']['data'];

    expect($data['scheduled'])->toHaveCount(5)
        ->and(collect($data['scheduled'])->pluck('title')->all())->toBe(['Скоро 1', 'Скоро 2', 'Скоро 3', 'Скоро 4', 'Скоро 5'])
        ->and($data['published'][0])->toMatchArray(['id' => $own->id, 'title' => 'Хабар', 'can_edit' => false])
        ->and($data['published'][1]['title'])->toBe('Старая')
        ->and($data['contact_requests'])->toBeNull();

    ContactRequest::create([
        'name' => 'Фарход',
        'email' => 'f@example.com',
        'message' => str_repeat('Нужна консультация по геологии участка. ', 5),
        'locale' => 'ru',
        'is_read' => false,
    ]);

    $data = dashboardWidgets($this->actingAs(userWithRole('admin'))->get(route('dashboard')))['activity']['data'];

    expect($data['contact_requests'])->toHaveCount(1)
        ->and($data['contact_requests'][0])->toMatchArray(['name' => 'Фарход', 'is_read' => false, 'can_view' => true])
        ->and(mb_strlen($data['contact_requests'][0]['excerpt']))->toBeLessThanOrEqual(93)
        ->and($data['published'][0]['can_edit'])->toBeTrue();
});

test('«Быстрый черновик» lists the viewer’s three newest drafts', function () {
    $author = userWithRole('author');
    $other = userWithRole('author');

    foreach (range(1, 4) as $number) {
        $this->travel($number)->minutes();
        dashboardPost("mine-{$number}", ['author_id' => $author->id], ['ru' => "Мой черновик {$number}"],
            '<p>Первый абзац <strong>текста</strong> черновика, в котором довольно много слов для отрывка.</p>');
    }

    dashboardPost('theirs', ['author_id' => $other->id], ['ru' => 'Чужой черновик']);
    dashboardPost('mine-live', ['author_id' => $author->id, 'status' => Post::STATUS_PUBLISHED, 'published_at' => now()], ['ru' => 'Опубликованная']);

    $drafts = dashboardWidgets($this->actingAs($author)->get(route('dashboard')))['quick-draft']['data']['drafts'];

    expect(collect($drafts)->pluck('title')->all())->toBe(['Мой черновик 4', 'Мой черновик 3', 'Мой черновик 2'])
        ->and($drafts[0]['excerpt'])->toBe('Первый абзац текста черновика, в котором довольно много слов для…')
        ->and($drafts[0]['can_edit'])->toBeTrue();
});

test('a quick draft saved from the dashboard shows up in the widget', function () {
    $author = userWithRole('author');

    $this->actingAs($author)
        ->from(route('dashboard'))
        ->post(route('admin.posts.quick-draft'), ['title' => 'Идея для статьи', 'content' => "Первый абзац.\n\nВторой абзац."])
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas('success', 'Черновик сохранён.');

    $drafts = dashboardWidgets($this->get(route('dashboard')))['quick-draft']['data']['drafts'];

    expect($drafts)->toHaveCount(1)
        ->and($drafts[0]['title'])->toBe('Идея для статьи')
        ->and($drafts[0]['excerpt'])->toBe('Первый абзац. Второй абзац.');

    $this->from(route('dashboard'))
        ->post(route('admin.posts.quick-draft'), ['title' => ''])
        ->assertRedirect(route('dashboard'))
        ->assertSessionHasErrorsIn('quickDraft', ['title']);
});

test('«Избранные записи» lists live featured posts only', function () {
    dashboardPost('featured-live', ['status' => Post::STATUS_PUBLISHED, 'published_at' => now()->subDay(), 'is_featured' => true], ['ru' => 'Главная новость']);
    dashboardPost('featured-draft', ['is_featured' => true], ['ru' => 'Черновик']);
    dashboardPost('plain-live', ['status' => Post::STATUS_PUBLISHED, 'published_at' => now()->subDay()], ['ru' => 'Обычная']);

    $posts = dashboardWidgets($this->actingAs(userWithRole('editor'))->get(route('dashboard')))['featured-posts']['data']['posts'];

    expect(collect($posts)->pluck('title')->all())->toBe(['Главная новость'])
        ->and($posts[0]['can_edit'])->toBeTrue();
});

test('«Журнал действий» tells the audit log in Russian', function () {
    $admin = userWithRole('admin');
    $admin->update(['name' => 'Анна']);
    $this->actingAs($admin);

    $category = Category::create(['slug' => 'science', 'sort_order' => 1]);
    activity('auth')->causedBy($admin)->performedOn($admin)->event('login')->log('User logged in.');
    activity('auth')->causedByAnonymous()->event('login_failed')->log('Failed login attempt.');

    $activities = dashboardWidgets($this->get(route('dashboard')))['recent-activity']['data']['activities'];
    $byAction = collect($activities)->keyBy('action');

    expect($byAction)->toHaveKeys([
        "создал(а) рубрику #{$category->id}",
        'вошёл(а) в панель управления',
        '— неудачная попытка входа',
    ])
        ->and($byAction["создал(а) рубрику #{$category->id}"]['causer'])->toBe('Анна')
        ->and($byAction['— неудачная попытка входа']['causer'])->toBe('Гость')
        ->and($byAction['вошёл(а) в панель управления']['ago'])->toContain('назад');
});
