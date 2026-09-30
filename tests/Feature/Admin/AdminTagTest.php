<?php

use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use Database\Seeders\LocaleSeeder;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function () {
    $this->seed(LocaleSeeder::class);
});

/**
 * @param  array<string, string>  $names
 */
function tagWithNames(string $slug, array $names): Tag
{
    $tag = Tag::create(['slug' => $slug]);

    foreach ($names as $locale => $name) {
        $tag->translations()->create(['locale' => $locale, 'name' => $name]);
    }

    return $tag;
}

/**
 * @param  array<string, string>  $names
 * @return array<string, mixed>
 */
function tagPayload(array $names, array $overrides = []): array
{
    return [
        'slug' => '',
        'translations' => [
            'tj' => ['name' => $names['tj'] ?? ''],
            'ru' => ['name' => $names['ru'] ?? ''],
            'en' => ['name' => $names['en'] ?? ''],
        ],
        ...$overrides,
    ];
}

/**
 * A user whose only role grants exactly these permissions.
 *
 * @param  list<string>  $permissions
 */
function userWithTagPermissions(array $permissions): User
{
    userWithRole('admin');

    $role = 'tag-test-role';
    Role::findOrCreate($role, 'web')->syncPermissions($permissions);
    app(PermissionRegistrar::class)->forgetCachedPermissions();

    $user = User::factory()->create(['email_verified_at' => now()]);
    $user->assignRole($role);

    return $user;
}

test('the tags screen lists tags by name with the number of posts', function () {
    $user = userWithRole('editor');
    $lava = tagWithNames('lava', ['ru' => 'Лава']);
    $field = tagWithNames('fieldwork', ['en' => 'Fieldwork']);

    $post = Post::create(['slug' => 'trip', 'status' => 'published', 'published_at' => now(), 'author_id' => $user->id]);
    $lava->posts()->attach($post);

    $this->actingAs($user)
        ->get(route('admin.tags.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Tags/Index')
            ->has('tags.data', 2)
            ->where('tags.data.0.id', $field->id)
            ->where('tags.data.0.name', 'Fieldwork')
            ->where('tags.data.0.name_locale', 'en')
            ->where('tags.data.0.view_url', route('news.index', ['locale' => 'en', 'tag' => 'fieldwork']))
            ->where('tags.data.1.name', 'Лава')
            ->where('tags.data.1.posts_count', 1)
            ->where('tags.data.1.view_url', route('news.index', ['locale' => 'ru', 'tag' => 'lava']))
            ->where('tags.data.1.can.delete', true)
            ->missing('tags.data.1.description')
            ->where('filters.orderby', 'name')
            ->where('filters.order', 'asc')
            ->where('can.create', true)
            ->has('locales', 3));
});

test('the tags list can be searched and sorted by the number of posts', function () {
    $user = userWithRole('editor');
    $this->actingAs($user);
    tagWithNames('lava', ['ru' => 'Лава']);
    $basalt = tagWithNames('basalt', ['ru' => 'Базальт']);

    $post = Post::create(['slug' => 'p', 'status' => 'draft', 'author_id' => $user->id]);
    $basalt->posts()->attach($post);

    $this->get(route('admin.tags.index', ['search' => 'ава']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('tags.data', 1)
            ->where('tags.data.0.slug', 'lava'));

    $this->get(route('admin.tags.index', ['orderby' => 'count', 'order' => 'desc']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('tags.data.0.id', $basalt->id)
            ->where('filters.orderby', 'count'));
});

test('the add tag screen is the list itself', function () {
    $this->actingAs(userWithRole('editor'))
        ->get(route('admin.tags.create'))
        ->assertRedirect(route('admin.tags.index'));

    $this->actingAs(userWithRole('author'))
        ->get(route('admin.tags.create'))
        ->assertForbidden();
});

test('a tag can be added with a name in one language and gets a slug from it', function () {
    $this->actingAs(userWithRole('editor'));
    tagWithNames('vulkan', ['tj' => 'Вулқон'])->delete();

    $this->from(route('admin.tags.index'))
        ->post(route('admin.tags.store'), tagPayload(['ru' => 'Вулкан']))
        ->assertRedirect(route('admin.tags.index'))
        ->assertSessionHas('success', 'Метка «Вулкан» добавлена.');

    $tag = Tag::where('slug', 'vulkan-2')->firstOrFail();

    expect($tag->translations)->toHaveCount(1)
        ->and($tag->translations->first()->only(['locale', 'name']))->toBe(['locale' => 'ru', 'name' => 'Вулкан']);
});

test('adding a tag validates its fields in Russian', function (array $payload, string $field, string $message) {
    $this->actingAs(userWithRole('editor'));
    tagWithNames('lava', ['ru' => 'Лава']);

    $this->post(route('admin.tags.store'), $payload)
        ->assertSessionHasErrors([$field => $message]);

    expect(Tag::count())->toBe(1);
})->with([
    'no name at all' => [tagPayload([]), 'translations', 'Укажите название хотя бы на одном языке.'],
    'duplicate name' => [tagPayload(['ru' => 'Лава']), 'translations.ru.name', 'Метка с таким названием уже существует.'],
    'too long name' => [tagPayload(['en' => str_repeat('a', 256)]), 'translations.en.name', 'Название должно быть не длиннее 255 символов.'],
]);

test('a tag ignores descriptions and display order', function () {
    $this->actingAs(userWithRole('editor'));

    $this->post(route('admin.tags.store'), [
        ...tagPayload(['ru' => 'Лава']),
        'translations' => ['ru' => ['name' => 'Лава', 'description' => 'Нет такого поля']],
        'sort_order' => 5,
    ])->assertSessionHasNoErrors();

    expect(Tag::where('slug', 'lava')->firstOrFail()->translations->first()->name)->toBe('Лава');
});

test('the tag edit screen shows every language of the tag', function () {
    $tag = tagWithNames('lava', ['tj' => 'Гудоза', 'ru' => 'Лава']);

    $this->actingAs(userWithRole('editor'))
        ->get(route('admin.tags.edit', $tag))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Tags/Edit')
            ->where('tag.id', $tag->id)
            ->where('tag.slug', 'lava')
            ->where('tag.name', 'Лава')
            ->where('tag.translations.tj.name', 'Гудоза')
            ->where('tag.translations.ru.name', 'Лава')
            ->where('tag.posts_count', 0)
            ->where('can.delete', true));
});

test('updating a tag keeps its slug unless edited and removes a cleared language', function () {
    $this->actingAs(userWithRole('editor'));
    $tag = tagWithNames('lava', ['ru' => 'Лава', 'en' => 'Lava']);
    tagWithNames('magma', ['ru' => 'Магма']);

    $this->put(route('admin.tags.update', $tag), tagPayload(['ru' => 'Горячая лава'], ['slug' => 'lava']))
        ->assertRedirect(route('admin.tags.edit', $tag))
        ->assertSessionHas('success', 'Метка «Горячая лава» обновлена.');

    $tag->refresh()->load('translations');

    expect($tag->slug)->toBe('lava')
        ->and($tag->translations->pluck('name', 'locale')->all())->toBe(['ru' => 'Горячая лава']);

    $this->put(route('admin.tags.update', $tag), tagPayload(['ru' => 'Горячая лава'], ['slug' => 'Magma']))
        ->assertSessionHasNoErrors();

    expect($tag->refresh()->slug)->toBe('magma-2');
});

test('deleting a tag soft-deletes it and returns to the list', function () {
    $this->actingAs(userWithRole('editor'));
    $tag = tagWithNames('lava', ['ru' => 'Лава']);

    $this->from(route('admin.tags.edit', $tag))
        ->delete(route('admin.tags.destroy', $tag))
        ->assertRedirect(route('admin.tags.index'))
        ->assertSessionHas('success', 'Метка «Лава» удалена.');

    $this->assertSoftDeleted('tags', ['id' => $tag->id]);
});

test('ticked tags can be deleted in bulk', function () {
    $this->actingAs(userWithRole('editor'));
    $first = tagWithNames('lava', ['ru' => 'Лава']);
    $second = tagWithNames('magma', ['ru' => 'Магма']);
    $list = route('admin.tags.index', ['search' => 'а']);

    $this->from($list)
        ->delete(route('admin.tags.bulk-destroy'), ['ids' => [$first->id, $second->id, 999]])
        ->assertRedirect($list)
        ->assertSessionHas('success', 'Удалено меток: 2. Пропущено: 1 (нет прав на удаление или метка уже удалена).');

    $this->assertSoftDeleted('tags', ['id' => $first->id]);
    $this->assertSoftDeleted('tags', ['id' => $second->id]);
});

test('tags are guarded by the tag permissions', function () {
    $tag = tagWithNames('lava', ['ru' => 'Лава']);
    $this->actingAs(userWithTagPermissions(['admin-panel.access', 'tags.viewAny']));

    $this->get(route('admin.tags.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('can.create', false)
            ->where('tags.data.0.can.update', false)
            ->where('tags.data.0.can.delete', false));

    $this->post(route('admin.tags.store'), tagPayload(['ru' => 'Магма']))->assertForbidden();
    $this->get(route('admin.tags.edit', $tag))->assertForbidden();
    $this->put(route('admin.tags.update', $tag), tagPayload(['ru' => 'X']))->assertForbidden();
    $this->delete(route('admin.tags.destroy', $tag))->assertForbidden();

    $this->delete(route('admin.tags.bulk-destroy'), ['ids' => [$tag->id]])
        ->assertSessionHas('error', 'Удалено меток: 0. Пропущено: 1 (нет прав на удаление или метка уже удалена).');

    $this->assertNotSoftDeleted('tags', ['id' => $tag->id]);

    $this->actingAs(userWithRole('author'))
        ->get(route('admin.tags.index'))
        ->assertForbidden();
});
