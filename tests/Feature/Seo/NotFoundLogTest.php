<?php

use App\Models\Locale;
use App\Models\NotFoundLog;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
    userWithRole('admin');
});

test('a 404 on a public path is recorded once and increments on repeat hits', function () {
    $this->get('/no-such-path');
    $this->get('/no-such-path');

    $row = NotFoundLog::firstOrFail();
    expect($row->path)->toBe('/no-such-path');
    expect($row->hits)->toBe(2);
});

test('admin paths are not recorded in not_found_log', function () {
    $this->get('/admin/totally-fake');
    $this->get('/settings/whatever');

    expect(NotFoundLog::count())->toBe(0);
});

test('the not-found admin viewer requires the not-found.viewAny permission', function () {
    $this->actingAs(userWithRole('editor'));
    $this->get(route('admin.not-found.index'))->assertForbidden();

    $this->actingAs(userWithRole('admin'));
    $this->get(route('admin.not-found.index'))->assertOk();
});

test('admin can delete a not-found log entry', function () {
    $entry = NotFoundLog::create(['path' => '/x', 'hits' => 5, 'last_at' => now()]);

    $this->actingAs(userWithRole('admin'));
    $this->delete(route('admin.not-found.destroy', $entry))->assertRedirect();
    $this->assertDatabaseMissing('not_found_log', ['id' => $entry->id]);
});

test('admin can clear several 404 entries at once', function () {
    $first = NotFoundLog::create(['path' => '/wp-login.php', 'hits' => 40, 'last_at' => now()]);
    $second = NotFoundLog::create(['path' => '/xmlrpc.php', 'hits' => 12, 'last_at' => now()]);
    $kept = NotFoundLog::create(['path' => '/old-news', 'hits' => 3, 'last_at' => now()]);

    $this->actingAs(userWithRole('admin'))
        ->delete(route('admin.not-found.bulk-destroy'), ['ids' => [$first->id, $second->id]])
        ->assertRedirect()
        ->assertSessionHas('success', 'Удалено записей из журнала 404: 2.');

    expect(NotFoundLog::pluck('id')->all())->toBe([$kept->id]);
});

test('clearing 404 entries requires redirects.manage', function () {
    $entry = NotFoundLog::create(['path' => '/x', 'hits' => 5, 'last_at' => now()]);

    $this->actingAs(userWithRole('editor'))
        ->delete(route('admin.not-found.bulk-destroy'), ['ids' => [$entry->id]])
        ->assertForbidden();

    $this->assertDatabaseHas('not_found_log', ['id' => $entry->id]);
});

test('the 404 log sorts by last hit when asked', function () {
    $older = NotFoundLog::create(['path' => '/older', 'hits' => 90, 'last_at' => now()->subDays(3)]);
    $newer = NotFoundLog::create(['path' => '/newer', 'hits' => 1, 'last_at' => now()]);

    $this->actingAs(userWithRole('admin'))
        ->get(route('admin.not-found.index', ['orderby' => 'last_at', 'order' => 'desc']))
        ->assertInertia(fn ($page) => $page
            ->component('Admin/NotFound/Index')
            ->where('entries.data.0.id', $newer->id)
            ->where('entries.data.1.id', $older->id));
});
