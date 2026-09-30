<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\Media;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * "Удалить выбранные навсегда" / bulk action of the list mode. The
 * controller additionally authorizes `delete` on every selected file.
 */
class BulkDestroyMediaRequest extends FormRequest
{
    public const MAX_IDS = 100;

    public function authorize(): bool
    {
        return $this->user()?->can('deleteAny', Media::class) ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1', 'max:'.self::MAX_IDS],
            'ids.*' => ['required', 'integer', 'distinct', Rule::exists('media', 'id')->withoutTrashed()],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'ids.required' => 'Выберите медиафайлы для удаления.',
            'ids.array' => 'Выберите медиафайлы для удаления.',
            'ids.min' => 'Выберите медиафайлы для удаления.',
            'ids.max' => 'За один раз можно удалить не больше '.self::MAX_IDS.' медиафайлов.',
            'ids.*.integer' => 'Неверный идентификатор медиафайла.',
            'ids.*.distinct' => 'Медиафайл выбран дважды.',
            'ids.*.exists' => 'Некоторые из выбранных медиафайлов уже удалены. Обновите страницу.',
        ];
    }

    /**
     * @return list<int>
     */
    public function ids(): array
    {
        return array_values(array_map('intval', (array) $this->validated('ids')));
    }
}
