<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\ContentPage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContentPageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $target = $this->route('content_page');

        return $target instanceof ContentPage
            && ($this->user()?->can('update', $target) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var ContentPage|null $target */
        $target = $this->route('content_page');
        $id = $target?->id;

        return [
            'parent_id' => [
                'nullable',
                'integer',
                'exists:content_pages,id',
                function ($attribute, $value, $fail) use ($target) {
                    // Forbid self-parenting; the service walks the chain for deeper cycles.
                    if ($target !== null && (int) $value === $target->id) {
                        $fail('A page cannot be its own parent.');
                    }
                },
            ],
            'slug' => [
                'required',
                'string',
                'max:191',
                'regex:/^[a-z0-9\-]+$/',
                Rule::unique('content_pages', 'slug')
                    ->ignore($id)
                    ->where(function ($q) {
                        $parent = $this->input('parent_id');

                        return $parent === null || $parent === ''
                            ? $q->whereNull('parent_id')
                            : $q->where('parent_id', (int) $parent);
                    }),
            ],
            'status' => ['required', 'in:draft,published'],
            'template' => ['nullable', 'string', 'max:64'],
            'published_at' => ['nullable', 'date'],

            'translations' => ['required', 'array'],
            'translations.*.title' => ['nullable', 'string', 'max:255'],
            'translations.*.meta_title' => ['nullable', 'string', 'max:255'],
            'translations.*.meta_description' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator(\Illuminate\Contracts\Validation\Validator $validator): void
    {
        $validator->after(function (\Illuminate\Contracts\Validation\Validator $validator): void {
            $translations = (array) $this->input('translations', []);
            $hasTitle = false;
            foreach ($translations as $data) {
                if (! empty($data['title'])) {
                    $hasTitle = true;
                    break;
                }
            }
            if (! $hasTitle) {
                $validator->errors()->add('translations', 'At least one translation with a title is required.');
            }
        });
    }
}
