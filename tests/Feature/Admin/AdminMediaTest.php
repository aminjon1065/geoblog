<?php

use App\Models\Media;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->user = User::factory()->create();
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

    $this->assertDatabaseMissing('media', ['id' => $media->id]);
    Storage::disk('public')->assertMissing($path);
});
