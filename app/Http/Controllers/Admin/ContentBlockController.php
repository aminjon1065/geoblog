<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Cms\Blocks\BlockType;
use App\DataTransferObjects\Content\ContentBlockData;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderContentBlocksRequest;
use App\Http\Requests\Admin\StoreContentBlockRequest;
use App\Http\Requests\Admin\UpdateContentBlockRequest;
use App\Models\ContentBlock;
use App\Models\ContentPage;
use App\Models\Locale;
use App\Services\Content\ContentBlockService;
use Illuminate\Http\RedirectResponse;

class ContentBlockController extends Controller
{
    public function __construct(private readonly ContentBlockService $service) {}

    public function store(StoreContentBlockRequest $request, ContentPage $contentPage): RedirectResponse
    {
        $type = $request->blockType();

        if ($type === null) {
            return back()->with('error', 'Неизвестный тип блока.');
        }

        $block = $this->service->create(
            $contentPage,
            ContentBlockData::fromRequest($request, $type),
        );

        // Seed any missing translation defaults so the editor always has a row to bind to.
        $this->seedDefaultTranslations($block, $type);

        return back()->with('success', "Блок «{$type->label()}» добавлен.");
    }

    public function update(
        UpdateContentBlockRequest $request,
        ContentPage $contentPage,
        ContentBlock $block,
    ): RedirectResponse {
        $type = $request->blockType();

        if ($type === null) {
            return back()->with('error', "Блоки типа «{$block->type}» больше не поддерживаются.");
        }

        $this->service->update($block, ContentBlockData::fromRequest($request, $type));

        return back()->with('success', 'Блок сохранён.');
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

        return back()->with('success', 'Блок удалён.');
    }

    public function reorder(ReorderContentBlocksRequest $request, ContentPage $contentPage): RedirectResponse
    {
        /** @var list<int> $order */
        $order = array_map('intval', (array) $request->validated('order'));

        $this->service->reorder($contentPage, $order);

        return back()->with('success', 'Порядок блоков сохранён.');
    }

    /**
     * Create a translation row per active locale so the editor never has to think
     * about "do I have a row yet" — the rows always exist.
     */
    private function seedDefaultTranslations(ContentBlock $block, BlockType $type): void
    {
        $defaults = $type->defaultContent();

        foreach (Locale::query()->where('is_active', true)->pluck('code') as $locale) {
            $block->translations()->firstOrCreate(
                ['locale' => (string) $locale],
                ['content' => $defaults],
            );
        }
    }
}
