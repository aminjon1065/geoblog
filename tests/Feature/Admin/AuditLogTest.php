<?php

use App\Models\Category;
use App\Models\Locale;
use App\Models\Post;
use App\Models\User;
use Spatie\Activitylog\Models\Activity;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
});

test('creating a post writes an activity row', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    $this->post(route('admin.posts.store'), [
        'status' => 'draft',
        'translations' => ['ru' => ['title' => 'Audit test', 'content' => '<p>body</p>']],
    ])->assertRedirect();

    $activity = Activity::where('log_name', 'post')->latest('id')->first();

    expect($activity)->not->toBeNull()
        ->and($activity->event)->toBe('created')
        ->and($activity->causer_id)->toBe($admin->id);
});

test('updating and deleting a post each write an activity row', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    $post = Post::create(['slug' => 'p1', 'status' => 'draft', 'author_id' => $admin->id]);

    $post->update(['status' => 'published']);
    $post->delete();

    $events = Activity::where('log_name', 'post')->orderBy('id')->pluck('event')->all();

    expect($events)->toContain('created')
        ->and($events)->toContain('updated')
        ->and($events)->toContain('deleted');
});

test('category create/update/delete are logged', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    $category = Category::create(['slug' => 'audit-cat', 'sort_order' => 0]);
    $category->update(['sort_order' => 5]);
    $category->delete();

    $events = Activity::where('log_name', 'category')->pluck('event')->all();

    expect($events)->toContain('created')
        ->and($events)->toContain('updated')
        ->and($events)->toContain('deleted');
});

test('successful login is logged with causer and ip', function () {
    $user = User::factory()->create([
        'email' => 'audit-login@example.com',
        'password' => bcrypt('password-123-LONG'),
        'email_verified_at' => now(),
    ]);

    $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'password-123-LONG',
    ])->assertRedirect();

    $activity = Activity::where('log_name', 'auth')->where('event', 'login')->first();

    expect($activity)->not->toBeNull()
        ->and($activity->causer_id)->toBe($user->id)
        ->and($activity->properties->get('ip'))->not->toBeNull();
});

test('failed login is logged without causer', function () {
    User::factory()->create([
        'email' => 'audit-fail@example.com',
        'password' => bcrypt('correct-horse-battery'),
        'email_verified_at' => now(),
    ]);

    $this->post(route('login.store'), [
        'email' => 'audit-fail@example.com',
        'password' => 'wrong',
    ]);

    $activity = Activity::where('log_name', 'auth')->where('event', 'login_failed')->first();

    expect($activity)->not->toBeNull()
        ->and($activity->properties->get('attempted_email'))->toBe('audit-fail@example.com');
});

test('logout is logged', function () {
    $user = userWithRole('admin');
    $this->actingAs($user);

    $this->post(route('logout'))->assertRedirect();

    $activity = Activity::where('log_name', 'auth')->where('event', 'logout')->first();

    expect($activity)->not->toBeNull()
        ->and($activity->causer_id)->toBe($user->id);
});

test('user without audit.viewAny permission is forbidden', function () {
    $this->actingAs(userWithRole('author'));

    $this->get(route('admin.audit.index'))->assertForbidden();
});

test('admin can view the audit page', function () {
    $this->actingAs(userWithRole('admin'));

    $this->get(route('admin.audit.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/Audit/Index')->has('activities'));
});

test('audit page filters by event and log name', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    activity('post')->event('created')->log('p');
    activity('auth')->event('login')->log('l');

    $this->get(route('admin.audit.index', ['event' => 'login']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Audit/Index')
            ->has('activities.data', 1)
            ->where('activities.data.0.event', 'login'));
});

test('password is not present in user activity properties', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    $admin->update(['name' => 'Renamed']);

    $activity = Activity::where('log_name', 'user')->where('event', 'updated')->latest('id')->first();

    expect($activity)->not->toBeNull();

    $serialized = json_encode($activity->properties);
    expect($serialized)
        ->not->toContain('password')
        ->not->toContain('two_factor_secret');
});
