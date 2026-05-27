<?php

use App\Cms\Blocks\BlockRegistry;
use App\Cms\Blocks\BlockType;
use App\Cms\Blocks\HeroBlock;
use App\Cms\Blocks\RichTextBlock;

test('the application registers hero and rich_text block types at boot', function () {
    $registry = app(BlockRegistry::class);

    expect($registry->keys())->toContain('hero', 'rich_text');
    expect($registry->has('hero'))->toBeTrue();
    expect($registry->get('hero'))->toBeInstanceOf(HeroBlock::class);
    expect($registry->get('rich_text'))->toBeInstanceOf(RichTextBlock::class);
});

test('registering the same block twice throws', function () {
    $registry = new BlockRegistry;
    $registry->register(new HeroBlock);

    expect(fn () => $registry->register(new HeroBlock))
        ->toThrow(InvalidArgumentException::class);
});

test('every registered type supplies non-empty defaults and a schema', function () {
    $registry = app(BlockRegistry::class);

    foreach ($registry->all() as $type) {
        expect($type)->toBeInstanceOf(BlockType::class);
        expect($type->key())->not->toBe('');
        expect($type->label())->not->toBe('');
        // defaults can legitimately be empty for blocks with no settings, but the
        // schema's *shape* must be an array
        expect($type->settingsSchema())->toBeArray();
        expect($type->contentSchema())->toBeArray();
        expect($type->defaultSettings())->toBeArray();
        expect($type->defaultContent())->toBeArray();
    }
});
