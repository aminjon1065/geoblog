<?php

use App\Models\Locale;
use App\Models\Service;

beforeEach(function () {
    $this->user = userWithRole('admin');
    $this->actingAs($this->user);

    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
});

test('guests cannot access admin services', function () {
    auth()->logout();

    $this->get(route('admin.services.index'))->assertRedirect();
    $this->get(route('admin.services.create'))->assertRedirect();
    $this->post(route('admin.services.store'))->assertRedirect();
});

test('authenticated user can view services index', function () {
    $this->get(route('admin.services.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Admin/Services/Index'));
});

test('authenticated user can view create service form', function () {
    $this->get(route('admin.services.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Services/Create')
            ->has('locales')
        );
});

test('authenticated user can store a service', function () {
    $this->post(route('admin.services.store'), [
        'is_active' => true,
        'sort_order' => 1,
        'translations' => [
            'ru' => [
                'title' => 'Новая услуга',
                'description' => 'Описание',
                'content' => 'Содержание',
            ],
        ],
    ])->assertRedirect(route('admin.services.index'));

    $this->assertDatabaseHas('services', ['slug' => 'novaia-usluga']);
    $this->assertDatabaseHas('service_translations', ['title' => 'Новая услуга', 'locale' => 'ru']);
});

test('store service validates required fields', function () {
    $this->post(route('admin.services.store'), [])
        ->assertSessionHasErrors(['translations']);
});

test('authenticated user can update a service', function () {
    $service = Service::create([
        'slug' => 'old-service',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $this->put(route('admin.services.update', $service), [
        'is_active' => false,
        'sort_order' => 5,
        'translations' => [
            'ru' => [
                'title' => 'Обновлённая услуга',
            ],
        ],
    ])->assertRedirect(route('admin.services.index'));

    $service->refresh();
    expect($service->slug)->toBe('obnovlennaia-usluga');
    expect($service->is_active)->toBeFalse();
});

test('authenticated user can delete a service', function () {
    $service = Service::create([
        'slug' => 'delete-me',
        'is_active' => true,
        'sort_order' => 0,
    ]);

    $this->delete(route('admin.services.destroy', $service))
        ->assertRedirect(route('admin.services.index'));

    $this->assertSoftDeleted('services', ['id' => $service->id]);
});
