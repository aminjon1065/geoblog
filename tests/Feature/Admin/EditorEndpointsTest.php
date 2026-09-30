<?php

use App\Models\Category;
use App\Models\Locale;
use App\Models\Media;
use App\Models\Post;
use App\Models\Tag;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'tj'], ['name' => 'Тоҷикӣ', 'is_active' => true, 'sort_order' => 1]);
    Locale::firstOrCreate(['code' => 'ru'], ['name' => 'Русский', 'is_active' => true, 'sort_order' => 2]);
});

test('a quick draft becomes a russian draft with paragraphs', function () {
    $author = userWithRole('author');
    $this->actingAs($author);

    $this->from(route('dashboard'))
        ->post(route('admin.posts.quick-draft'), [
            'title' => 'Мысль',
            'content' => "Первый абзац\n\nВторой <b>абзац</b>",
        ])
        ->assertRedirect(route('dashboard'))
        ->assertSessionHas('success', 'Черновик сохранён.');

    $post = Post::firstOrFail();
    expect($post->status)->toBe('draft')
        ->and($post->author_id)->toBe($author->id)
        ->and($post->slug)->toBe('mysl');

    $translation = $post->translations()->firstOrFail();
    expect($translation->locale)->toBe('ru')
        ->and($translation->content)->toBe('<p>Первый абзац</p><p>Второй &lt;b&gt;абзац&lt;/b&gt;</p>');
});

test('quick draft errors land in their own bag', function () {
    $this->actingAs(userWithRole('author'));

    $this->post(route('admin.posts.quick-draft'), ['title' => ''])
        ->assertSessionHasErrorsIn('quickDraft', ['title']);
});

test('quick draft needs the create permission', function () {
    $this->actingAs(userWithRole('moderator'));

    $this->post(route('admin.posts.quick-draft'), ['title' => 'x'])->assertForbidden();
});

test('a category is created from the editor, or found when it exists', function () {
    $this->actingAs(userWithRole('editor'));

    $this->postJson(route('admin.categories.quick'), ['name' => 'Полевые работы', 'locale' => 'ru'])
        ->assertCreated()
        ->assertJson(['name' => 'Полевые работы', 'slug' => 'polevye-raboty']);

    $category = Category::firstOrFail();
    expect($category->translations()->value('name'))->toBe('Полевые работы');

    $this->postJson(route('admin.categories.quick'), ['name' => 'Полевые работы', 'locale' => 'ru'])
        ->assertOk()
        ->assertJson(['id' => $category->id]);

    expect(Category::count())->toBe(1);
});

test('a tag is created from the editor with a unique slug', function () {
    $this->actingAs(userWithRole('editor'));
    Tag::create(['slug' => 'pamir'])->delete();

    $this->postJson(route('admin.tags.quick'), ['name' => 'Памир', 'locale' => 'tj'])
        ->assertCreated()
        ->assertJson(['name' => 'Памир', 'slug' => 'pamir-2']);
});

test('quick terms need the permission and a known language', function () {
    $this->actingAs(userWithRole('author'));
    $this->postJson(route('admin.categories.quick'), ['name' => 'X', 'locale' => 'ru'])->assertForbidden();

    $this->actingAs(userWithRole('editor'));
    $this->postJson(route('admin.tags.quick'), ['name' => 'X', 'locale' => 'de'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('locale');
});

test('the media library answers json with filters', function () {
    $this->actingAs(userWithRole('author'));

    (new Media)->forceFill(['disk' => 'public', 'path' => 'media/a.jpg', 'original_name' => 'mountain.jpg', 'name' => 'Горы', 'mime_type' => 'image/jpeg', 'size' => 2048, 'created_at' => '2026-05-02 10:00:00'])->save();
    (new Media)->forceFill(['disk' => 'public', 'path' => 'media/b.pdf', 'original_name' => 'report.pdf', 'name' => 'Отчёт', 'mime_type' => 'application/pdf', 'size' => 1536000, 'created_at' => '2026-06-02 10:00:00'])->save();

    $this->getJson(route('admin.media.library'))
        ->assertOk()
        ->assertJsonPath('meta.total', 2)
        ->assertJsonPath('data.0.name', 'Отчёт')
        ->assertJsonPath('data.0.ext', 'PDF')
        ->assertJsonPath('data.0.size', '1,5 МБ')
        ->assertJsonPath('data.0.is_image', false)
        ->assertJsonPath('data.0.path', '/storage/media/b.pdf');

    $this->getJson(route('admin.media.library', ['type' => 'image']))
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.name', 'Горы');

    $this->getJson(route('admin.media.library', ['search' => 'report']))
        ->assertJsonPath('meta.total', 1);

    $this->getJson(route('admin.media.library', ['month' => '2026-05']))
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.file_name', 'mountain.jpg');
});

test('a file dropped into the editor is uploaded to the library', function () {
    Storage::fake('public');
    $this->actingAs(userWithRole('author'));

    $response = $this->post(route('admin.media.upload'), [
        'file' => UploadedFile::fake()->image('field.jpg', 800, 600),
        'alt' => 'Лагерь геологов',
    ], ['Accept' => 'application/json'])
        ->assertCreated()
        ->assertJsonPath('data.alt', 'Лагерь геологов')
        ->assertJsonPath('data.width', 800)
        ->assertJsonPath('data.is_image', true);

    Storage::disk('public')->assertExists(Media::findOrFail($response->json('data.id'))->path);
});

test('uploads are validated with russian messages', function () {
    Storage::fake('public');
    $this->actingAs(userWithRole('author'));

    $this->post(route('admin.media.upload'), [
        'file' => UploadedFile::fake()->create('script.svg', 1, 'image/svg+xml'),
    ], ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.file.0', 'Можно загружать JPG, PNG, GIF, WebP, PDF, DOC и DOCX. SVG и исполняемые файлы запрещены.');
});

test('the library needs the media permissions', function () {
    $this->actingAs(userWithRole('moderator'));

    $this->getJson(route('admin.media.library'))->assertForbidden();
    $this->post(route('admin.media.upload'), [], ['Accept' => 'application/json'])->assertForbidden();
});

test('admin screens share the menu counters, public pages do not', function () {
    $editor = userWithRole('editor');
    Post::create(['slug' => 'waiting', 'status' => 'pending', 'author_id' => $editor->id]);
    App\Models\ContactRequest::create(['name' => 'A', 'email' => 'a@x.com', 'message' => 'hi', 'locale' => 'ru', 'is_read' => false]);

    $this->actingAs($editor)
        ->get(route('admin.posts.index'))
        ->assertInertia(fn ($page) => $page
            ->where('adminMenu.pending_posts', 1)
            // Editors don't read contact requests (no permission): no leak of the count.
            ->where('adminMenu.contact_requests', 0));

    $this->actingAs(userWithRole('admin'))
        ->get(route('admin.posts.index'))
        ->assertInertia(fn ($page) => $page->where('adminMenu.contact_requests', 1));

    $this->get(route('home', ['locale' => 'ru']))
        ->assertInertia(fn ($page) => $page->where('adminMenu', null));
});

test('the admin speaks russian while public pages keep their language', function () {
    $this->actingAs(userWithRole('admin'))
        ->get(route('admin.posts.index'))
        ->assertInertia(fn ($page) => $page->where('locale', 'ru'));

    Locale::firstOrCreate(['code' => 'en'], ['name' => 'English', 'is_active' => true, 'sort_order' => 3]);

    $this->get(route('home', ['locale' => 'en']))
        ->assertInertia(fn ($page) => $page->where('locale', 'en'));
});
