<?php

use App\Services\Settings\SettingsRepository;
use Illuminate\Support\Facades\Cache;

beforeEach(function () {
    Cache::flush();
});

test('robots.txt returns the default body when setting is empty', function () {
    $this->get('/robots.txt')
        ->assertOk()
        ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
        ->assertSeeText('User-agent: *')
        ->assertSeeText('Sitemap: ');
});

test('robots.txt honors the seo_robots_txt setting when configured', function () {
    app(SettingsRepository::class)->set('seo_robots_txt', "User-agent: *\nDisallow: /private\n");

    $this->get('/robots.txt')
        ->assertOk()
        ->assertSeeText('Disallow: /private');
});
