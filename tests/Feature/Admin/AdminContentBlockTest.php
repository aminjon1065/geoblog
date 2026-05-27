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
