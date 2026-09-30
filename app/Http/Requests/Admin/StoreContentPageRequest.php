<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\ContentPage;

class StoreContentPageRequest extends ContentPageFormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', ContentPage::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'parent_id' => ['nullable', 'integer', $this->existingParentRule()],
            // Left empty, the slug is made from the title (see ContentPageService).
            'slug' => [
                'nullable',
                'string',
                'max:191',
                'regex:/^[a-z0-9\-]+$/',
                $this->uniqueSlugRule(),
            ],
            ...$this->sharedRules(),
        ];
    }
}
