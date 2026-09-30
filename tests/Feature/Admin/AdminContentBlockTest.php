<?php

use App\Models\ContentBlock;
use App\Models\ContentPage;
use App\Models\Locale;

beforeEach(function () {
    Locale::firstOrCreate(['code' => 'ru'], [
        'name' => 'Русский',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    userWithRole('admin');
    $this->page = ContentPage::create(['slug' => 'hub', 'status' => 'draft']);
});

test('admin can add a block; defaults seed for active locales', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.content-pages.blocks.store', $this->page), [
        'type' => 'hero',
    ])->assertRedirect();

    $block = ContentBlock::firstOrFail();
    expect($block->type)->toBe('hero');
    expect($block->settings['alignment'] ?? null)->toBe('center');
    expect($block->translations()->where('locale', 'ru')->exists())->toBeTrue();
});

test('unknown block types are rejected at validation', function () {
    $this->actingAs(userWithRole('admin'));

    $this->post(route('admin.content-pages.blocks.store', $this->page), [
        'type' => 'not_a_block',
    ])->assertSessionHasErrors('type');
});

test('admin can update block settings and translations', function () {
    $this->actingAs(userWithRole('admin'));
    $block = $this->page->blocks()->create([
        'type' => 'hero',
        'sort_order' => 1,
        'settings' => ['alignment' => 'center', 'image_id' => null],
    ]);
    $block->translations()->create([
        'locale' => 'ru',
        'content' => ['title' => 'Old'],
    ]);

    $this->put(route('admin.content-pages.blocks.update', [$this->page, $block]), [
        'type' => 'hero',
        'settings' => ['alignment' => 'left', 'image_id' => 5],
        'translations' => [
            'ru' => ['title' => 'New title', 'subtitle' => 'sub'],
        ],
    ])->assertRedirect();

    $block->refresh();
    expect($block->settings['alignment'])->toBe('left');
    expect($block->settings['image_id'])->toBe(5);

    $translation = $block->translations()->where('locale', 'ru')->firstOrFail();
    expect($translation->content['title'])->toBe('New title');
    expect($translation->content['subtitle'])->toBe('sub');
});

test('rich_text content is sanitised before persisting', function () {
    $this->actingAs(userWithRole('admin'));
    $block = $this->page->blocks()->create(['type' => 'rich_text', 'sort_order' => 1]);

    $this->put(route('admin.content-pages.blocks.update', [$this->page, $block]), [
        'type' => 'rich_text',
        'translations' => [
            'ru' => ['body' => '<p>safe</p><script>alert(1)</script>'],
        ],
    ])->assertRedirect();

    $stored = $block->translations()->where('locale', 'ru')->value('content');
    expect($stored['body'])
        ->not->toContain('<script>')
        ->toContain('<p>safe</p>');
});

test('admin can reorder blocks', function () {
    $this->actingAs(userWithRole('admin'));
    $a = $this->page->blocks()->create(['type' => 'hero', 'sort_order' => 1]);
    $b = $this->page->blocks()->create(['type' => 'rich_text', 'sort_order' => 2]);
    $c = $this->page->blocks()->create(['type' => 'hero', 'sort_order' => 3]);

    $this->patch(route('admin.content-pages.blocks.reorder', $this->page), [
        'order' => [$c->id, $a->id, $b->id],
    ])->assertRedirect();

    expect($c->fresh()->sort_order)->toBe(1);
    expect($a->fresh()->sort_order)->toBe(2);
    expect($b->fresh()->sort_order)->toBe(3);
});

test('reorder rejects ids from a different page', function () {
    $this->actingAs(userWithRole('admin'));
    $otherPage = ContentPage::create(['slug' => 'other', 'status' => 'draft']);
    $foreignBlock = $otherPage->blocks()->create(['type' => 'hero', 'sort_order' => 1]);

    $this->patch(route('admin.content-pages.blocks.reorder', $this->page), [
        'order' => [$foreignBlock->id],
    ])->assertSessionHasErrors('order.0');
});

test('admin can delete a block; deleting the page cascades blocks', function () {
    $this->actingAs(userWithRole('admin'));
    $block = $this->page->blocks()->create(['type' => 'hero', 'sort_order' => 1]);

    $this->delete(route('admin.content-pages.blocks.destroy', [$this->page, $block]))
        ->assertRedirect();
    $this->assertDatabaseMissing('content_blocks', ['id' => $block->id]);

    // Cascade check: new block, then delete the page entirely
    $block2 = $this->page->blocks()->create(['type' => 'rich_text', 'sort_order' => 1]);
    $this->page->delete();
    $this->page->forceDelete();

    $this->assertDatabaseMissing('content_blocks', ['id' => $block2->id]);
});

test('updating a block scoped to one page rejects a block id from another page', function () {
    $this->actingAs(userWithRole('admin'));
    $other = ContentPage::create(['slug' => 'b', 'status' => 'draft']);
    $foreignBlock = $other->blocks()->create(['type' => 'hero', 'sort_order' => 1]);

    $this->put(route('admin.content-pages.blocks.update', [$this->page, $foreignBlock]), [
        'type' => 'hero',
        'settings' => [],
        'translations' => ['ru' => ['title' => 'x']],
    ])->assertForbidden();
});

test('rich text that is not a string is refused, not stored raw', function () {
    $this->actingAs(userWithRole('admin'));
    $block = $this->page->blocks()->create(['type' => 'rich_text', 'sort_order' => 1]);
    $block->translations()->create(['locale' => 'ru', 'content' => ['body' => '<p>safe</p>']]);

    $this->put(route('admin.content-pages.blocks.update', [$this->page, $block]), [
        'type' => 'rich_text',
        'translations' => [
            'ru' => ['body' => ['<img src=x onerror=alert(1)>']],
        ],
    ])->assertSessionHasErrors('translations.ru.body');

    $this->post(route('admin.content-pages.blocks.store', $this->page), [
        'type' => 'rich_text',
        'translations' => [
            'ru' => ['body' => ['<img src=x onerror=alert(1)>']],
        ],
    ])->assertSessionHasErrors('translations.ru.body');

    expect($block->translations()->where('locale', 'ru')->value('content'))->toBe(['body' => '<p>safe</p>']);
    expect(ContentBlock::count())->toBe(1);
});

test('hero button links must be http(s) addresses or site paths', function (string $url) {
    $this->actingAs(userWithRole('admin'));
    $block = $this->page->blocks()->create(['type' => 'hero', 'sort_order' => 1]);

    $this->put(route('admin.content-pages.blocks.update', [$this->page, $block]), [
        'type' => 'hero',
        'translations' => ['ru' => ['cta_label' => 'Жми', 'cta_url' => $url]],
    ])->assertSessionHasErrors('translations.ru.cta_url');

    expect($block->translations()->count())->toBe(0);
})->with([
    'javascript' => 'javascript:alert(1)',
    'mixed-case javascript' => 'JaVaScRiPt:alert(document.cookie)',
    'data url' => 'data:text/html,<script>alert(1)</script>',
    'protocol-relative' => '//evil.example/phish',
    'backslash trick' => '/\\evil.example',
    'whitespace' => ' javascript:alert(1)',
]);

test('hero button links accept http(s) addresses and site paths', function (string $url) {
    $this->actingAs(userWithRole('admin'));
    $block = $this->page->blocks()->create(['type' => 'hero', 'sort_order' => 1]);

    $this->put(route('admin.content-pages.blocks.update', [$this->page, $block]), [
        'type' => 'hero',
        'translations' => ['ru' => ['cta_label' => 'Подробнее', 'cta_url' => $url]],
    ])->assertSessionHasNoErrors();

    expect($block->translations()->where('locale', 'ru')->value('content')['cta_url'])->toBe($url);
})->with([
    'https' => 'https://example.com/about?x=1#team',
    'http' => 'http://example.com',
    'site path' => '/ru/services',
]);

test('block fields are checked against the type schema', function () {
    $this->actingAs(userWithRole('admin'));
    $block = $this->page->blocks()->create(['type' => 'hero', 'sort_order' => 1, 'settings' => ['alignment' => 'center']]);

    $this->put(route('admin.content-pages.blocks.update', [$this->page, $block]), [
        'type' => 'hero',
        'settings' => ['alignment' => 'diagonal', 'onclick' => 'x'],
        'translations' => ['ru' => ['title' => ['nested'], 'script' => '<script>']],
    ])->assertSessionHasErrors([
        'settings.alignment',
        'settings',
        'translations.ru.title',
        'translations.ru',
    ]);

    expect($block->fresh()->settings)->toBe(['alignment' => 'center']);
});

test('block translations for unknown languages are refused', function () {
    $this->actingAs(userWithRole('admin'));
    $block = $this->page->blocks()->create(['type' => 'hero', 'sort_order' => 1]);

    $this->put(route('admin.content-pages.blocks.update', [$this->page, $block]), [
        'type' => 'hero',
        'translations' => ['zz' => ['title' => 'x']],
    ])->assertSessionHasErrors('translations');

    expect($block->translations()->count())->toBe(0);
});

test('the type of an existing block cannot be changed', function () {
    $this->actingAs(userWithRole('admin'));
    $block = $this->page->blocks()->create(['type' => 'hero', 'sort_order' => 1]);

    $this->put(route('admin.content-pages.blocks.update', [$this->page, $block]), [
        'type' => 'rich_text',
        'translations' => ['ru' => ['body' => '<p>x</p>']],
    ])->assertSessionHasErrors('type');

    expect($block->fresh()->type)->toBe('hero');
});

test('updating a block without translations keeps its texts and settings', function () {
    $this->actingAs(userWithRole('admin'));
    $block = $this->page->blocks()->create([
        'type' => 'hero',
        'sort_order' => 1,
        'settings' => ['alignment' => 'left', 'image_id' => 7],
    ]);
    $block->translations()->create(['locale' => 'ru', 'content' => ['title' => 'Заголовок']]);

    $this->put(route('admin.content-pages.blocks.update', [$this->page, $block]), [
        'type' => 'hero',
    ])->assertSessionHasNoErrors();

    expect($block->translations()->where('locale', 'ru')->value('content'))->toBe(['title' => 'Заголовок']);
    expect($block->fresh()->settings)->toBe(['alignment' => 'left', 'image_id' => 7]);
});

test('updating one language of a block keeps the other languages', function () {
    Locale::firstOrCreate(['code' => 'en'], ['name' => 'English', 'is_active' => false, 'sort_order' => 3]);
    $this->actingAs(userWithRole('admin'));
    $block = $this->page->blocks()->create(['type' => 'hero', 'sort_order' => 1]);
    $block->translations()->create(['locale' => 'en', 'content' => ['title' => 'English']]);

    $this->put(route('admin.content-pages.blocks.update', [$this->page, $block]), [
        'type' => 'hero',
        'translations' => ['ru' => ['title' => 'Русский']],
    ])->assertSessionHasNoErrors()->assertSessionHas('success', 'Блок сохранён.');

    expect($block->translations()->where('locale', 'en')->value('content'))->toBe(['title' => 'English']);
    expect($block->translations()->where('locale', 'ru')->value('content')['title'])->toBe('Русский');
});
