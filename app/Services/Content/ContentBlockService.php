<?php

declare(strict_types=1);

namespace App\Services\Content;

use App\Cms\Blocks\BlockRegistry;
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
        $this->requireKnownType($data->type);

        return DB::transaction(function () use ($page, $data): ContentBlock {
            // New blocks land at the end of the page's existing order.
            $nextOrder = (int) ($page->blocks()->max('sort_order') ?? 0) + 1;

            $block = $page->blocks()->create([
                'type' => $data->type,
                'sort_order' => $nextOrder,
                'settings' => $this->mergeSettings($data->type, $data->settings),
            ]);

            $this->writeTranslations($block, $data);

            return $block;
        });
    }

    public function update(ContentBlock $block, ContentBlockData $data): ContentBlock
    {
        $this->requireKnownType($data->type);

        return DB::transaction(function () use ($block, $data): ContentBlock {
            $block->update([
                // The type is not editable in place — changing it would invalidate the
                // settings/content schema. The Request layer enforces this; we re-check
                // defensively because services are entry points for tests and tinker.
                'type' => $block->type,
                'settings' => $this->mergeSettings($block->type, $data->settings),
            ]);

            $this->writeTranslations($block, $data);

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

    private function requireKnownType(string $type): void
    {
        if (! $this->registry->has($type)) {
            throw new InvalidArgumentException("Unknown block type: {$type}");
        }
    }

    /**
     * Merge user-supplied settings on top of catalog defaults so omitted keys still
     * land in storage with a defined value.
     *
     * @param  array<string, mixed>  $userSettings
     * @return array<string, mixed>
     */
    private function mergeSettings(string $type, array $userSettings): array
    {
        $defaults = $this->registry->get($type)?->defaultSettings() ?? [];

        return array_replace($defaults, $userSettings);
    }

    private function writeTranslations(ContentBlock $block, ContentBlockData $data): void
    {
        foreach ($data->translations as $locale => $content) {
            $block->translations()->updateOrCreate(
                ['locale' => (string) $locale],
                ['content' => $content],
            );
        }

        $block->translations()
            ->whereNotIn('locale', array_keys($data->translations))
            ->delete();
    }
}
