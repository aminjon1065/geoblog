<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', 'in:draft,published'],
            'published_at' => ['nullable', 'date'],
            'translations' => ['required', 'array'],
            'translations.*.title' => ['nullable', 'string', 'max:255'],
            'translations.*.excerpt' => ['nullable', 'string'],
            'translations.*.content' => ['nullable', 'string'],
            'translations.*.meta_title' => ['nullable', 'string', 'max:255'],
            'translations.*.meta_description' => ['nullable', 'string', 'max:500'],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['exists:categories,id'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['exists:tags,id'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(\Illuminate\Contracts\Validation\Validator $validator): void
    {
        $validator->after(function (\Illuminate\Contracts\Validation\Validator $validator) {
            $translations = $this->input('translations', []);
            $hasAtLeastOneTitle = false;

            foreach ($translations as $data) {
                if (! empty($data['title'])) {
                    $hasAtLeastOneTitle = true;
                    break;
                }
            }

            if (! $hasAtLeastOneTitle) {
                $validator->errors()->add('translations', 'At least one translation with a title is required.');
            }
        });
    }
}
