<?php

use App\Models\Category;
use App\Models\Locale;
use App\Models\Post;
use App\Models\User;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'tj'], ['name' => 'Тоҷикӣ', 'is_active' => true, 'sort_order' => 1]);
    Locale::firstOrCreate(['code' => 'ru'], ['name' => 'Русский', 'is_active' => true, 'sort_order' => 2]);
});

function listPost(User $author, string $slug, array $attributes = [], ?string $title = null): Post
{
    $post = new Post;
    $post->forceFill([
        'slug' => $slug,
        'status' => 'draft',
        'author_id' => $author->id,
        ...$attributes,
    ])->save();

    if ($title !== null) {
        $post->translations()->create(['locale' => 'ru', 'title' => $title, 'content' => '<p>x</p>']);
    }

    return $post;
}

test('views count posts per state and list only existing views', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    listPost($admin, 'live', ['status' => 'published', 'published_at' => now()->subDay()]);
    listPost($admin, 'future', ['status' => 'published', 'published_at' => now()->addDay()]);
    listPost($admin, 'draft');
    listPost($admin, 'trashed')->delete();

    $this->get(route('admin.posts.index'))
        ->assertInertia(fn ($page) => $page
            ->where('views', [
                ['key' => 'all', 'label' => 'Все', 'count' => 3],
                ['key' => 'mine', 'label' => 'Мои', 'count' => 3],
                ['key' => 'published', 'label' => 'Опубликованные', 'count' => 1],
                ['key' => 'scheduled', 'label' => 'Запланированные', 'count' => 1],
                ['key' => 'draft', 'label' => 'Черновики', 'count' => 1],
                ['key' => 'trash', 'label' => 'Корзина', 'count' => 1],
            ])
            ->has('posts.data', 3));
});

test('the trash view lists only trashed posts', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    listPost($admin, 'kept');
    listPost($admin, 'gone')->delete();

    $this->get(route('admin.posts.index', ['status' => 'trash']))
        ->assertInertia(fn ($page) => $page
            ->has('posts.data', 1)
            ->where('posts.data.0.slug', 'gone')
            ->where('posts.data.0.can.restore', true)
            ->where('filters.status', 'trash'));
});

test('the list shows the title in another language when russian is missing', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);

    $post = listPost($admin, 'tj-only');
    $post->translations()->create(['locale' => 'tj', 'title' => 'Танҳо тоҷикӣ', 'content' => '<p>x</p>']);

    $this->get(route('admin.posts.index'))
        ->assertInertia(fn ($page) => $page
            ->where('posts.data.0.title', 'Танҳо тоҷикӣ')
            ->where('posts.data.0.title_locale', 'tj')
            ->where('posts.data.0.locales', ['tj']));
});

test('the list filters by category and month and sorts by title', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);
    $category = Category::create(['slug' => 'field', 'sort_order' => 1]);

    listPost($admin, 'b', ['created_at' => '2026-03-10 10:00:00'], 'Бета')->categories()->attach($category);
    listPost($admin, 'a', ['created_at' => '2026-03-11 10:00:00'], 'Альфа')->categories()->attach($category);
    listPost($admin, 'c', ['created_at' => '2026-04-01 10:00:00'], 'Гамма');

    $this->get(route('admin.posts.index', ['category' => $category->id, 'month' => '2026-03', 'orderby' => 'title', 'order' => 'asc']))
        ->assertInertia(fn ($page) => $page
            ->has('posts.data', 2)
            ->where('posts.data.0.slug', 'a')
            ->where('posts.data.1.slug', 'b')
            ->where('months.0.value', '2026-04')
            ->where('months.1.label', 'Март 2026'));
});

test('trashing, restoring and deleting a post for good', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);
    $post = listPost($admin, 'cycle', [], 'Цикл');

    $this->delete(route('admin.posts.destroy', $post))
        ->assertRedirect(route('admin.posts.index'))
        ->assertSessionHas('success', 'Запись перемещена в корзину.');
    $this->assertSoftDeleted($post);

    $this->patch(route('admin.posts.restore', $post))
        ->assertSessionHas('success', 'Запись восстановлена из корзины.');
    expect($post->fresh()->trashed())->toBeFalse();

    // Only a trashed post can be deleted for good.
    $this->delete(route('admin.posts.force-delete', $post))->assertNotFound();

    $post->delete();
    $this->delete(route('admin.posts.force-delete', $post))
        ->assertSessionHas('success', 'Запись удалена навсегда.');
    expect(Post::withTrashed()->find($post->id))->toBeNull();
    $this->assertDatabaseMissing('post_translations', ['post_id' => $post->id]);
});

test('emptying the trash removes only what the user may delete', function () {
    $author = userWithRole('author');
    $other = userWithRole('author');
    $this->actingAs($author);

    listPost($author, 'mine')->delete();
    listPost($other, 'theirs')->delete();

    $this->delete(route('admin.posts.trash.empty'))
        ->assertRedirect(route('admin.posts.index', ['status' => 'trash']));

    expect(Post::onlyTrashed()->pluck('slug')->all())->toBe(['theirs']);
});

test('bulk actions apply per post and skip what is not allowed', function () {
    $author = userWithRole('author');
    $other = userWithRole('author');
    $this->actingAs($author);

    $mine = listPost($author, 'mine');
    $theirs = listPost($other, 'theirs');

    $this->from(route('admin.posts.index'))
        ->post(route('admin.posts.bulk'), ['action' => 'trash', 'ids' => [$mine->id, $theirs->id]])
        ->assertRedirect(route('admin.posts.index'))
        ->assertSessionHas('success', 'В корзину перемещено: 1 запись. Пропущено: 1 (нет прав или неподходящий статус).');

    expect($mine->fresh()->trashed())->toBeTrue()
        ->and($theirs->fresh()->trashed())->toBeFalse();
});

test('bulk publish needs the publish permission', function () {
    $author = userWithRole('author');
    $this->actingAs($author);
    $draft = listPost($author, 'draft');

    $this->post(route('admin.posts.bulk'), ['action' => 'publish', 'ids' => [$draft->id]])
        ->assertSessionHas('error');
    expect($draft->fresh()->status)->toBe('draft');

    $this->actingAs(userWithRole('editor'));
    $this->post(route('admin.posts.bulk'), ['action' => 'publish', 'ids' => [$draft->id]])
        ->assertSessionHas('success', 'Опубликовано: 1 запись.');

    $draft->refresh();
    expect($draft->status)->toBe('published')
        ->and($draft->published_at)->not->toBeNull();
});

test('bulk restore and permanent delete work on trashed posts', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);
    $a = listPost($admin, 'a');
    $b = listPost($admin, 'b');
    $a->delete();
    $b->delete();

    $this->post(route('admin.posts.bulk'), ['action' => 'restore', 'ids' => [$a->id]])
        ->assertSessionHas('success', 'Восстановлено из корзины: 1 запись.');
    $this->post(route('admin.posts.bulk'), ['action' => 'delete', 'ids' => [$a->id, $b->id]])
        ->assertSessionHas('success', 'Удалено навсегда: 1 запись. Пропущено: 1 (нет прав или неподходящий статус).');

    expect(Post::withTrashed()->pluck('slug')->all())->toBe(['a']);
});

test('bulk actions validate their input', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.posts.bulk'), ['action' => 'explode', 'ids' => []])
        ->assertSessionHasErrors(['action', 'ids']);
});

test('quick edit changes the title of the listed language and the settings', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);
    $category = Category::create(['slug' => 'field', 'sort_order' => 1]);
    $post = listPost($admin, 'quick', [], 'Старый заголовок');
    $post->translations()->create(['locale' => 'tj', 'title' => 'Сарлавҳа', 'content' => '<p>tj</p>']);

    $this->from(route('admin.posts.index'))
        ->patch(route('admin.posts.quick-update', $post), [
            'title' => 'Новый заголовок',
            'locale' => 'ru',
            'slug' => 'Novyi Adres',
            'status' => 'published',
            'published_at' => '2026-09-01T10:00:00+05:00',
            'is_featured' => true,
            'categories' => [$category->id],
            'tags' => [],
        ])
        ->assertRedirect(route('admin.posts.index'))
        ->assertSessionHas('success', 'Запись обновлена.');

    $post->refresh();
    expect($post->slug)->toBe('novyi-adres')
        ->and($post->status)->toBe('published')
        ->and($post->is_featured)->toBeTrue()
        ->and($post->published_at->utc()->format('Y-m-d H:i'))->toBe('2026-09-01 05:00')
        ->and($post->categories->pluck('id')->all())->toBe([$category->id])
        ->and($post->translations()->pluck('title', 'locale')->all())
        ->toMatchArray(['ru' => 'Новый заголовок', 'tj' => 'Сарлавҳа']);
});

test('quick edit keeps publishing decisions to publishers', function () {
    $author = userWithRole('author');
    $this->actingAs($author);
    $post = listPost($author, 'mine', [], 'Мой черновик');

    $this->patch(route('admin.posts.quick-update', $post), [
        'title' => 'Мой черновик',
        'locale' => 'ru',
        'status' => 'published',
    ])->assertSessionHasErrors('status');

    $this->patch(route('admin.posts.quick-update', $post), [
        'title' => 'Мой черновик',
        'locale' => 'ru',
        'status' => 'pending',
        'is_featured' => true,
        'published_at' => '2030-01-01T00:00:00+00:00',
    ])->assertSessionHasNoErrors();

    $post->refresh();
    expect($post->status)->toBe('pending')
        ->and($post->is_featured)->toBeFalse()
        ->and($post->published_at)->toBeNull();

    $theirs = listPost(userWithRole('author'), 'theirs', [], 'Чужой');
    $this->patch(route('admin.posts.quick-update', $theirs), [
        'title' => 'x',
        'locale' => 'ru',
        'status' => 'draft',
    ])->assertForbidden();
});

test('bulk messages use russian plural forms', function () {
    $admin = userWithRole('admin');
    $this->actingAs($admin);
    $ids = collect(range(1, 5))->map(fn (int $i) => listPost($admin, "p-{$i}")->id)->all();

    $this->post(route('admin.posts.bulk'), ['action' => 'trash', 'ids' => array_slice($ids, 0, 2)])
        ->assertSessionHas('success', 'В корзину перемещено: 2 записи.');

    $this->post(route('admin.posts.bulk'), ['action' => 'publish', 'ids' => $ids])
        ->assertSessionHas('success', 'Опубликовано: 3 записи. Пропущено: 2 (нет прав или неподходящий статус).');

    $this->post(route('admin.posts.bulk'), ['action' => 'draft', 'ids' => $ids])
        ->assertSessionHas('success', 'Переведено в черновики: 3 записи. Пропущено: 2 (нет прав или неподходящий статус).');

    $this->post(route('admin.posts.bulk'), ['action' => 'trash', 'ids' => $ids])
        ->assertSessionHas('success', 'В корзину перемещено: 3 записи. Пропущено: 2 (нет прав или неподходящий статус).');

    $this->post(route('admin.posts.bulk'), ['action' => 'delete', 'ids' => $ids])
        ->assertSessionHas('success', 'Удалено навсегда: 5 записей.');
});
