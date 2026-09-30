<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/**
 * "Действия → Удалить" on the 404 log. Same permission as deleting a single
 * entry: whoever manages redirects tidies the log.
 */
class BulkDestroyNotFoundLogsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('redirects.manage') ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['integer', 'distinct'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ids.required' => 'Отметьте хотя бы один адрес.',
            'ids.min' => 'Отметьте хотя бы один адрес.',
        ];
    }

    /**
     * @return list<int>
     */
    public function ids(): array
    {
        return array_values(array_map('intval', (array) $this->validated('ids', [])));
    }
}
