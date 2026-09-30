<?php

use App\Models\Locale;
use App\Models\Service;
use App\Models\ServiceTranslation;

beforeEach(function () {
    $this->user = userWithRole('admin');
    $this->actingAs($this->user);

    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);
});

/**
 * A service with a Russian title, created directly.
 */
function serviceWithTitle(string $slug, string $title = 'Услуга', bool $isActive = true): Service
{
    $service = Service::create(['slug' => $slug, 'is_active' => $isActive, 'sort_order' => 0]);
    $service->translations()->create(['locale' => 'ru', 'title' => $title]);

    return $service;
}

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

test('services index lists titles and counts by status', function () {
    serviceWithTitle('one', 'Геологическая съёмка');
    serviceWithTitle('two', 'Бурение', isActive: false);

    $this->get(route('admin.services.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->has('services.data', 2)
            ->where('services.data.0.title', 'Геологическая съёмка')
            ->where('services.data.0.locales', ['ru'])
            ->where('counts.all', 2)
            ->where('counts.active', 1)
            ->where('counts.inactive', 1)
            ->where('filters.status', null));
});

test('services index filters by status and searches titles', function () {
    serviceWithTitle('one', 'Геологическая съёмка');
    serviceWithTitle('two', 'Бурение', isActive: false);

    $this->get(route('admin.services.index', ['status' => 'inactive']))
        ->assertInertia(fn ($page) => $page
            ->has('services.data', 1)
            ->where('services.data.0.slug', 'two')
            ->where('filters.status', 'inactive'));

    $this->get(route('admin.services.index', ['search' => 'съёмка']))
        ->assertInertia(fn ($page) => $page
            ->has('services.data', 1)
            ->where('services.data.0.slug', 'one'));
});

test('services index shows a title from another language when the Russian one is missing', function () {
    Locale::firstOrCreate(['code' => 'tj'], ['name' => 'Тоҷикӣ', 'is_active' => true, 'sort_order' => 0]);
    $service = Service::create(['slug' => 'tj-only', 'is_active' => true, 'sort_order' => 0]);
    $service->translations()->create(['locale' => 'tj', 'title' => 'Хизматрасонӣ']);

    $this->get(route('admin.services.index'))
        ->assertInertia(fn ($page) => $page->where('services.data.0.title', 'Хизматрасонӣ'));
});

test('authenticated user can view create service form', function () {
    $this->get(route('admin.services.create'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Services/Create')
            ->has('locales')
        );
});

test('authenticated user can store a service and lands on its edit screen', function () {
    $response = $this->post(route('admin.services.store'), [
        'is_active' => true,
        'sort_order' => 1,
        'translations' => [
            'ru' => [
                'title' => 'Новая услуга',
                'description' => 'Описание',
                'content' => 'Содержание',
            ],
        ],
    ]);

    $service = Service::firstWhere('slug', 'novaia-usluga');

    expect($service)->not->toBeNull();
    $response->assertRedirect(route('admin.services.edit', $service))
        ->assertSessionHas('success', 'Услуга добавлена.');
    $this->assertDatabaseHas('service_translations', ['title' => 'Новая услуга', 'locale' => 'ru']);
});

test('store service validates required fields', function () {
    $this->post(route('admin.services.store'), [])
        ->assertSessionHasErrors(['translations']);
});

test('store service needs a title in at least one language', function () {
    $this->post(route('admin.services.store'), [
        'translations' => ['ru' => ['title' => '']],
    ])->assertSessionHasErrors([
        'translations' => 'Укажите название услуги хотя бы на одном языке.',
    ]);

    expect(Service::count())->toBe(0);
});

test('a service with the same title as another gets a numbered slug instead of failing', function () {
    $this->post(route('admin.services.store'), [
        'translations' => ['ru' => ['title' => 'Бурение скважин']],
    ])->assertRedirect();

    $this->post(route('admin.services.store'), [
        'translations' => ['ru' => ['title' => 'Бурение скважин']],
    ])->assertRedirect();

    expect(Service::pluck('slug')->sort()->values()->all())
        ->toBe(['burenie-skvazin', 'burenie-skvazin-2']);
});

test('the slug of a deleted service is not reused', function () {
    serviceWithTitle('burenie', 'Бурение')->delete();

    $this->post(route('admin.services.store'), [
        'translations' => ['ru' => ['title' => 'Бурение']],
    ])->assertRedirect();

    expect(Service::query()->value('slug'))->toBe('burenie-2');
});

test('a typed slug is used, normalised and made unique', function () {
    serviceWithTitle('drilling');

    $this->post(route('admin.services.store'), [
        'slug' => 'Drilling',
        'translations' => ['ru' => ['title' => 'Бурение']],
    ])->assertRedirect();

    $this->assertDatabaseHas('services', ['slug' => 'drilling-2']);
});

test('tajik titles keep their letters in the slug', function () {
    Locale::firstOrCreate(['code' => 'tj'], ['name' => 'Тоҷикӣ', 'is_active' => true, 'sort_order' => 0]);

    $this->post(route('admin.services.store'), [
        'translations' => ['tj' => ['title' => 'Ҳамкорӣ бо ҷомеа']],
    ])->assertRedirect();

    $this->assertDatabaseHas('services', ['slug' => 'hamkori-bo-jomea']);
});

test('a slug without letters or digits is refused', function () {
    $this->post(route('admin.services.store'), [
        'slug' => '!!!',
        'translations' => ['ru' => ['title' => 'Бурение']],
    ])->assertSessionHasErrors('slug');
});

test('authenticated user can update a service and its slug stays the same', function () {
    $service = serviceWithTitle('old-service', 'Старая услуга');

    $this->put(route('admin.services.update', $service), [
        'is_active' => false,
        'sort_order' => 5,
        'translations' => [
            'ru' => [
                'title' => 'Обновлённая услуга',
            ],
        ],
    ])->assertRedirect(route('admin.services.edit', $service))
        ->assertSessionHas('success', 'Услуга обновлена.');

    $service->refresh();
    expect($service->slug)->toBe('old-service');
    expect($service->is_active)->toBeFalse();
    expect($service->sort_order)->toBe(5);
    expect($service->translations()->where('locale', 'ru')->value('title'))->toBe('Обновлённая услуга');
});

test('updating a service with a new slug changes it, unique among the other services', function () {
    serviceWithTitle('taken', 'Другая');
    $service = serviceWithTitle('old-service');

    $this->put(route('admin.services.update', $service), [
        'slug' => 'taken',
        'translations' => ['ru' => ['title' => 'Услуга']],
    ])->assertRedirect();

    expect($service->fresh()->slug)->toBe('taken-2');

    $this->put(route('admin.services.update', $service), [
        'slug' => 'taken-2',
        'translations' => ['ru' => ['title' => 'Услуга']],
    ])->assertRedirect();

    expect($service->fresh()->slug)->toBe('taken-2');
});

test('saving a service keeps the texts of languages the form does not send', function () {
    Locale::firstOrCreate(['code' => 'en'], ['name' => 'English', 'is_active' => false, 'sort_order' => 3]);
    $service = serviceWithTitle('svc', 'Услуга');
    $service->translations()->create(['locale' => 'en', 'title' => 'Service']);

    $this->put(route('admin.services.update', $service), [
        'translations' => ['ru' => ['title' => 'Услуга 2']],
    ])->assertRedirect();

    expect($service->translations()->orderBy('locale')->pluck('title', 'locale')->all())
        ->toBe(['en' => 'Service', 'ru' => 'Услуга 2']);
});

test('a language sent with an empty title is removed', function () {
    Locale::firstOrCreate(['code' => 'en'], ['name' => 'English', 'is_active' => true, 'sort_order' => 3]);
    $service = serviceWithTitle('svc', 'Услуга');
    $service->translations()->create(['locale' => 'en', 'title' => 'Service']);

    $this->put(route('admin.services.update', $service), [
        'translations' => [
            'ru' => ['title' => 'Услуга'],
            'en' => ['title' => '', 'description' => '', 'content' => '<p></p>'],
        ],
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($service->translations()->pluck('locale')->all())->toBe(['ru']);
});

test('a language with text but no title is refused instead of silently dropped', function () {
    Locale::firstOrCreate(['code' => 'en'], ['name' => 'English', 'is_active' => true, 'sort_order' => 3]);
    $service = serviceWithTitle('svc', 'Услуга');

    $this->put(route('admin.services.update', $service), [
        'translations' => [
            'ru' => ['title' => 'Услуга'],
            'en' => ['title' => '', 'content' => '<p>Drilling</p>'],
        ],
    ])->assertSessionHasErrors('translations.en.title');
});

test('unknown languages are refused', function () {
    $this->post(route('admin.services.store'), [
        'translations' => ['xx' => ['title' => 'Услуга']],
    ])->assertSessionHasErrors('translations');

    expect(Service::count())->toBe(0);
});

test('meta description is limited to the column size', function () {
    $this->post(route('admin.services.store'), [
        'translations' => ['ru' => ['title' => 'Услуга', 'meta_description' => str_repeat('а', 256)]],
    ])->assertSessionHasErrors('translations.ru.meta_description');

    $this->post(route('admin.services.store'), [
        'translations' => ['ru' => ['title' => 'Услуга', 'meta_description' => str_repeat('а', 255)]],
    ])->assertSessionHasNoErrors();
});

test('a failed translation write leaves no half-created service behind', function () {
    ServiceTranslation::creating(function (): void {
        throw new RuntimeException('disk full');
    });

    $this->withoutExceptionHandling();

    expect(fn () => $this->post(route('admin.services.store'), [
        'translations' => ['ru' => ['title' => 'Услуга']],
    ]))->toThrow(RuntimeException::class, 'disk full');

    expect(Service::withTrashed()->count())->toBe(0);
});

test('authenticated user can delete a service', function () {
    $service = serviceWithTitle('delete-me');

    $this->delete(route('admin.services.destroy', $service))
        ->assertRedirect(route('admin.services.index'))
        ->assertSessionHas('success', 'Услуга удалена.');

    $this->assertSoftDeleted('services', ['id' => $service->id]);
});

test('bulk actions show, hide and delete ticked services', function () {
    $first = serviceWithTitle('first', isActive: false);
    $second = serviceWithTitle('second', isActive: false);
    $untouched = serviceWithTitle('untouched', isActive: false);

    $this->post(route('admin.services.bulk'), [
        'action' => 'activate',
        'ids' => [$first->id, $second->id],
    ])->assertRedirect()
        ->assertSessionHas('success', '2 услуги теперь показываются на сайте.');

    expect($first->fresh()->is_active)->toBeTrue()
        ->and($second->fresh()->is_active)->toBeTrue()
        ->and($untouched->fresh()->is_active)->toBeFalse();

    $this->post(route('admin.services.bulk'), [
        'action' => 'deactivate',
        'ids' => [$first->id],
    ])->assertSessionHas('success', '1 услуга скрыта с сайта.');

    expect($first->fresh()->is_active)->toBeFalse();

    $this->post(route('admin.services.bulk'), [
        'action' => 'delete',
        'ids' => [$first->id, $second->id, $untouched->id],
    ])->assertSessionHas('success', '3 услуги удалены.');

    expect(Service::count())->toBe(0)
        ->and(Service::withTrashed()->count())->toBe(3);
});

test('bulk service actions are validated and need permissions', function () {
    $service = serviceWithTitle('svc');

    $this->post(route('admin.services.bulk'), ['action' => 'archive', 'ids' => []])
        ->assertSessionHasErrors(['action', 'ids']);

    $this->actingAs(userWithRole('moderator'));

    $this->post(route('admin.services.bulk'), ['action' => 'delete', 'ids' => [$service->id]])
        ->assertForbidden();

    expect($service->fresh())->not->toBeNull();
});
