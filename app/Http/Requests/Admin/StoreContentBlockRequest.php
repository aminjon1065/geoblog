<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Cms\Blocks\BlockRegistry;
use App\Models\ContentPage;
use Illuminate\Foundation\Http\FormRequest;

class StoreContentBlockRequest extends FormRequest
{
    public function authorize(): bool
    {
        $page = $this->route('content_page');

        return $page instanceof ContentPage
            && ($this->user()?->can('update', $page) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $registry = app(BlockRegistry::class);
        $known = $registry->keys();

        return [
            'type' => ['required', 'string', 'in:'.implode(',', $known)],
            'settings' => ['nullable', 'array'],
            'translations' => ['nullable', 'array'],
            'translations.*' => ['array'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'type.in' => 'Unknown block type. Add it to the BlockRegistry before using it.',
        ];
    }
}
