<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\ContentPage;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * "Действия ▾ → Применить" on the pages list: one action for the ticked
 * rows. The controller checks the permission the action needs per page.
 */
class BulkContentPageActionRequest extends FormRequest
{
    public const ACTIONS = ['publish', 'draft', 'delete'];

    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', ContentPage::class) ?? false;
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
            'ids.required' => 'Отметьте хотя бы одну страницу.',
            'ids.min' => 'Отметьте хотя бы одну страницу.',
            'ids.max' => 'За один раз можно обработать не больше 200 страниц.',
        ];
    }
}
