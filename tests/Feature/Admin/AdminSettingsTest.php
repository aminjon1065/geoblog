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

test('the google analytics id must be a bare measurement id', function (string $value) {
    $this->actingAs(userWithRole('admin'));

    $this->patch(route('admin.settings.update'), [
        'values' => ['seo_google_analytics_id' => $value],
    ])->assertSessionHasErrors('values.seo_google_analytics_id');

    expect(app(SettingsRepository::class)->get('seo_google_analytics_id'))->toBe('');
})->with([
    'script injection' => "G-ABC'});alert(document.cookie);//",
    'closing tag' => 'G-1</script><script>alert(1)</script>',
    'lower case' => 'g-abc123',
    'universal analytics id' => 'UA-12345-1',
    'surrounding spaces inside' => 'G-ABC 123',
]);

test('a valid google analytics id is saved and can be cleared again', function () {
    $this->actingAs(userWithRole('admin'));

    $this->patch(route('admin.settings.update'), [
        'values' => ['seo_google_analytics_id' => 'G-AB12CD34EF'],
    ])->assertSessionHasNoErrors();

    expect(app(SettingsRepository::class)->get('seo_google_analytics_id'))->toBe('G-AB12CD34EF');

    $this->patch(route('admin.settings.update'), [
        'values' => ['seo_google_analytics_id' => ''],
    ])->assertSessionHasNoErrors();

    expect(app(SettingsRepository::class)->get('seo_google_analytics_id'))->toBeNull();
});

test('the google analytics error message is in russian', function () {
    $this->actingAs(userWithRole('admin'));

    $this->patch(route('admin.settings.update'), [
        'values' => ['seo_google_analytics_id' => 'nope'],
    ])->assertSessionHasErrors([
        'values.seo_google_analytics_id' => 'Идентификатор Google Analytics должен иметь вид G-XXXXXXXXXX: латинская G, дефис, затем заглавные латинские буквы и цифры.',
    ]);
});

test('url settings accept http(s) addresses and site-root paths only', function (string $value, bool $valid) {
    $this->actingAs(userWithRole('admin'));

    $response = $this->patch(route('admin.settings.update'), [
        'values' => ['logo_url' => $value],
    ]);

    $valid
        ? $response->assertSessionHasNoErrors()
        : $response->assertSessionHasErrors('values.logo_url');
})->with([
    'https address' => ['https://cdn.geo.tj/logo.svg', true],
    'site-root path' => ['/images/logo.svg', true],
    'protocol-relative address' => ['//evil.example/logo.svg', false],
    'javascript scheme' => ['javascript:alert(1)', false],
    'ftp address' => ['ftp://files.geo.tj/logo.svg', false],
    'relative path' => ['images/logo.svg', false],
]);

test('settings screen labels and flash are in russian', function () {
    $this->actingAs(userWithRole('admin'));

    $this->get(route('admin.settings.edit'))
        ->assertInertia(fn ($page) => $page
            ->where('groups.0.key', 'general')
            ->where('groups.0.label', 'Общие')
            ->where('groups.0.settings.0.key', 'site_name')
            ->where('groups.0.settings.0.label', 'Название сайта'));

    $this->patch(route('admin.settings.update'), [
        'values' => ['site_name' => 'АГТ'],
    ])->assertSessionHas('success', 'Настройки сохранены.');

    $this->patch(route('admin.settings.update'), [
        'values' => ['contact_email' => 'not-an-email'],
    ])->assertSessionHasErrors([
        'values.contact_email' => 'Значение поля «E-mail» должно быть действительным адресом электронной почты.',
    ]);
});
