<?php

use App\Models\Media;
use App\Models\MediaFolder;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->actingAs(userWithRole('admin'));
    Storage::fake('public');
});

test('editor and admin can manage folders; moderator cannot', function () {
    auth()->logout();

    $this->actingAs(userWithRole('moderator'));
    $this->post(route('admin.media-folders.store'), ['name' => 'X'])->assertForbidden();

    $this->actingAs(userWithRole('editor'));
    $this->post(route('admin.media-folders.store'), ['name' => 'Editor Folder'])
        ->assertRedirect();
    $this->assertDatabaseHas('media_folders', ['name' => 'Editor Folder']);
});

test('admin can create a folder', function () {
    $this->post(route('admin.media-folders.store'), [
        'name' => 'Field Photos',
    ])->assertRedirect();

    $this->assertDatabaseHas('media_folders', [
        'name' => 'Field Photos',
        'slug' => 'field-photos',
        'parent_id' => null,
    ]);
});

test('admin can create a nested folder', function () {
    $parent = MediaFolder::create(['name' => 'Geology', 'slug' => 'geology']);

    $this->post(route('admin.media-folders.store'), [
        'name' => 'Fieldwork',
        'parent_id' => $parent->id,
    ])->assertRedirect();

    $this->assertDatabaseHas('media_folders', [
        'name' => 'Fieldwork',
        'parent_id' => $parent->id,
    ]);
});

test('folder names whose slug collides with a sibling are rejected', function () {
    MediaFolder::create(['name' => 'Geology', 'slug' => 'geology']);

    $this->post(route('admin.media-folders.store'), [
        'name' => 'Geology',
    ])->assertSessionHasErrors('name');
});

test('admin can rename a folder', function () {
    $folder = MediaFolder::create(['name' => 'Old', 'slug' => 'old']);

    $this->put(route('admin.media-folders.update', $folder), [
        'name' => 'New',
    ])->assertRedirect();

    $folder->refresh();
    expect($folder->name)->toBe('New');
    expect($folder->slug)->toBe('new');
});

test('admin can delete an empty folder', function () {
    $folder = MediaFolder::create(['name' => 'Empty', 'slug' => 'empty']);

    $this->delete(route('admin.media-folders.destroy', $folder))->assertRedirect();
    $this->assertDatabaseMissing('media_folders', ['id' => $folder->id]);
});

test('admin cannot delete a folder containing files', function () {
    $folder = MediaFolder::create(['name' => 'Has Files', 'slug' => 'has-files']);
    Media::create([
        'folder_id' => $folder->id,
        'disk' => 'public',
        'path' => 'media/x.jpg',
        'mime_type' => 'image/jpeg',
        'size' => 100,
    ]);

    $this->delete(route('admin.media-folders.destroy', $folder))
        ->assertSessionHasErrors('delete');

    $this->assertDatabaseHas('media_folders', ['id' => $folder->id]);
});

test('admin cannot delete a folder containing subfolders', function () {
    $parent = MediaFolder::create(['name' => 'P', 'slug' => 'p']);
    MediaFolder::create(['name' => 'C', 'slug' => 'c', 'parent_id' => $parent->id]);

    $this->delete(route('admin.media-folders.destroy', $parent))
        ->assertSessionHasErrors('delete');

    $this->assertDatabaseHas('media_folders', ['id' => $parent->id]);
});

test('folder update rejects making itself its own ancestor', function () {
    $a = MediaFolder::create(['name' => 'A', 'slug' => 'a']);
    $b = MediaFolder::create(['name' => 'B', 'slug' => 'b', 'parent_id' => $a->id]);

    // Try to move A under B — A is ancestor of B, so this would create a cycle.
    $this->put(route('admin.media-folders.update', $a), [
        'name' => 'A',
        'parent_id' => $b->id,
    ])->assertSessionHasErrors('parent_id');
});
