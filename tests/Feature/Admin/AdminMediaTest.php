<?php

use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->user = userWithRole('admin');
    $this->actingAs($this->user);
    Storage::fake('public');
});

test('guests cannot access admin media', function () {
    auth()->logout();

    $this->get(route('admin.media.index'))->assertRedirect();
    $this->post(route('admin.media.store'))->assertRedirect();
});

test('authenticated user can view media index', function () {
    $this->get(route('admin.media.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page->component('Admin/Media/Index'));
});

test('authenticated user can upload a single file', function () {
    $file = UploadedFile::fake()->image('photo.jpg', 640, 480);

    $this->post(route('admin.media.store'), [
        'files' => [$file],
    ])->assertRedirect();

    $this->assertDatabaseCount('media', 1);

    $media = Media::first();
    expect($media->disk)->toBe('public');
    expect($media->mime_type)->toContain('image');
    Storage::disk('public')->assertExists($media->path);
});

test('authenticated user can upload multiple files', function () {
    $files = [
        UploadedFile::fake()->image('photo1.jpg'),
        UploadedFile::fake()->image('photo2.png'),
    ];

    $this->post(route('admin.media.store'), [
        'files' => $files,
    ])->assertRedirect();

    $this->assertDatabaseCount('media', 2);
});

test('upload requires at least one file', function () {
    $this->post(route('admin.media.store'), [
        'files' => [],
    ])->assertSessionHasErrors('files');
});

test('upload rejects invalid file types', function () {
    $file = UploadedFile::fake()->create('malware.exe', 100, 'application/x-msdownload');

    $this->post(route('admin.media.store'), [
        'files' => [$file],
    ])->assertSessionHasErrors('files.0');

    $this->assertDatabaseCount('media', 0);
});

test('upload rejects files exceeding max size', function () {
    $file = UploadedFile::fake()->image('huge.jpg')->size(11000);

    $this->post(route('admin.media.store'), [
        'files' => [$file],
    ])->assertSessionHasErrors('files.0');
});

test('authenticated user can delete media', function () {
    $file = UploadedFile::fake()->image('delete-me.jpg');
    $path = $file->store('media', 'public');

    $media = Media::create([
        'disk' => 'public',
        'path' => $path,
        'mime_type' => 'image/jpeg',
        'size' => $file->getSize(),
    ]);

    Storage::disk('public')->assertExists($path);

    $this->delete(route('admin.media.destroy', $media))
        ->assertRedirect();

    // Media uses SoftDeletes (Phase 3) so the row stays in the table with deleted_at set,
    // but the underlying file on disk is gone immediately.
    $this->assertSoftDeleted('media', ['id' => $media->id]);
    Storage::disk('public')->assertMissing($path);
});

test('upload extracts width and height for image files', function () {
    $this->post(route('admin.media.store'), [
        'files' => [UploadedFile::fake()->image('photo.jpg', 800, 600)],
    ])->assertRedirect();

    $media = Media::firstOrFail();
    expect($media->width)->toBe(800);
    expect($media->height)->toBe(600);
    expect($media->original_name)->toBe('photo.jpg');
});

test('upload places file in the requested folder', function () {
    $folder = \App\Models\MediaFolder::create(['name' => 'F', 'slug' => 'f']);

    $this->post(route('admin.media.store'), [
        'files' => [UploadedFile::fake()->image('x.jpg')],
        'folder_id' => $folder->id,
    ])->assertRedirect();

    expect(Media::firstOrFail()->folder_id)->toBe($folder->id);
});

test('admin can update metadata (alt, title, caption, name, folder)', function () {
    $folder = \App\Models\MediaFolder::create(['name' => 'Target', 'slug' => 'target']);
    $media = Media::create([
        'disk' => 'public',
        'path' => 'media/x.jpg',
        'mime_type' => 'image/jpeg',
        'size' => 100,
        'name' => 'old.jpg',
    ]);

    $this->put(route('admin.media.update', $media), [
        'folder_id' => $folder->id,
        'name' => 'renamed.jpg',
        'alt' => 'Geologist sampling rocks',
        'title' => 'Sample collection',
        'caption' => 'Fieldwork in Pamir, summer 2024.',
    ])->assertRedirect();

    $media->refresh();
    expect($media->name)->toBe('renamed.jpg');
    expect($media->alt)->toBe('Geologist sampling rocks');
    expect($media->title)->toBe('Sample collection');
    expect($media->caption)->toBe('Fieldwork in Pamir, summer 2024.');
    expect($media->folder_id)->toBe($folder->id);
});

test('index can be filtered by folder and search', function () {
    $folder = \App\Models\MediaFolder::create(['name' => 'F', 'slug' => 'f']);
    Media::create([
        'folder_id' => $folder->id, 'disk' => 'public',
        'path' => 'media/in.jpg', 'mime_type' => 'image/jpeg', 'size' => 100,
        'name' => 'matching.jpg',
    ]);
    Media::create([
        'folder_id' => null, 'disk' => 'public',
        'path' => 'media/out.jpg', 'mime_type' => 'image/jpeg', 'size' => 100,
        'name' => 'matching-root.jpg',
    ]);

    $this->get(route('admin.media.index', ['folder' => $folder->id]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('media.data', 1)
            ->where('media.data.0.name', 'matching.jpg'));

    $this->get(route('admin.media.index', ['search' => 'root']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('media.data', 1)
            ->where('media.data.0.name', 'matching-root.jpg'));
});

test('non-image uploads receive null dimensions', function () {
    $this->post(route('admin.media.store'), [
        'files' => [UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf')],
    ])->assertRedirect();

    $media = Media::firstOrFail();
    expect($media->width)->toBeNull();
    expect($media->height)->toBeNull();
});
