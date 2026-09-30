<?php

use App\Models\ContactRequest;
use App\Models\Locale;

beforeEach(function () {
    $this->user = userWithRole('admin');
    $this->actingAs($this->user);

    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
});

test('guests cannot access admin contact requests', function () {
    auth()->logout();

    $this->get(route('admin.contact-requests.index'))->assertRedirect();
});

test('authenticated user can view contact requests index', function () {
    $this->get(route('admin.contact-requests.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Admin/ContactRequests/Index'));
});

test('authenticated user can view a contact request', function () {
    $request = ContactRequest::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'message' => 'Test message',
        'locale' => 'ru',
    ]);

    $this->get(route('admin.contact-requests.show', $request))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Admin/ContactRequests/Show'));
});

test('viewing a contact request marks it as read', function () {
    $request = ContactRequest::create([
        'name' => 'Test User',
        'email' => 'test@example.com',
        'message' => 'Test message',
        'locale' => 'ru',
        'is_read' => false,
    ]);

    $this->get(route('admin.contact-requests.show', $request));

    $request->refresh();
    expect($request->is_read)->toBeTrue();
});

test('authenticated user can delete a contact request', function () {
    $request = ContactRequest::create([
        'name' => 'Delete Me',
        'email' => 'delete@example.com',
        'message' => 'Delete this',
        'locale' => 'ru',
    ]);

    $this->delete(route('admin.contact-requests.destroy', $request))
        ->assertRedirect(route('admin.contact-requests.index'))
        ->assertSessionHas('success', 'Заявка удалена.');

    $this->assertSoftDeleted('contact_requests', ['id' => $request->id]);
});

/**
 * @return list<ContactRequest>
 */
function contactRequestsForBulk(int $count, bool $isRead = false): array
{
    $requests = [];

    for ($i = 1; $i <= $count; $i++) {
        $requests[] = ContactRequest::create([
            'name' => "Sender {$i}",
            'email' => "sender{$i}@example.com",
            'message' => "Message {$i}",
            'locale' => 'ru',
            'is_read' => $isRead,
        ]);
    }

    return $requests;
}

test('contact requests index counts all, unread and read requests', function () {
    contactRequestsForBulk(2);
    contactRequestsForBulk(1, isRead: true);

    $this->get(route('admin.contact-requests.index', ['status' => 'read']))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('requests.data', 1)
            ->where('counts.all', 3)
            ->where('counts.unread', 2)
            ->where('counts.read', 1));
});

test('the show screen gets the language name and a read request', function () {
    [$request] = contactRequestsForBulk(1);

    $this->get(route('admin.contact-requests.show', $request))
        ->assertInertia(fn ($page) => $page
            ->where('contactRequest.id', $request->id)
            ->where('contactRequest.locale_name', 'Русский')
            ->where('contactRequest.is_read', true));
});

test('bulk action marks requests as read', function () {
    [$first, $second, $untouched] = contactRequestsForBulk(3);

    $this->post(route('admin.contact-requests.bulk'), [
        'action' => 'mark_read',
        'ids' => [$first->id, $second->id],
    ])->assertRedirect()
        ->assertSessionHas('success', '2 заявки отмечены как прочитанные.');

    expect($first->fresh()->is_read)->toBeTrue()
        ->and($second->fresh()->is_read)->toBeTrue()
        ->and($untouched->fresh()->is_read)->toBeFalse();
});

test('bulk action marks requests as unread and can return to the list', function () {
    [$request] = contactRequestsForBulk(1, isRead: true);

    $this->post(route('admin.contact-requests.bulk'), [
        'action' => 'mark_unread',
        'ids' => [$request->id],
        'redirect' => 'index',
    ])->assertRedirect(route('admin.contact-requests.index'))
        ->assertSessionHas('success', '1 заявка отмечена как непрочитанная.');

    expect($request->fresh()->is_read)->toBeFalse();
});

test('bulk action deletes requests', function () {
    $requests = contactRequestsForBulk(5);

    $this->post(route('admin.contact-requests.bulk'), [
        'action' => 'delete',
        'ids' => collect($requests)->pluck('id')->all(),
    ])->assertRedirect()
        ->assertSessionHas('success', '5 заявок удалено.');

    expect(ContactRequest::count())->toBe(0)
        ->and(ContactRequest::withTrashed()->count())->toBe(5);
});

test('bulk action validates the action and the selection', function () {
    $this->post(route('admin.contact-requests.bulk'), [
        'action' => 'archive',
        'ids' => [],
    ])->assertSessionHasErrors([
        'action' => 'Неизвестное действие.',
        'ids' => 'Отметьте хотя бы одну заявку.',
    ]);
});

test('bulk actions need the matching permission', function () {
    [$request] = contactRequestsForBulk(1);

    $this->actingAs(userWithRole('editor'));

    $this->post(route('admin.contact-requests.bulk'), [
        'action' => 'mark_read',
        'ids' => [$request->id],
    ])->assertForbidden();

    $this->actingAs(userWithRole('moderator'));

    $this->post(route('admin.contact-requests.bulk'), [
        'action' => 'delete',
        'ids' => [$request->id],
    ])->assertRedirect();

    $this->assertSoftDeleted('contact_requests', ['id' => $request->id]);
});
