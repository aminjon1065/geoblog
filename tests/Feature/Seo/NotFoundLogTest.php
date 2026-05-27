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
