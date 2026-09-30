<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Cms\Blocks\BlockRegistry;
use App\Cms\Blocks\BlockType;
use App\Models\ContentPage;
use Illuminate\Validation\Rule;

class StoreContentBlockRequest extends ContentBlockFormRequest
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
        return [
            'type' => ['required', 'string', Rule::in(app(BlockRegistry::class)->keys())],
            ...$this->blockRules(),
        ];
    }

    public function blockType(): ?BlockType
    {
        $type = $this->input('type');

        return is_string($type) ? app(BlockRegistry::class)->get($type) : null;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            ...parent::messages(),
            'type.required' => 'Выберите тип блока.',
            'type.in' => 'Неизвестный тип блока.',
        ];
    }
}
