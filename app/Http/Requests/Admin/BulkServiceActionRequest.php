<?php

namespace App\Http\Requests\Admin;

use App\Models\Service;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * "Действия ▾ → Применить" on the services list: one action for the ticked
 * rows. The controller checks the permission the action needs per service.
 */
class BulkServiceActionRequest extends FormRequest
{
    public const ACTIONS = ['activate', 'deactivate', 'delete'];

    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Service::class) ?? false;
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
            'ids.required' => 'Отметьте хотя бы одну услугу.',
            'ids.min' => 'Отметьте хотя бы одну услугу.',
            'ids.max' => 'За один раз можно обработать не больше 200 услуг.',
        ];
    }
}
