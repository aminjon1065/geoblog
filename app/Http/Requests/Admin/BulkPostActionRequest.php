<?php

namespace App\Http\Requests\Admin;

use App\Models\Post;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * "Действия ▾ → Применить" on the posts list: one action for the ticked rows.
 * Each post is authorized individually by the controller.
 */
class BulkPostActionRequest extends FormRequest
{
    public const ACTIONS = ['trash', 'restore', 'delete', 'publish', 'draft'];

    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Post::class) ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'action' => ['required', Rule::in(self::ACTIONS)],
            'ids' => ['required', 'array', 'min:1', 'max:200'],
            'ids.*' => ['integer'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'action.required' => 'Выберите действие.',
            'action.in' => 'Неизвестное действие.',
            'ids.required' => 'Отметьте хотя бы одну запись.',
            'ids.min' => 'Отметьте хотя бы одну запись.',
        ];
    }
}
