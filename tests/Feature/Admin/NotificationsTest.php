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

test('authors and moderators do not see sign-ins or user account changes', function () {
    $editor = userWithRole('editor');

    activity('auth')->causedBy($editor)->event('login')->log('User logged in.');
    activity('user')->causedBy($editor)->event('updated')->log('updated');

    expect(app(NotificationService::class)->unreadCount(userWithRole('author')))->toBe(0)
        ->and(app(NotificationService::class)->unreadCount(userWithRole('moderator')))->toBe(0)
        ->and(app(NotificationService::class)->unreadCount(userWithRole('admin')))->toBe(2);
});

test('contact request activity only reaches users who may read the requests', function () {
    $moderator = userWithRole('moderator');
    $author = userWithRole('author');
    $editor = userWithRole('editor');
    $admin = userWithRole('admin');

    activity('contact-request')->causedBy($admin)->event('deleted')->log('deleted');

    $service = app(NotificationService::class);

    expect($service->unreadCount($moderator))->toBe(1)
        ->and($service->unreadCount($author))->toBe(0)
        ->and($service->unreadCount($editor))->toBe(0);
});

test('page activity is hidden from roles without access to pages', function () {
    $editor = userWithRole('editor');

    activity('content-page')->causedBy($editor)->event('created')->log('created');
    activity('post')->causedBy($editor)->event('created')->log('created');

    $service = app(NotificationService::class);

    // Authors and moderators see posts but have no pages.viewAny.
    expect($service->unreadCount(userWithRole('author')))->toBe(1)
        ->and($service->unreadCount(userWithRole('moderator')))->toBe(1)
        ->and($service->unreadCount(userWithRole('admin')))->toBe(2);
});

test('a user without any admin permission gets no notifications at all', function () {
    $editor = userWithRole('editor');
    $outsider = \App\Models\User::factory()->create();

    activity('post')->causedBy($editor)->event('created')->log('created');
    activity('auth')->causedBy($editor)->event('login')->log('User logged in.');

    expect(app(NotificationService::class)->unreadCount($outsider))->toBe(0)
        ->and(app(NotificationService::class)->recent($outsider))->toBe([]);
});

test('super_admin sees every notifiable channel', function () {
    $editor = userWithRole('editor');

    foreach (array_keys(NotificationService::NOTIFIABLE_LOGS) as $logName) {
        activity($logName)->causedBy($editor)->event('created')->log('created');
    }

    expect(app(NotificationService::class)->unreadCount(userWithRole('super_admin')))
        ->toBe(count(NotificationService::NOTIFIABLE_LOGS));
});

test('the notifications endpoint only lists what the viewer may see, with russian labels', function () {
    $moderator = userWithRole('moderator');
    $admin = userWithRole('admin');

    activity('auth')->causedBy($admin)->event('login')->log('User logged in.');
    activity('post')->causedBy($admin)->event('created')->log('created');

    $this->actingAs($moderator)
        ->getJson(route('admin.notifications.index'))
        ->assertOk()
        ->assertJsonPath('unread', 1)
        ->assertJsonCount(1, 'items')
        ->assertJsonPath('items.0.log_name', 'post')
        ->assertJsonPath('items.0.event_label', 'Создание')
        ->assertJsonPath('items.0.log_label', 'Записи');
});
