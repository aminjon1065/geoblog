<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\Cms\Blocks\BlockRegistry;
use App\Cms\Blocks\BlockType;
use App\DataTransferObjects\Content\ContentBlockData;
use App\Models\ContentBlock;
use App\Models\ContentPage;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class ContentBlockService
{
    public function __construct(private readonly BlockRegistry $registry) {}

    public function create(ContentPage $page, ContentBlockData $data): ContentBlock
    {
        $type = $this->requireKnownType($data->type);

        return DB::transaction(function () use ($page, $data, $type): ContentBlock {
            // New blocks land at the end of the page's existing order.
            $nextOrder = (int) ($page->blocks()->max('sort_order') ?? 0) + 1;

            $block = $page->blocks()->create([
                'type' => $type->key(),
                'sort_order' => $nextOrder,
                'settings' => array_replace($type->defaultSettings(), $data->settings ?? []),
            ]);

            $this->writeTranslations($block, $type, $data);

            return $block;
        });
    }

    public function update(ContentBlock $block, ContentBlockData $data): ContentBlock
    {
        // The type is not editable in place — changing it would invalidate the
        // settings/content schema — so the stored one rules, not the payload's.
        $type = $this->requireKnownType($block->type);

        return DB::transaction(function () use ($block, $data, $type): ContentBlock {
            if ($data->settings !== null) {
                $block->update([
                    'settings' => array_replace(
                        $type->defaultSettings(),
                        array_intersect_key($block->settings ?? [], $type->settingsSchema()),
                        $data->settings,
                    ),
                ]);
            }

            $this->writeTranslations($block, $type, $data);

            return $block;
        });
    }

    public function delete(ContentBlock $block): void
    {
        $block->delete();
    }

    /**
     * Apply an explicit sort_order list. Any block id missing from the list keeps
     * its current order; the input is treated as a "place these first, in this order"
     * directive — useful for drag-drop UIs that report only the visible window.
     *
     * @param  list<int>  $orderedIds
     */
    public function reorder(ContentPage $page, array $orderedIds): void
    {
        DB::transaction(function () use ($page, $orderedIds): void {
            foreach ($orderedIds as $position => $id) {
                $page->blocks()->whereKey($id)->update(['sort_order' => $position + 1]);
            }
        });
    }

    private function requireKnownType(string $key): BlockType
    {
        return $this->registry->get($key)
            ?? throw new InvalidArgumentException("Unknown block type: {$key}");
    }

    /**
     * Save the content of the languages the form sent, field by field over
     * what is stored; languages it did not send keep their content.
     */
    private function writeTranslations(ContentBlock $block, BlockType $type, ContentBlockData $data): void
    {
        if ($data->translations === []) {
            return;
        }

        $stored = $block->translations()->get()->keyBy('locale');

        foreach ($data->translations as $locale => $content) {
            $current = $stored->get($locale)?->content;

            $block->translations()->updateOrCreate(
                ['locale' => $locale],
                ['content' => array_replace(
                    $type->defaultContent(),
                    is_array($current) ? array_intersect_key($current, $type->contentSchema()) : [],
                    $content,
                )],
            );
        }
    }
}
