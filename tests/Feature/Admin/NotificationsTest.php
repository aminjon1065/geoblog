<?php

use App\Models\Locale;
use App\Services\Notifications\NotificationService;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
    userWithRole('admin');
});

test('unread count is zero on a fresh database', function () {
    $admin = userWithRole('admin');

    expect(app(NotificationService::class)->unreadCount($admin))->toBe(0);
});

test('actions performed BY the viewer do not show up as notifications for them', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    // Cause an activity-log row attributed to this admin.
    activity('post')->causedBy($admin)->event('created')->log('admin created a post');

    expect(app(NotificationService::class)->unreadCount($admin))->toBe(0);
});

test('actions performed by SOMEONE ELSE register as unread', function () {
    $admin = userWithRole('admin');
    $editor = userWithRole('editor');

    activity('post')->causedBy($editor)->event('created')->log('editor created a post');

    expect(app(NotificationService::class)->unreadCount($admin))->toBe(1);
});

test('mark-all-read sets the timestamp and zeros the count', function () {
    $admin = userWithRole('admin');
    $editor = userWithRole('editor');

    activity('post')->causedBy($editor)->event('created')->log('editor created a post');
    expect(app(NotificationService::class)->unreadCount($admin))->toBe(1);

    $this->actingAs($admin)
        ->patch(route('admin.notifications.read-all'))
        ->assertRedirect();

    expect(app(NotificationService::class)->unreadCount($admin->fresh()))->toBe(0);
});

test('only notifiable log_names contribute to the count', function () {
    $admin = userWithRole('admin');
    $editor = userWithRole('editor');

    // `settings` is not in NotificationService::NOTIFIABLE_LOGS, so it should be
    // recorded in the audit trail but not surface as a user-facing notification.
    activity('setting')->causedBy($editor)->event('updated')->log('settings change');
    activity('post')->causedBy($editor)->event('created')->log('post create');

    expect(app(NotificationService::class)->unreadCount($admin))->toBe(1);
});

test('notifications endpoint returns count + items', function () {
    $admin = userWithRole('admin');
    $editor = userWithRole('editor');

    activity('post')->causedBy($editor)->event('created')->log('post create');

    $this->actingAs($admin)
        ->getJson(route('admin.notifications.index'))
        ->assertOk()
        ->assertJsonPath('unread', 1)
        ->assertJson(['items' => [['log_name' => 'post', 'event' => 'created']]]);
});
