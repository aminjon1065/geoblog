<?php

use App\Models\Locale;
use App\Models\Redirect;
use App\Services\Seo\RedirectResolver;
use Illuminate\Support\Facades\Cache;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
    userWithRole('admin');
    Cache::flush();
});

test('redirect path normalization is lowercase + leading slash, no trailing slash', function () {
    expect(RedirectResolver::normalize(' /About/Us/'))->toBe('/about/us');
    expect(RedirectResolver::normalize('news'))->toBe('/news');
    expect(RedirectResolver::normalize('/'))->toBe('/');
    expect(RedirectResolver::normalize(''))->toBe('/');
});

test('GET to a redirected path returns 301 and the recorded target', function () {
    Redirect::create([
        'from_path' => '/legacy/article',
        'to_path' => '/news/new-article',
        'status_code' => 301,
    ]);

    $this->get('/legacy/article')
        ->assertStatus(301)
        ->assertHeader('Location', $this->app['url']->to('/news/new-article'));
});

test('redirect supports 302 status', function () {
    Redirect::create([
        'from_path' => '/temp',
        'to_path' => '/somewhere',
        'status_code' => 302,
    ]);

    $this->get('/temp')->assertStatus(302);
});

test('redirect bumps hits counter and last_hit_at', function () {
    $redirect = Redirect::create([
        'from_path' => '/track',
        'to_path' => '/somewhere',
        'status_code' => 301,
    ]);

    $this->get('/track');
    $this->get('/track');

    expect($redirect->fresh()->hits)->toBe(2);
    expect($redirect->fresh()->last_hit_at)->not->toBeNull();
});

test('admin paths are exempt from the redirect middleware', function () {
    Redirect::create([
        'from_path' => '/admin/posts',
        'to_path' => '/somewhere',
        'status_code' => 301,
    ]);

    // /admin/posts should still hit the auth-required admin route, not be redirected.
    $this->get('/admin/posts')->assertRedirect(route('login'));
});

test('non-GET requests are not redirected', function () {
    Redirect::create([
        'from_path' => '/api/posts',
        'to_path' => '/news',
        'status_code' => 301,
    ]);

    // A POST should bypass the redirect middleware so form submissions don't get
    // rewritten into GETs.
    $this->post('/api/posts')->assertStatus(404);
});

test('admin RBAC: only redirects.manage can manage redirects', function () {
    $this->actingAs(userWithRole('editor'));
    $this->get(route('admin.redirects.index'))->assertForbidden();

    $this->actingAs(userWithRole('admin'));
    $this->get(route('admin.redirects.index'))->assertOk();
});

test('store redirect normalizes from_path before validation', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.redirects.store'), [
        'from_path' => ' /Old/Path/ ',
        'to_path' => '/new/path',
        'status_code' => 301,
    ])->assertRedirect();

    $this->assertDatabaseHas('redirects', [
        'from_path' => '/old/path',
        'to_path' => '/new/path',
        'status_code' => 301,
    ]);
});

test('store rejects duplicate from_path after normalization', function () {
    $this->actingAs(userWithRole('admin'));
    Redirect::create(['from_path' => '/dup', 'to_path' => '/x', 'status_code' => 301]);

    $this->post(route('admin.redirects.store'), [
        'from_path' => '/DUP',
        'to_path' => '/y',
        'status_code' => 301,
    ])->assertSessionHasErrors('from_path');
});

test('store rejects unsupported status codes', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.redirects.store'), [
        'from_path' => '/x',
        'to_path' => '/y',
        'status_code' => 307,
    ])->assertSessionHasErrors('status_code');
});

test('flushing the resolver cache reflects DB writes', function () {
    Redirect::create(['from_path' => '/early', 'to_path' => '/news', 'status_code' => 301]);
    $resolver = app(RedirectResolver::class);

    expect($resolver->find('/early'))->not->toBeNull();

    Redirect::query()->where('from_path', '/early')->delete();
    // Without flushing, the cached map still contains the row.
    expect($resolver->find('/early'))->not->toBeNull();

    $resolver->flush();
    expect($resolver->find('/early'))->toBeNull();
});
