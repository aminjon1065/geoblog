<?php

namespace App\Http\Requests\Admin;

use App\Models\Post;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * WordPress' "Свойства" (Quick Edit) on the posts list: the title in the
 * language the list shows, the address, date, status, the featured flag and
 * the taxonomy — without opening the editor.
 */
class QuickEditPostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('post')) ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'locale' => ['required', 'string', Rule::exists('locales', 'code')],
            'slug' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in([Post::STATUS_DRAFT, Post::STATUS_PENDING, Post::STATUS_PUBLISHED])],
            'published_at' => ['nullable', 'date'],
            'is_featured' => ['nullable', 'boolean'],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['integer', Rule::exists('categories', 'id')->whereNull('deleted_at')],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['integer', Rule::exists('tags', 'id')->whereNull('deleted_at')],
        ];
    }

    /**
     * @return array<int, \Closure(\Illuminate\Contracts\Validation\Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($this->input('status') === Post::STATUS_PUBLISHED && ! $this->canPublish()) {
                    $validator->errors()->add('status', 'У вас нет права публиковать записи.');
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Заголовок не может быть пустым.',
            'status.in' => 'Недопустимый статус записи.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'title' => 'заголовок',
            'slug' => 'ярлык',
            'published_at' => 'дата',
            'status' => 'статус',
        ];
    }

    public function canPublish(): bool
    {
        return $this->user()?->can('publish', Post::class) ?? false;
    }
}
