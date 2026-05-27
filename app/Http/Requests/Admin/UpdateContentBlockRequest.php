<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\ContentBlock;
use App\Models\ContentPage;
use Illuminate\Foundation\Http\FormRequest;

class UpdateContentBlockRequest extends FormRequest
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
        return [
            // Type is fixed at creation — see ContentBlockService::update. We accept it in
            // the payload only to keep the DTO factory uniform.
            'type' => ['required', 'string'],
            'settings' => ['nullable', 'array'],
            'translations' => ['nullable', 'array'],
            'translations.*' => ['array'],
        ];
    }
}
