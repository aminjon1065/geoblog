<?php

use App\Models\Category;
use App\Models\Post;
use App\Models\User;
use Database\Seeders\LocaleSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    $this->seed(LocaleSeeder::class);
});

/**
 * @param  array<string, string|array{name: string, description?: string|null}>  $translations
 */
function categoryWithNames(string $slug, array $translations, int $sortOrder = 0): Category
{
    $category = Category::create(['slug' => $slug, 'sort_order' => $sortOrder]);

    foreach ($translations as $locale => $fields) {
        $category->translations()->create([
            'locale' => $locale,
            ...(is_string($fields) ? ['name' => $fields] : $fields),
        ]);
    }

    return $category;
}

/**
 * @param  array<string, array<string, string|null>>  $translations
 * @return array<string, mixed>
 */
function categoryPayload(array $translations, array $overrides = []): array
{
    $empty = ['name' => '', 'description' => ''];

    return [
        'slug' => '',
        'sort_order' => '',
        'translations' => [
            'tj' => $translations['tj'] ?? $empty,
            'ru' => $translations['ru'] ?? $empty,
            'en' => $translations['en'] ?? $empty,
        ],
        ...$overrides,
    ];
}

/**
 * A user whose only role grants exactly these permissions.
 *
 * @param  list<string>  $permissions
 */
function userWithCategoryPermissions(array $permissions): User
{
    userWithRole('admin');

    $role = 'category-test-role';
    Role::findOrCreate($role, 'web')->syncPermissions($permissions);
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole($role);

    return $user;
}

test('the categories screen lists categories with the name in the admin language or a fallback', function () {
    $user = userWithRole('editor');
    $volcanoes = categoryWithNames('volcanoes', ['ru' => ['name' => 'Вулканы', 'description' => 'Про вулканы'], 'en' => 'Volcanoes'], 2);
    $astronomy = categoryWithNames('astronomy', ['tj' => 'Астрономия'], 1);

    $post = Post::create(['slug' => 'eruption', 'status' => 'published', 'published_at' => now(), 'author_id' => $user->id]);
    $trashed = Post::create(['slug' => 'old-eruption', 'status' => 'draft', 'author_id' => $user->id]);
    $volcanoes->posts()->attach([$post->id, $trashed->id]);
    $trashed->delete();

    $this->actingAs($user)
        ->get(route('admin.categories.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Categories/Index')
            ->has('categories.data', 2)
            ->where('categories.total', 2)
            ->where('categories.data.0.id', $astronomy->id)
            ->where('categories.data.0.name', 'Астрономия')
            ->where('categories.data.0.name_locale', 'tj')
            ->where('categories.data.0.view_url', route('news.index', ['locale' => 'tj', 'category' => 'astronomy']))
            ->where('categories.data.1.name', 'Вулканы')
            ->where('categories.data.1.name_locale', 'ru')
            ->where('categories.data.1.description', 'Про вулканы')
            ->where('categories.data.1.posts_count', 1)
            ->where('categories.data.1.view_url', route('news.index', ['locale' => 'ru', 'category' => 'volcanoes']))
            ->where('categories.data.1.can.update', true)
            ->where('categories.data.1.can.delete', true)
            ->where('filters.orderby', 'sort_order')
            ->where('filters.order', 'asc')
            ->where('can.create', true)
            ->where('can.view_posts', true)
            ->has('locales', 3)
            ->where('locales.0.code', 'tj'));
});

test('the categories list can be searched by name in any language or by slug', function () {
    $this->actingAs(userWithRole('editor'));
    categoryWithNames('volcanoes', ['ru' => 'Вулканы']);
    categoryWithNames('glaciers', ['en' => 'Glaciers']);
    categoryWithNames('deserts', ['tj' => 'Биёбонҳо']);

    $this->get(route('admin.categories.index', ['search' => 'улкан']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('categories.data', 1)
            ->where('categories.data.0.slug', 'volcanoes')
            ->where('filters.search', 'улкан'));

    $this->get(route('admin.categories.index', ['search' => 'glac']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('categories.data', 1)
            ->where('categories.data.0.slug', 'glaciers'));

    $this->get(route('admin.categories.index', ['search' => 'desert']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('categories.data', 1)
            ->where('categories.data.0.name', 'Биёбонҳо'));
});

test('the categories list sorts by the shown name and by the number of posts', function () {
    $user = userWithRole('editor');
    $this->actingAs($user);
    $volcanoes = categoryWithNames('volcanoes', ['ru' => 'Вулканы']);
    $astronomy = categoryWithNames('astronomy', ['tj' => 'Астрономия']);
    $biology = categoryWithNames('biology', ['ru' => 'Биология', 'tj' => 'Ҳаёт']);

    $post = Post::create(['slug' => 'p', 'status' => 'draft', 'author_id' => $user->id]);
    $biology->posts()->attach($post);

    $this->get(route('admin.categories.index', ['orderby' => 'name', 'order' => 'asc']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('categories.data.0.id', $astronomy->id)
            ->where('categories.data.1.id', $biology->id)
            ->where('categories.data.2.id', $volcanoes->id)
            ->where('filters.orderby', 'name'));

    $this->get(route('admin.categories.index', ['orderby' => 'count', 'order' => 'desc']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('categories.data.0.id', $biology->id)
            ->where('categories.data.0.posts_count', 1));
});

test('the categories list is paginated by twenty and never shows an empty page', function () {
    $this->actingAs(userWithRole('editor'));

    foreach (range(1, 21) as $number) {
        categoryWithNames("category-{$number}", ['ru' => "Рубрика {$number}"], $number);
    }

    $this->get(route('admin.categories.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('categories.data', 20)
            ->where('categories.total', 21)
            ->where('categories.last_page', 2));

    $this->get(route('admin.categories.index', ['page' => 5, 'search' => 'Рубрика']))
        ->assertRedirect(route('admin.categories.index', ['search' => 'Рубрика', 'page' => 2]));
});

test('the add screen is the list itself', function () {
    $this->actingAs(userWithRole('editor'))
        ->get(route('admin.categories.create'))
        ->assertRedirect(route('admin.categories.index'));

    $this->actingAs(userWithRole('moderator'))
        ->get(route('admin.categories.create'))
        ->assertForbidden();
});

test('a category can be added with a name in one language only', function () {
    $this->actingAs(userWithRole('editor'));
    categoryWithNames('existing', ['ru' => 'Существующая'], 7);

    $this->from(route('admin.categories.index'))
        ->post(route('admin.categories.store'), categoryPayload([
            'ru' => ['name' => 'Новости науки', 'description' => 'Всё о науке'],
        ]))
        ->assertRedirect(route('admin.categories.index'))
        ->assertSessionHas('success', 'Рубрика «Новости науки» добавлена.');

    $category = Category::where('slug', 'novosti-nauki')->firstOrFail();

    expect($category->sort_order)->toBe(8)
        ->and($category->translations)->toHaveCount(1)
        ->and($category->translations->first()->only(['locale', 'name', 'description']))
        ->toBe(['locale' => 'ru', 'name' => 'Новости науки', 'description' => 'Всё о науке']);
});

test('a new slug is made from the first name in the site language order', function () {
    $this->actingAs(userWithRole('editor'));

    $this->post(route('admin.categories.store'), categoryPayload([
        'tj' => ['name' => 'Ҳамкорӣ бо ҷомеа', 'description' => ''],
        'ru' => ['name' => 'Сотрудничество', 'description' => ''],
    ]))->assertSessionHasNoErrors();

    expect(Category::where('slug', 'hamkori-bo-jomea')->exists())->toBeTrue();
});

test('a typed slug is made URL-safe and unique, counting deleted categories', function () {
    $this->actingAs(userWithRole('editor'));
    categoryWithNames('nauka', ['tj' => 'Илм'])->delete();

    $this->post(route('admin.categories.store'), categoryPayload(['ru' => ['name' => 'Наука']]))
        ->assertSessionHasNoErrors();
    $this->post(route('admin.categories.store'), categoryPayload(
        ['ru' => ['name' => 'Другая']],
        ['slug' => 'Моя Рубрика', 'sort_order' => 3],
    ))->assertSessionHasNoErrors();

    expect(Category::where('slug', 'nauka-2')->exists())->toBeTrue()
        ->and(Category::where('slug', 'moia-rubrika')->value('sort_order'))->toBe(3);
});

test('adding a category needs a name in at least one language', function () {
    $this->actingAs(userWithRole('editor'));

    $this->post(route('admin.categories.store'), categoryPayload([]))
        ->assertSessionHasErrors(['translations' => 'Укажите название хотя бы на одном языке.']);

    $this->post(route('admin.categories.store'), ['slug' => 'x'])
        ->assertSessionHasErrors(['translations' => 'Укажите название хотя бы на одном языке.']);

    expect(Category::count())->toBe(0);
});

test('adding a category validates its fields in Russian', function (array $payload, string $field, string $message) {
    $this->actingAs(userWithRole('editor'));
    categoryWithNames('nauka', ['ru' => 'Наука']);

    $this->post(route('admin.categories.store'), $payload)
        ->assertSessionHasErrors([$field => $message]);

    expect(Category::count())->toBe(1);
})->with([
    'duplicate name' => [
        categoryPayload(['ru' => ['name' => 'Наука']]),
        'translations.ru.name',
        'Рубрика с таким названием уже существует.',
    ],
    'description without a name' => [
        categoryPayload(['tj' => ['name' => 'Илм'], 'ru' => ['name' => '', 'description' => 'Текст']]),
        'translations.ru.name',
        'Укажите название на этом языке — без него описание не сохранится.',
    ],
    'unknown language' => [
        ['translations' => ['xx' => ['name' => 'X']]],
        'translations',
        'Неизвестный язык: xx.',
    ],
    'negative order' => [
        categoryPayload(['ru' => ['name' => 'Химия']], ['sort_order' => -1]),
        'sort_order',
        'Порядок не может быть отрицательным.',
    ],
    'too long name' => [
        categoryPayload(['ru' => ['name' => str_repeat('а', 256)]]),
        'translations.ru.name',
        'Название должно быть не длиннее 255 символов.',
    ],
]);

test('after adding a category the list keeps its page, search and sort', function () {
    $this->actingAs(userWithRole('editor'));
    $list = route('admin.categories.index', ['search' => 'Наука', 'orderby' => 'name', 'order' => 'desc']);

    $this->from($list)
        ->post(route('admin.categories.store'), categoryPayload(['ru' => ['name' => 'Наука']]))
        ->assertRedirect($list);
});

test('users without the create permission cannot add categories', function () {
    $this->actingAs(userWithCategoryPermissions(['admin-panel.access', 'categories.viewAny']));

    $this->get(route('admin.categories.index'))
        ->assertInertia(fn (Assert $page) => $page->where('can.create', false));

    $this->post(route('admin.categories.store'), categoryPayload(['ru' => ['name' => 'Наука']]))
        ->assertForbidden();

    expect(Category::count())->toBe(0);
});

test('the edit screen shows every language of the category', function () {
    $category = categoryWithNames('nauka', [
        'tj' => ['name' => 'Илм', 'description' => null],
        'ru' => ['name' => 'Наука', 'description' => 'Про науку'],
    ], 4);

    $this->actingAs(userWithRole('editor'))
        ->get(route('admin.categories.edit', $category))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Categories/Edit')
            ->where('category.id', $category->id)
            ->where('category.slug', 'nauka')
            ->where('category.sort_order', 4)
            ->where('category.name', 'Наука')
            ->where('category.translations.ru.name', 'Наука')
            ->where('category.translations.ru.description', 'Про науку')
            ->where('category.translations.tj.name', 'Илм')
            ->where('category.posts_count', 0)
            ->where('category.view_url', route('news.index', ['locale' => 'ru', 'category' => 'nauka']))
            ->where('can.delete', true)
            ->has('locales', 3));
});

test('updating keeps an untouched slug and removes a cleared language', function () {
    $this->actingAs(userWithRole('editor'));
    $category = categoryWithNames('Old_Slug', ['ru' => 'Наука', 'en' => 'Science'], 5);

    $this->put(route('admin.categories.update', $category), categoryPayload(
        ['tj' => ['name' => 'Илм', 'description' => 'Тавсиф'], 'ru' => ['name' => 'Наука и жизнь']],
        ['slug' => 'Old_Slug'],
    ))
        ->assertRedirect(route('admin.categories.edit', $category))
        ->assertSessionHas('success', 'Рубрика «Наука и жизнь» обновлена.');

    $category->refresh()->load('translations');

    expect($category->slug)->toBe('Old_Slug')
        ->and($category->sort_order)->toBe(5)
        ->and($category->translations->pluck('name', 'locale')->sortKeys()->all())
        ->toBe(['ru' => 'Наука и жизнь', 'tj' => 'Илм'])
        ->and($category->translations->firstWhere('locale', 'tj')->description)->toBe('Тавсиф');
});

test('an edited slug is made URL-safe and unique; an emptied one is made from the name', function () {
    $this->actingAs(userWithRole('editor'));
    categoryWithNames('alpha', ['ru' => 'Альфа']);
    $beta = categoryWithNames('beta', ['ru' => 'Бета']);

    $this->put(route('admin.categories.update', $beta), categoryPayload(
        ['ru' => ['name' => 'Бета']],
        ['slug' => 'Alpha'],
    ))->assertSessionHasNoErrors();

    expect($beta->refresh()->slug)->toBe('alpha-2');

    $this->put(route('admin.categories.update', $beta), categoryPayload(
        ['ru' => ['name' => 'Бета']],
        ['slug' => ''],
    ))->assertSessionHasNoErrors();

    expect($beta->refresh()->slug)->toBe('beta');
});

test('a category keeps its own name when updated', function () {
    $this->actingAs(userWithRole('editor'));
    $category = categoryWithNames('nauka', ['ru' => 'Наука']);

    $this->put(route('admin.categories.update', $category), categoryPayload(['ru' => ['name' => 'Наука']], ['slug' => 'nauka']))
        ->assertSessionHasNoErrors();
});

test('deleting a category from its edit screen returns to the list', function () {
    $this->actingAs(userWithRole('editor'));
    $category = categoryWithNames('nauka', ['ru' => 'Наука']);

    $this->from(route('admin.categories.edit', $category))
        ->delete(route('admin.categories.destroy', $category))
        ->assertRedirect(route('admin.categories.index'))
        ->assertSessionHas('success', 'Рубрика «Наука» удалена.');

    $this->assertSoftDeleted('categories', ['id' => $category->id]);
});

test('deleting a category from the list keeps the list where it was', function () {
    $this->actingAs(userWithRole('editor'));
    $category = categoryWithNames('nauka', ['ru' => 'Наука']);
    $list = route('admin.categories.index', ['page' => 2, 'search' => 'а']);

    $this->from($list)
        ->delete(route('admin.categories.destroy', $category))
        ->assertRedirect($list);
});

test('ticked categories can be deleted in bulk', function () {
    $this->actingAs(userWithRole('editor'));
    $first = categoryWithNames('first', ['ru' => 'Первая']);
    $second = categoryWithNames('second', ['ru' => 'Вторая']);
    $kept = categoryWithNames('kept', ['ru' => 'Оставшаяся']);

    $this->from(route('admin.categories.index'))
        ->delete(route('admin.categories.bulk-destroy'), ['ids' => [$first->id, $second->id]])
        ->assertRedirect(route('admin.categories.index'))
        ->assertSessionHas('success', 'Удалено рубрик: 2.');

    $this->assertSoftDeleted('categories', ['id' => $first->id]);
    $this->assertSoftDeleted('categories', ['id' => $second->id]);
    $this->assertNotSoftDeleted('categories', ['id' => $kept->id]);
});

test('bulk delete skips what the user may not delete', function () {
    $this->actingAs(userWithCategoryPermissions(['admin-panel.access', 'categories.viewAny']));
    $category = categoryWithNames('nauka', ['ru' => 'Наука']);

    $this->delete(route('admin.categories.bulk-destroy'), ['ids' => [$category->id]])
        ->assertSessionHas('error', 'Удалено рубрик: 0. Пропущено: 1 (нет прав на удаление или рубрика уже удалена).');

    $this->assertNotSoftDeleted('categories', ['id' => $category->id]);
});

test('bulk delete needs ticked rows and access to categories', function () {
    $this->actingAs(userWithRole('editor'))
        ->delete(route('admin.categories.bulk-destroy'), ['ids' => []])
        ->assertSessionHasErrors(['ids' => 'Отметьте хотя бы одну рубрику.']);

    $category = categoryWithNames('nauka', ['ru' => 'Наука']);

    $this->actingAs(userWithRole('moderator'))
        ->delete(route('admin.categories.bulk-destroy'), ['ids' => [$category->id]])
        ->assertForbidden();

    $this->assertNotSoftDeleted('categories', ['id' => $category->id]);
});
