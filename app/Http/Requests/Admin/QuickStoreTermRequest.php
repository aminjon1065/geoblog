<?php

namespace App\Http\Requests\Admin;

use App\Models\Category;
use App\Models\Tag;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A category or tag created on the fly from the post editor's side panel:
 * a name in the language being edited, the slug is made from it.
 */
class QuickStoreTermRequest extends FormRequest
{
    public function authorize(): bool
    {
        $model = $this->routeIs('admin.tags.quick') ? Tag::class : Category::class;

        return $this->user()?->can('create', $model) ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'locale' => [
                'required',
                'string',
                Rule::exists('locales', 'code')->where('is_active', true),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Введите название.',
            'name.max' => 'Название должно быть не длиннее 255 символов.',
            'locale.exists' => 'Такого языка на сайте нет.',
        ];
    }
}
