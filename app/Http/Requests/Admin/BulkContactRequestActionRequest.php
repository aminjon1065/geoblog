<?php

namespace App\Http\Requests\Admin;

use App\Models\ContactRequest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * "Действия ▾ → Применить" on the contact requests list (and "Отметить как
 * непрочитанную" on a request's screen): one action for the ticked rows.
 * The controller checks the permission the action needs.
 */
class BulkContactRequestActionRequest extends FormRequest
{
    public const ACTIONS = ['mark_read', 'mark_unread', 'delete'];

    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', ContactRequest::class) ?? false;
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
            // Where to go afterwards: back to the list, or to where the action came from.
            'redirect' => ['nullable', Rule::in(['index'])],
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
            'ids.required' => 'Отметьте хотя бы одну заявку.',
            'ids.min' => 'Отметьте хотя бы одну заявку.',
            'ids.max' => 'За один раз можно обработать не больше 200 заявок.',
        ];
    }
}
