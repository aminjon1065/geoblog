<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Cms\Blocks\BlockRegistry;
use App\Cms\Blocks\BlockType;
use App\Models\ContentBlock;
use App\Models\ContentPage;
use Illuminate\Validation\Rule;

class UpdateContentBlockRequest extends ContentBlockFormRequest
{
    public function authorize(): bool
    {
        $page = $this->route('content_page');
        $block = $this->route('block');

        // Auth on the parent page — managing a block is part of managing its page.
        // Also assert the block actually belongs to the route's page so a tampered URL
        // can't reach across pages.
        if (! $page instanceof ContentPage || ! $block instanceof ContentBlock) {
            return false;
        }

        if ($block->content_page_id !== $page->id) {
            return false;
        }

        return $this->user()?->can('update', $page) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $block = $this->route('block');

        return [
            // The type is fixed at creation (ContentBlockService::update); the editor
            // sends it back unchanged, anything else is refused.
            'type' => ['sometimes', 'string', Rule::in($block instanceof ContentBlock ? [$block->type] : [])],
            ...$this->blockRules(),
        ];
    }

    public function blockType(): ?BlockType
    {
        $block = $this->route('block');

        return $block instanceof ContentBlock ? app(BlockRegistry::class)->get($block->type) : null;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            ...parent::messages(),
            'type.in' => 'Тип блока нельзя изменить.',
        ];
    }
}
