<?php

use App\Services\Settings\SettingsCatalog;
use App\Services\Settings\SettingsRepository;

beforeEach(function () {
    // Snapshot cache outlives a single request, so each test must start from a
    // clean slate — otherwise a write in test A would silently affect test B.
    app(SettingsRepository::class)->flush();
});

test('editor cannot access settings', function () {
    $this->actingAs(userWithRole('editor'));

    $this->get(route('admin.settings.edit'))->assertForbidden();

    $this->patch(route('admin.settings.update'), [
        'values' => ['site_name' => 'Hijacked'],
    ])->assertForbidden();
});

test('admin can view the settings page with catalog groups and current values', function () {
    $this->actingAs(userWithRole('admin'));

    $this->get(route('admin.settings.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Settings/Index')
            ->has('groups')
            ->has('values.site_name')
        );
});

test('admin can update settings and writes land in the database', function () {
    $this->actingAs(userWithRole('admin'));

    $this->patch(route('admin.settings.update'), [
        'values' => [
            'site_name' => 'AGT',
            'contact_email' => 'hi@geo.tj',
        ],
    ])->assertRedirect();

    $this->assertDatabaseHas('settings', ['key' => 'site_name']);
    $this->assertDatabaseHas('settings', ['key' => 'contact_email']);

    $repo = app(SettingsRepository::class);
    expect($repo->get('site_name'))->toBe('AGT');
    expect($repo->get('contact_email'))->toBe('hi@geo.tj');
});

test('unknown setting keys are rejected at validation', function () {
    $this->actingAs(userWithRole('admin'));

    $this->patch(route('admin.settings.update'), [
        'values' => ['this_does_not_exist' => 'whatever'],
    ])->assertSessionHasErrors('values.this_does_not_exist');
});

test('url-typed settings reject malformed values', function () {
    $this->actingAs(userWithRole('admin'));

    $this->patch(route('admin.settings.update'), [
        'values' => ['logo_url' => 'not-a-real-url'],
    ])->assertSessionHasErrors('values.logo_url');
});

test('email-typed settings reject malformed values', function () {
    $this->actingAs(userWithRole('admin'));

    $this->patch(route('admin.settings.update'), [
        'values' => ['contact_email' => 'not-an-email'],
    ])->assertSessionHasErrors('values.contact_email');
});

test('repository falls back to catalog default when no row exists', function () {
    expect(app(SettingsRepository::class)->get('site_name'))
        ->toBe('Association of Geologists of Tajikistan');
});

test('repository returns the stored value once written', function () {
    $repo = app(SettingsRepository::class);
    $repo->set('site_name', 'Custom Name');

    // Build a fresh repository instance to prove the value made it to the DB
    // (and the new instance reconstructs the snapshot from there).
    $fresh = new SettingsRepository(app(SettingsCatalog::class));
    expect($fresh->get('site_name'))->toBe('Custom Name');
});

test('repository public() excludes non-public catalog entries', function () {
    $catalog = new SettingsCatalog([
        'misc' => [
            'label' => 'Misc',
            'settings' => [
                'safe_key' => ['type' => 'string', 'default' => 'safe', 'is_public' => true],
                'secret_key' => ['type' => 'string', 'default' => 'shhh', 'is_public' => false],
            ],
        ],
    ]);

    expect($catalog->publicKeys())->toEqual(['safe_key']);
    expect($catalog->isPublic('secret_key'))->toBeFalse();
});

test('catalog rejects unknown keys at write boundaries', function () {
    expect(fn () => app(SettingsRepository::class)->set('definitely_not_real', 'x'))
        ->toThrow(InvalidArgumentException::class);
});

test('Inertia share exposes public settings and a name backed by site_name', function () {
    $this->actingAs(userWithRole('admin'));

    app(SettingsRepository::class)->set('site_name', 'Geoblog Demo');

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('settings.site_name')
            ->where('settings.site_name', 'Geoblog Demo')
            ->where('name', 'Geoblog Demo')
        );
});
