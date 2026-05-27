<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\ContentPage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReorderContentBlocksRequest extends FormRequest
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
        /** @var ContentPage|null $page */
        $page = $this->route('content_page');

        return [
            'order' => ['required', 'array', 'min:1'],
            'order.*' => [
                'integer',
                Rule::exists('content_blocks', 'id')
                    ->where(fn ($q) => $q->where('content_page_id', $page?->id ?? 0)),
            ],
        ];
    }
}
