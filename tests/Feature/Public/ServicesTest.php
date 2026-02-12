<?php

use App\Models\Locale;
use App\Models\Service;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
});

test('services index returns successful response', function () {
    $this->get(route('services.index', ['locale' => 'ru']))->assertOk();
});

test('services index displays services', function () {
    $service = Service::create([
        'slug' => 'test-service',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $service->translations()->create([
        'locale' => 'ru',
        'title' => 'Тестовая услуга',
        'description' => 'Описание услуги',
    ]);

    $this->get(route('services.index', ['locale' => 'ru']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Public/Services/Index')
            ->has('services', 1)
        );
});

test('inactive services are not shown', function () {
    Service::create([
        'slug' => 'inactive-service',
        'is_active' => false,
        'sort_order' => 1,
    ]);

    $this->get(route('services.index', ['locale' => 'ru']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Public/Services/Index')
            ->has('services', 0)
        );
});

test('service detail page returns successful response', function () {
    $service = Service::create([
        'slug' => 'detail-service',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $service->translations()->create([
        'locale' => 'ru',
        'title' => 'Детальная услуга',
    ]);

    $this->get(route('services.show', ['locale' => 'ru', 'slug' => 'detail-service']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Public/Services/Show')
            ->has('service')
        );
});

test('service detail returns 404 for nonexistent service', function () {
    $this->get(route('services.show', ['locale' => 'ru', 'slug' => 'nonexistent']))
        ->assertNotFound();
});
