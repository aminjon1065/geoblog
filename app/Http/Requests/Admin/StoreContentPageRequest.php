<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\ContentPage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreContentPageRequest extends FormRequest
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
            'parent_id' => ['nullable', 'integer', 'exists:content_pages,id'],
            'slug' => [
                'required',
                'string',
                'max:191',
                'regex:/^[a-z0-9\-]+$/',
                Rule::unique('content_pages', 'slug')->where(function ($q) {
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

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'slug.regex' => 'Slug may contain only lowercase letters, digits, and hyphens.',
            'slug.unique' => 'A page with this slug already exists under the same parent.',
        ];
    }
}
