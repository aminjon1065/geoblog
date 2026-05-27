<?php

use App\Cms\Widgets\WidgetRegistry;

beforeEach(function () {
    userWithRole('admin'); // seed roles
});

test('the registry holds the seeded widget catalog', function () {
    $registry = app(WidgetRegistry::class);
    expect($registry->keys())->toContain(
        'stats',
        'recent-posts',
        'recent-contacts',
        'featured-posts',
        'recent-activity',
    );
});

test('registering the same widget key twice throws', function () {
    $registry = new WidgetRegistry;
    $registry->register(new \App\Cms\Widgets\StatsWidget);

    expect(fn () => $registry->register(new \App\Cms\Widgets\StatsWidget))
        ->toThrow(InvalidArgumentException::class);
});

test('dashboard renders the widget set the viewer is allowed to see', function () {
    $this->actingAs(userWithRole('admin'));

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->has('widgets')
            ->where('widgets.0.component', 'Stats'));
});

test('viewer-permission gating drops widgets the user cannot see', function () {
    // Moderator: has posts.viewAny + contact-requests.* but NOT audit.viewAny.
    // RecentActivity must be filtered out; Stats stays (null permission).
    $this->actingAs(userWithRole('moderator'));

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(function ($page) {
            $widgets = $page->toArray()['props']['widgets'];
            $components = collect($widgets)->pluck('component')->all();

            expect($components)->toContain('Stats');
            expect($components)->not->toContain('RecentActivity');

            return $page;
        });
});
