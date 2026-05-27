<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Cms\Blocks\BlockRegistry;
use App\DataTransferObjects\Content\ContentBlockData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderContentBlocksRequest;
use App\Http\Requests\Admin\StoreContentBlockRequest;
use App\Http\Requests\Admin\UpdateContentBlockRequest;
use App\Models\ContentBlock;
use App\Models\ContentPage;
use App\Services\Content\ContentBlockService;
use Illuminate\Http\RedirectResponse;

class ContentBlockController extends Controller
{
    public function __construct(
        private readonly ContentBlockService $service,
        private readonly BlockRegistry $registry,
    ) {}

    public function store(StoreContentBlockRequest $request, ContentPage $contentPage): RedirectResponse
    {
        $type = (string) $request->validated('type');
        $block = $this->service->create(
            $contentPage,
            ContentBlockData::fromRequest($request, $this->richTextFieldsFor($type)),
        );

        // Seed any missing translation defaults so the editor always has a row to bind to.
        $this->seedDefaultTranslations($block);

        return back()->with('success', 'Block added.');
    }

    public function update(
        UpdateContentBlockRequest $request,
        ContentPage $contentPage,
        ContentBlock $block,
    ): RedirectResponse {
        $type = $block->type;
        $this->service->update(
            $block,
            ContentBlockData::fromRequest($request, $this->richTextFieldsFor($type)),
        );

        return back()->with('success', 'Block updated.');
    }

    public function destroy(ContentPage $contentPage, ContentBlock $block): RedirectResponse
    {
        // Defence in depth — `update` permission gates writes; the policy doesn't model
        // per-block scope so we re-check the parent relationship here.
        abort_unless(
            $block->content_page_id === $contentPage->id
                && (request()->user()?->can('update', $contentPage) ?? false),
            403,
        );

        $this->service->delete($block);

        return back()->with('success', 'Block removed.');
    }

    public function reorder(ReorderContentBlocksRequest $request, ContentPage $contentPage): RedirectResponse
    {
        /** @var list<int> $order */
        $order = array_map('intval', (array) $request->validated('order'));

        $this->service->reorder($contentPage, $order);

        return back()->with('success', 'Order updated.');
    }

    /**
     * Tell the DTO which content fields need HTML sanitisation. Today only the rich-text
     * block ships sanitised content; adding more is a one-line entry per type.
     *
     * @return list<string>
     */
    private function richTextFieldsFor(string $type): array
    {
        return match ($type) {
            'rich_text' => ['body'],
            default => [],
        };
    }

    /**
     * Create a translation row per active locale so the editor never has to think
     * about "do I have a row yet" — the rows always exist.
     */
    private function seedDefaultTranslations(ContentBlock $block): void
    {
        $type = $this->registry->get($block->type);
        if ($type === null) {
            return;
        }

        $defaults = $type->defaultContent();
        $locales = \App\Models\Locale::where('is_active', true)->pluck('code');

        foreach ($locales as $locale) {
            $block->translations()->firstOrCreate(
                ['locale' => (string) $locale],
                ['content' => $defaults],
            );
        }
    }
}
