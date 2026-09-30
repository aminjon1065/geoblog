<?php

use App\Models\Locale;
use App\Models\Media;
use App\Models\MediaFolder;
use App\Models\Post;
use App\Models\Service;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    // New pages (Admin/Media/Create) are not in the built manifest until the next
    // `npm run build`; the tests exercise the server side only.
    $this->withoutVite();
    Storage::fake('public');
    Locale::firstOrCreate(['code' => 'ru'], ['name' => 'Русский', 'is_active' => true, 'sort_order' => 1]);
    $this->actingAs(userWithRole('admin'));
});

/**
 * A library row with a real file on the fake public disk.
 *
 * @param  array<string, mixed>  $attributes
 */
function createLibraryMedia(array $attributes = [], ?string $createdAt = null): Media
{
    $name = $attributes['name'] ?? 'photo.jpg';
    $isImage = str_starts_with($attributes['mime_type'] ?? 'image/jpeg', 'image/');
    $file = $isImage
        ? UploadedFile::fake()->image($name, 40, 30)
        : UploadedFile::fake()->create($name, 12, $attributes['mime_type']);

    $media = new Media([
        'disk' => 'public',
        'path' => $file->store('media', 'public'),
        'mime_type' => 'image/jpeg',
        'size' => 1234,
        'name' => $name,
        'original_name' => $name,
        ...$attributes,
    ]);

    if ($createdAt !== null) {
        $media->created_at = Carbon::parse($createdAt);
    }

    $media->save();

    return $media;
}

/* ---------------- Медиатека: grid mode ---------------- */

test('the library opens in grid mode with filters, months, folders and upload limits', function () {
    $folder = MediaFolder::create(['name' => 'Полевые работы', 'slug' => 'polevye-raboty']);
    createLibraryMedia(['name' => 'in-folder.jpg', 'folder_id' => $folder->id], '2026-08-10 09:00:00');
    createLibraryMedia(['name' => 'root.jpg'], '2026-09-01 09:00:00');

    $this->get(route('admin.media.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Media/Index')
            ->where('mode', 'grid')
            // "Все папки": files from every folder, newest first.
            ->has('media.data', 2)
            ->where('media.data.0.name', 'root.jpg')
            ->where('media.data.1.name', 'in-folder.jpg')
            ->where('media.meta.total', 2)
            ->where('media.meta.per_page', 40)
            ->where('filters', ['search' => null, 'type' => null, 'month' => null, 'folder' => null])
            ->where('months', [
                ['value' => '2026-09', 'label' => 'Сентябрь 2026'],
                ['value' => '2026-08', 'label' => 'Август 2026'],
            ])
            ->has('folders', 1)
            ->where('folders.0.path', 'Полевые работы')
            ->where('folders.0.files_count', 1)
            ->where('item', null)
            ->where('upload.accept', fn ($accept) => str_contains($accept, 'image/jpeg'))
            ->where('upload.max_bytes', fn ($bytes) => $bytes > 0 && $bytes <= 10 * 1024 * 1024));
});

test('grid filters by type, month, folder and search', function () {
    $folder = MediaFolder::create(['name' => 'Docs', 'slug' => 'docs']);
    createLibraryMedia(['name' => 'granite.jpg'], '2026-07-03 10:00:00');
    createLibraryMedia(['name' => 'report.pdf', 'mime_type' => 'application/pdf', 'folder_id' => $folder->id], '2026-09-05 10:00:00');
    createLibraryMedia(['name' => 'basalt.png', 'mime_type' => 'image/png', 'alt' => 'Базальт'], '2026-09-06 10:00:00');

    $names = fn (array $query): array => collect(
        $this->get(route('admin.media.index', $query))->assertOk()->inertiaProps('media.data'),
    )->pluck('name')->all();

    expect($names(['type' => 'image']))->toBe(['basalt.png', 'granite.jpg'])
        ->and($names(['type' => 'document']))->toBe(['report.pdf'])
        ->and($names(['month' => '2026-09']))->toBe(['basalt.png', 'report.pdf'])
        ->and($names(['folder' => $folder->id]))->toBe(['report.pdf'])
        ->and($names(['search' => 'Базальт']))->toBe(['basalt.png'])
        ->and($names(['type' => 'bogus', 'month' => 'nope']))->toHaveCount(3);
});

test('the grid first page is exactly the first page of the library endpoint', function () {
    $folder = MediaFolder::create(['name' => 'F', 'slug' => 'f']);

    foreach (range(1, 45) as $i) {
        createLibraryMedia([
            'name' => "file-{$i}.jpg",
            'folder_id' => $i % 3 === 0 ? $folder->id : null,
            'mime_type' => $i % 4 === 0 ? 'application/pdf' : 'image/jpeg',
        ], $i % 2 === 0 ? '2026-09-01 12:00:00' : '2026-08-01 12:00:00');
    }

    $filterSets = [
        [],
        ['type' => 'image'],
        ['type' => 'document', 'month' => '2026-09'],
        ['folder' => $folder->id],
        ['search' => 'file-1'],
    ];

    foreach ($filterSets as $filters) {
        $grid = $this->get(route('admin.media.index', $filters))->inertiaProps('media');
        $endpoint = $this->getJson(route('admin.media.library', $filters))->assertOk()->json();

        expect(collect($grid['data'])->pluck('id')->all())
            ->toBe(collect($endpoint['data'])->pluck('id')->all())
            ->and($grid['meta'])->toBe($endpoint['meta']);
    }
});

test('the months list only offers months that have uploads, newest first', function () {
    createLibraryMedia([], '2025-12-31 23:00:00');
    createLibraryMedia([], '2026-01-15 08:00:00');
    createLibraryMedia([], '2026-01-20 08:00:00');
    $deleted = createLibraryMedia([], '2024-05-05 08:00:00');
    $deleted->delete();

    $this->get(route('admin.media.index'))
        ->assertInertia(fn ($page) => $page->where('months', [
            ['value' => '2026-01', 'label' => 'Январь 2026'],
            ['value' => '2025-12', 'label' => 'Декабрь 2025'],
        ]));
});

test('?item= opens the attachment details of that file', function () {
    $media = createLibraryMedia(['name' => 'opened.jpg', 'alt' => 'Разрез']);

    $this->get(route('admin.media.index', ['item' => $media->id]))
        ->assertInertia(fn ($page) => $page
            ->where('item.id', $media->id)
            ->where('item.name', 'opened.jpg')
            ->where('item.alt', 'Разрез'));

    $this->get(route('admin.media.index', ['item' => 999999]))
        ->assertInertia(fn ($page) => $page->where('item', null));
});

/* ---------------- Медиатека: list mode ---------------- */

test('list mode pages 20 rows with usage counts and sorts by title or date', function () {
    $used = createLibraryMedia(['name' => 'a-used.jpg'], '2026-01-01 10:00:00');
    foreach (range(1, 21) as $i) {
        createLibraryMedia(['name' => sprintf('z-%02d.jpg', $i)], '2026-02-01 10:00:00');
    }

    $post = Post::create(['slug' => 'with-cover', 'status' => 'draft', 'author_id' => auth()->id(), 'og_image_id' => $used->id]);
    $service = Service::create(['slug' => 'drilling']);
    $service->media()->attach($used->id);

    $this->get(route('admin.media.index', ['mode' => 'list', 'orderby' => 'title']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('mode', 'list')
            ->where('sorting', ['orderby' => 'title', 'order' => 'asc'])
            ->has('media.data', 20)
            ->where('media.meta.total', 22)
            ->where('media.meta.last_page', 2)
            ->where('media.data.0.name', 'a-used.jpg')
            ->where('media.data.0.usage_count', 2)
            ->where('media.data.1.usage_count', 0));

    // Default: newest first; the oldest file is alone on page 2.
    $this->get(route('admin.media.index', ['mode' => 'list', 'page' => 2]))
        ->assertInertia(fn ($page) => $page
            ->where('sorting', ['orderby' => 'date', 'order' => 'desc'])
            ->has('media.data', 2)
            ->where('media.data.1.name', 'a-used.jpg'));

    expect($post->fresh()->og_image_id)->toBe($used->id);
});

test('a list page past the end shows the last page', function () {
    foreach (range(1, 21) as $i) {
        createLibraryMedia(['name' => "file-{$i}.jpg"]);
    }

    $this->get(route('admin.media.index', ['mode' => 'list', 'page' => 5]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('media.meta.current_page', 2)
            ->where('media.meta.last_page', 2)
            ->has('media.data', 1));
});

/* ---------------- Загрузить медиафайлы ---------------- */

test('the upload page renders with folders and upload limits', function () {
    MediaFolder::create(['name' => 'Карты', 'slug' => 'karty']);

    $this->get(route('admin.media.create'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Admin/Media/Create')
            ->where('folders.0.name', 'Карты')
            ->has('upload.max_bytes')
            ->has('upload.max_size')
            ->has('upload.accept'));
});

test('the upload page needs the upload permission', function () {
    $this->actingAs(userWithRole('author'))->get(route('admin.media.create'))->assertOk();
    $this->actingAs(userWithRole('moderator'))->get(route('admin.media.create'))->assertForbidden();
});

/* ---------------- Параметры вложения ---------------- */

test('attachment details list where the file is used', function () {
    $media = createLibraryMedia(['name' => 'cover.jpg']);
    $post = Post::create(['slug' => 'expedition', 'status' => 'draft', 'author_id' => auth()->id(), 'og_image_id' => $media->id]);
    $post->translations()->create(['locale' => 'ru', 'title' => 'Экспедиция на Памир', 'content' => '<p>…</p>']);
    $service = Service::create(['slug' => 'mapping']);
    $service->translations()->create(['locale' => 'ru', 'title' => 'Геологическое картирование']);
    $service->media()->attach($media->id);

    $this->getJson(route('admin.media.show', $media))
        ->assertOk()
        ->assertJsonPath('data.id', $media->id)
        ->assertJsonPath('data.name', 'cover.jpg')
        ->assertJsonPath('data.usage', [
            [
                'type' => 'post',
                'label' => 'Изображение записи',
                'title' => 'Экспедиция на Памир',
                'url' => route('admin.posts.edit', $post),
            ],
            [
                'type' => 'service',
                'label' => 'Услуга',
                'title' => 'Геологическое картирование',
                'url' => route('admin.services.edit', $service),
            ],
        ]);
});

test('attachment details hide edit links the viewer may not open', function () {
    $media = createLibraryMedia();
    Post::create(['slug' => 'foreign', 'status' => 'draft', 'author_id' => auth()->id(), 'og_image_id' => $media->id]);

    $this->actingAs(userWithRole('author'))
        ->getJson(route('admin.media.show', $media))
        ->assertOk()
        ->assertJsonPath('data.usage.0.title', 'foreign')
        ->assertJsonPath('data.usage.0.url', null);
});

test('opening a file URL in the browser lands on the library with the file open', function () {
    $media = createLibraryMedia();

    $this->get(route('admin.media.show', $media))
        ->assertRedirect(route('admin.media.index', ['item' => $media->id]));
});

test('attachment details save one field at a time as JSON', function () {
    $folder = MediaFolder::create(['name' => 'Target', 'slug' => 'target']);
    $media = createLibraryMedia([
        'name' => 'old title',
        'alt' => 'old alt',
        'title' => 'old description',
        'caption' => 'old caption',
    ]);

    $this->patchJson(route('admin.media.update', $media), ['alt' => 'Геолог отбирает пробы'])
        ->assertOk()
        ->assertJsonPath('data.id', $media->id)
        ->assertJsonPath('data.alt', 'Геолог отбирает пробы')
        ->assertJsonPath('data.name', 'old title')
        ->assertJsonPath('data.caption', 'old caption');

    $this->patchJson(route('admin.media.update', $media), ['folder_id' => $folder->id])
        ->assertOk()
        ->assertJsonPath('data.folder_id', $folder->id);

    $this->patchJson(route('admin.media.update', $media), ['caption' => ''])
        ->assertOk()
        ->assertJsonPath('data.caption', null);

    $media->refresh();
    expect($media->alt)->toBe('Геолог отбирает пробы')
        ->and($media->name)->toBe('old title')
        ->and($media->title)->toBe('old description')
        ->and($media->caption)->toBeNull()
        ->and($media->folder_id)->toBe($folder->id);
});

test('an emptied title is refused with a Russian message', function () {
    $media = createLibraryMedia(['name' => 'keep me']);

    $this->patchJson(route('admin.media.update', $media), ['name' => ''])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name' => 'Заголовок не может быть пустым.']);

    $this->patchJson(route('admin.media.update', $media), ['folder_id' => 999])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['folder_id' => 'Выбранная папка не найдена.']);

    expect($media->fresh()->name)->toBe('keep me');
});

test('a classic form update still redirects back with a Russian notice', function () {
    $media = createLibraryMedia();

    $this->from(route('admin.media.index'))
        ->patch(route('admin.media.update', $media), ['alt' => 'Обнажение'])
        ->assertRedirect(route('admin.media.index'))
        ->assertSessionHas('success', 'Медиафайл обновлён.');
});

/* ---------------- Удалить навсегда ---------------- */

test('deleting removes the row for good, the file, and the references to it', function () {
    $media = createLibraryMedia();
    $path = $media->path;
    $post = Post::create(['slug' => 'with-cover', 'status' => 'draft', 'author_id' => auth()->id(), 'og_image_id' => $media->id]);
    $service = Service::create(['slug' => 'lab']);
    $service->media()->attach($media->id);

    $this->deleteJson(route('admin.media.destroy', $media))
        ->assertOk()
        ->assertJson(['deleted' => 1, 'message' => 'Медиафайл удалён навсегда.']);

    expect(Media::withTrashed()->find($media->id))->toBeNull()
        ->and($post->fresh()->og_image_id)->toBeNull()
        ->and($service->media()->count())->toBe(0);
    $this->assertDatabaseMissing('media_ables', ['media_id' => $media->id]);
    Storage::disk('public')->assertMissing($path);
});

test('a classic delete redirects back with a Russian notice', function () {
    $media = createLibraryMedia();

    $this->from(route('admin.media.index', ['mode' => 'list']))
        ->delete(route('admin.media.destroy', $media))
        ->assertRedirect(route('admin.media.index', ['mode' => 'list']))
        ->assertSessionHas('success', 'Медиафайл удалён навсегда.');
});

test('bulk delete removes every selected file', function () {
    $first = createLibraryMedia(['name' => 'one.jpg']);
    $second = createLibraryMedia(['name' => 'two.jpg']);
    $kept = createLibraryMedia(['name' => 'kept.jpg']);
    $post = Post::create(['slug' => 'cover', 'status' => 'draft', 'author_id' => auth()->id(), 'og_image_id' => $second->id]);

    $this->deleteJson(route('admin.media.bulk-destroy'), ['ids' => [$first->id, $second->id]])
        ->assertOk()
        ->assertJson(['deleted' => 2, 'message' => 'Удалено медиафайлов: 2.']);

    expect(Media::withTrashed()->pluck('id')->all())->toBe([$kept->id])
        ->and($post->fresh()->og_image_id)->toBeNull();
    Storage::disk('public')->assertMissing($first->path);
    Storage::disk('public')->assertMissing($second->path);
    Storage::disk('public')->assertExists($kept->path);
});

test('bulk delete from the list table redirects back with a Russian notice', function () {
    $media = createLibraryMedia();

    $this->from(route('admin.media.index', ['mode' => 'list']))
        ->delete(route('admin.media.bulk-destroy'), ['ids' => [$media->id]])
        ->assertRedirect(route('admin.media.index', ['mode' => 'list']))
        ->assertSessionHas('success', 'Удалено медиафайлов: 1.');
});

test('bulk delete validates the selection', function () {
    $trashed = createLibraryMedia();
    $trashed->delete();

    $this->deleteJson(route('admin.media.bulk-destroy'), ['ids' => []])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['ids' => 'Выберите медиафайлы для удаления.']);

    $this->deleteJson(route('admin.media.bulk-destroy'), ['ids' => [$trashed->id, 424242]])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['ids.0', 'ids.1']);
});

/* ---------------- Права ---------------- */

test('an author may upload and edit files but not delete them', function () {
    $media = createLibraryMedia();
    $this->actingAs(userWithRole('author'));

    $this->get(route('admin.media.index'))->assertOk();
    $this->patchJson(route('admin.media.update', $media), ['alt' => 'Можно'])->assertOk();

    $this->deleteJson(route('admin.media.destroy', $media))->assertForbidden();
    $this->deleteJson(route('admin.media.bulk-destroy'), ['ids' => [$media->id]])->assertForbidden();

    expect(Media::find($media->id))->not->toBeNull();
    Storage::disk('public')->assertExists($media->path);
});

test('a moderator cannot see the library or its files', function () {
    $media = createLibraryMedia();
    $this->actingAs(userWithRole('moderator'));

    $this->get(route('admin.media.index'))->assertForbidden();
    $this->getJson(route('admin.media.show', $media))->assertForbidden();
    $this->patchJson(route('admin.media.update', $media), ['alt' => 'Нет'])->assertForbidden();
});

/* ---------------- Сообщения на русском ---------------- */

test('batch upload errors and notices are in Russian', function () {
    $this->post(route('admin.media.store'), [
        'files' => [UploadedFile::fake()->create('malware.exe', 10, 'application/x-msdownload')],
    ])->assertSessionHasErrors([
        'files.0' => 'Можно загружать JPG, PNG, GIF, WebP, PDF, DOC и DOCX. SVG и исполняемые файлы запрещены.',
    ]);

    $this->post(route('admin.media.store'), [
        'files' => [UploadedFile::fake()->image('big.jpg')->size(11000)],
    ])->assertSessionHasErrors(['files.0' => 'Файл должен быть не больше 10 МБ.']);

    $this->post(route('admin.media.store'), [
        'files' => [UploadedFile::fake()->image('a.jpg'), UploadedFile::fake()->image('b.jpg')],
    ])->assertSessionHas('success', 'Загружено файлов: 2.');
});
